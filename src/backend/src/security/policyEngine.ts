import { 
  AgentPolicy, 
  PolicyDecisionResult, 
  PolicyDecision, 
  RateLimitEntry,
  AuditLogEntry,
  RiskLevel
} from './types';
import { getToolDefinition, isToolRegistered, isHighRiskTool, requiresApproval } from './toolRegistry';
import { getPolicy } from './policies';
import { v4 as uuidv4 } from 'uuid';

export class PolicyEngine {
  private rateLimits: Map<string, RateLimitEntry[]> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private dailyCosts: Map<string, number> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  
  private readonly RATE_LIMIT_WINDOW_MS = 60000;
  private readonly COST_RESET_MS = 24 * 60 * 60 * 1000; // 24 hours

  validateAgent(agentId: string): AgentPolicy | null {
    const policy = getPolicy(agentId);
    if (!policy) {
      console.log(`[Policy] No policy found for agent: ${agentId}`);
      return null;
    }
    
    if (new Date(policy.validUntil) < new Date()) {
      console.log(`[Policy] Policy expired for agent: ${agentId}`);
      return null;
    }
    
    return policy;
  }

  validateToolAccess(agentId: string, toolName: string): PolicyDecisionResult {
    const decisionPath: string[] = [];
    decisionPath.push('identity_check');
    
    // Step 1: Check if agent has valid policy
    const policy = this.validateAgent(agentId);
    if (!policy) {
      return this.denyResult('Invalid or expired agent policy', toolName, decisionPath);
    }
    decisionPath.push('policy_valid');
    
    // Step 2: Check if tool is registered
    if (!isToolRegistered(toolName)) {
      return this.denyResult('Tool not registered in registry', toolName, decisionPath);
    }
    decisionPath.push('tool_registry_check');
    
    // Step 3: Check if agent has permission for this tool
    const hasPermission = policy.permissions.tools[toolName] === true;
    if (!hasPermission) {
      return this.denyResult('Agent does not have permission for this tool', toolName, decisionPath);
    }
    decisionPath.push('tool_permission_check');
    
    // Step 4: Check rate limits
    const rateLimitCheck = this.checkRateLimit(agentId, toolName);
    if (!rateLimitCheck.allowed) {
      return this.denyResult(`Rate limit exceeded: ${rateLimitCheck.message}`, toolName, decisionPath);
    }
    decisionPath.push('rate_limit_check');
    
    // Step 5: Check daily cost limit
    const costCheck = this.checkDailyCost(agentId, policy);
    if (!costCheck.allowed) {
      return this.denyResult(`Daily cost limit reached`, toolName, decisionPath);
    }
    decisionPath.push('cost_limit_check');
    
    // Step 6: Check if approval is required
    const toolDefinition = getToolDefinition(toolName);
    if (toolDefinition?.approvalRequired) {
      decisionPath.push('approval_required');
      return {
        decision: 'ESCALATE_TO_HUMAN',
        reason: `Tool ${toolName} requires human approval`,
        toolName,
        escalationId: uuidv4(),
      };
    }
    decisionPath.push('approval_not_required');
    
    // Step 7: Check if action requires approval based on agent policy
    const riskLevel = toolDefinition?.risk || 'low';
    if (this.requiresPolicyApproval(riskLevel, policy)) {
      return {
        decision: 'ESCALATE_TO_HUMAN',
        reason: `High-risk action requires approval`,
        toolName,
        escalationId: uuidv4(),
      };
    }
    
    decisionPath.push('final_allow');
    
    return {
      decision: 'ALLOW',
      reason: 'All checks passed',
      toolName,
    };
  }

  private requiresPolicyApproval(riskLevel: RiskLevel, policy: AgentPolicy): boolean {
    const highRiskCategories = policy.approvalRequired;
    
    if (riskLevel === 'critical') return true;
    if (riskLevel === 'high' && highRiskCategories.includes('production_changes')) return true;
    if (riskLevel === 'high' && highRiskCategories.includes('financial_actions')) return true;
    if (riskLevel === 'high' && highRiskCategories.includes('security_changes')) return true;
    
    return false;
  }

  private checkRateLimit(agentId: string, toolName: string): { allowed: boolean; message?: string } {
    const key = `${agentId}:${toolName}`;
    const now = new Date();
    
    let entries = this.rateLimits.get(key) || [];
    entries = entries.filter(e => now.getTime() - e.windowStart.getTime() < this.RATE_LIMIT_WINDOW_MS);
    
    const toolDefinition = getToolDefinition(toolName);
    const maxRequests = toolDefinition?.rateLimitPerMinute || 60;
    
    if (entries.length >= maxRequests) {
      return { allowed: false, message: `Rate limit: ${maxRequests}/min` };
    }
    
    entries.push({ agentId, toolName, count: 1, windowStart: now });
    this.rateLimits.set(key, entries);
    
    return { allowed: true };
  }

  private checkDailyCost(agentId: string, policy: AgentPolicy): { allowed: boolean; message?: string } {
    const today = new Date().toDateString();
    const costKey = `${agentId}:${today}`;
    const currentCost = this.dailyCosts.get(costKey) || 0;
    
    if (currentCost >= policy.limits.maxDailyCostUsd) {
      return { allowed: false, message: 'Daily cost limit reached' };
    }
    
    return { allowed: true };
  }

  private denyResult(reason: string, toolName: string, decisionPath: string[]): PolicyDecisionResult {
    return {
      decision: 'DENY',
      reason,
      toolName,
    };
  }

  recordAction(agentId: string, toolName: string, result: PolicyDecision): void {
    // Add to audit log
    const entry: AuditLogEntry = {
      id: uuidv4(),
      agentId,
      action: result === 'ALLOW' ? 'executed' : 'blocked',
      toolName,
      input: {},
      decisionPath: [],
      result,
      timestamp: new Date(),
      riskLevel: getToolDefinition(toolName)?.risk || 'low',
    };
    
    this.auditLog.push(entry);
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
    
    // Track request counts
    const key = agentId;
    const now = Date.now();
    let counts = this.requestCounts.get(key) || [];
    counts = counts.filter(t => now - t < 60000);
    counts.push(now);
    this.requestCounts.set(key, counts);
  }

  getAuditLog(agentId?: string, limit: number = 100): AuditLogEntry[] {
    const logs = agentId 
      ? this.auditLog.filter(l => l.agentId === agentId)
      : this.auditLog;
    
    return logs.slice(-limit);
  }

  getAgentStats(agentId: string): { requestsPerMinute: number; isRateLimited: boolean } {
    const now = Date.now();
    const counts = this.requestCounts.get(agentId) || [];
    const requestsPerMinute = counts.filter(t => now - t < 60000).length;
    
    return {
      requestsPerMinute,
      isRateLimited: requestsPerMinute >= 60,
    };
  }

  resetDailyCosts(): void {
    this.dailyCosts.clear();
  }

  checkDataAccess(agentId: string, dataType: string, accessLevel: 'read' | 'write'): boolean {
    const policy = this.validateAgent(agentId);
    if (!policy) return false;
    
    const allowedLevel = policy.permissions.dataAccess[dataType as keyof typeof policy.permissions.dataAccess];
    if (!allowedLevel) return false;
    
    if (accessLevel === 'read') {
      return allowedLevel === 'read' || allowedLevel === 'read_write' || allowedLevel === 'full';
    }
    
    if (accessLevel === 'write') {
      return allowedLevel === 'write' || allowedLevel === 'read_write' || allowedLevel === 'full';
    }
    
    return false;
  }

  checkDomainAccess(agentId: string, domain: string): boolean {
    const policy = this.validateAgent(agentId);
    if (!policy) return false;
    
    return policy.domain.includes(domain);
  }
}

export const policyEngine = new PolicyEngine();