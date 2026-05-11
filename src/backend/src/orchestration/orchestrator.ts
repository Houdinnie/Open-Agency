import { EventContext, Workflow, Task, TaskPriority } from './types';
import { scheduler, ExecutionScheduler } from './scheduler';
import { createTask, TaskGraph } from './taskGraph';
import { policyEngine } from '../security/policyEngine';
import { escalationManager } from '../security/escalation';
import { v4 as uuidv4 } from 'uuid';

type EventClassifier = (event: EventContext) => Promise<string>;
type AgentExecutor = (agentId: string, input: Record<string, unknown>) => Promise<unknown>;

export class OrchestrationEngine {
  private eventClassifier: EventClassifier | null = null;
  private agentExecutor: AgentExecutor | null = null;
  private workflowHistory: Workflow[] = [];
  private readonly MAX_HISTORY = 500;
  
  setEventClassifier(classifier: EventClassifier): void {
    this.eventClassifier = classifier;
  }
  
  setAgentExecutor(executor: AgentExecutor): void {
    this.agentExecutor = executor;
    scheduler.setExecutor(this.executeAgent.bind(this));
  }
  
  async routeEvent(event: EventContext): Promise<string> {
    console.log(`[Orchestrator] Routing event: ${event.type}`);
    
    if (this.eventClassifier) {
      return this.eventClassifier(event);
    }
    
    return this.defaultClassification(event);
  }
  
  private defaultClassification(event: EventContext): string {
    const type = event.type;
    if (type.includes('lead') || type.includes('growth')) return 'growth_workflow';
    if (type.includes('code') || type.includes('bug')) return 'code_workflow';
    if (type.includes('error') || type.includes('failure')) return 'triage_workflow';
    if (type.includes('pricing') || type.includes('revenue')) return 'pricing_workflow';
    return 'default_workflow';
  }
  
  async createPlan(workflowType: string, goal: string, context: Record<string, unknown>): Promise<Task[]> {
    console.log(`[Orchestrator] Creating plan for: ${workflowType}`);
    
    const tasks = this.getWorkflowTasks(workflowType, context);
    
    return tasks;
  }
  
  private getWorkflowTasks(workflowType: string, context: Record<string, unknown>): Task[] {
    switch (workflowType) {
      case 'growth_workflow':
        return this.growthWorkflow(context);
      case 'code_workflow':
        return this.codeWorkflow(context);
      case 'triage_workflow':
        return this.triageWorkflow(context);
      case 'pricing_workflow':
        return this.pricingWorkflow(context);
      default:
        return this.defaultWorkflow(context);
    }
  }
  
  private growthWorkflow(context: Record<string, unknown>): Task[] {
    return [
      createTask('Analyze leads and segments', 'research-agent', 'high', [], context),
      createTask('Generate growth strategy', 'planner-agent', 'high', [], context),
      createTask('Create outreach campaign', 'growth-agent', 'medium', [0], context),
      createTask('Execute outreach', 'sales-agent', 'medium', [1], context),
      createTask('Review and approve content', 'reviewer-agent', 'high', [2], context),
    ];
  }
  
  private codeWorkflow(context: Record<string, unknown>): Task[] {
    return [
      createTask('Analyze code issue', 'research-agent', 'critical', [], context),
      createTask('Plan fix implementation', 'planner-agent', 'high', [], context),
      createTask('Implement fix', 'code-agent', 'high', [0], context),
      createTask('Review code changes', 'reviewer-agent', 'high', [2], context),
      createTask('Execute deployment', 'executor-agent', 'high', [3], context),
      createTask('Verify deployment', 'verifier-agent', 'medium', [4], context),
    ];
  }
  
  private triageWorkflow(context: Record<string, unknown>): Task[] {
    return [
      createTask('Classify error/triage event', 'triage-agent', 'critical', [], context),
      createTask('Generate fix proposal', 'triage-agent', 'high', [0], context),
      createTask('Review fix', 'reviewer-agent', 'high', [1], context),
      createTask('Apply fix', 'code-agent', 'high', [2], context),
      createTask('Verify fix', 'verifier-agent', 'high', [3], context),
    ];
  }
  
  private pricingWorkflow(context: Record<string, unknown>): Task[] {
    return [
      createTask('Analyze market and competitors', 'research-agent', 'high', [], context),
      createTask('Calculate optimal pricing', 'pricing-agent', 'high', [0], context),
      createTask('Review pricing decision', 'reviewer-agent', 'high', [1], context),
      createTask('Escalate if needed', 'executor-agent', 'high', [2], context),
    ];
  }
  
  private defaultWorkflow(context: Record<string, unknown>): Task[] {
    return [
      createTask('Process request', 'router-agent', 'medium', [], context),
      createTask('Plan execution', 'planner-agent', 'medium', [0], context),
    ];
  }
  
  async executeWorkflow(workflowType: string, context: Record<string, unknown>): Promise<Workflow> {
    const workflow = scheduler.createWorkflow(workflowType, 'event_trigger');
    
    const tasks = await this.createPlan(workflowType, '', context);
    tasks.forEach(task => scheduler.addTaskToWorkflow(workflow.id, task));
    
    const result = await scheduler.executeWorkflow(workflow.id);
    
    this.workflowHistory.push(result);
    if (this.workflowHistory.length > this.MAX_HISTORY) {
      this.workflowHistory.shift();
    }
    
    return result;
  }
  
  private async executeAgent(context: { workflowId: string; taskId: string; agentId: string; input: Record<string, unknown> }): Promise<{ agentId: string; success: boolean; output?: unknown; error?: string; duration: number }> {
    const startTime = Date.now();
    
    const policyCheck = policyEngine.validateAgent(context.agentId);
    if (!policyCheck) {
      return {
        agentId: context.agentId,
        success: false,
        error: 'Invalid agent policy',
        duration: Date.now() - startTime,
      };
    }
    
    if (!this.agentExecutor) {
      return {
        agentId: context.agentId,
        success: false,
        error: 'No agent executor configured',
        duration: Date.now() - startTime,
      };
    }
    
    try {
      const output = await this.agentExecutor(context.agentId, context.input);
      
      policyEngine.recordAction(context.agentId, 'agent_execution', 'ALLOW');
      
      return {
        agentId: context.agentId,
        success: true,
        output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      policyEngine.recordAction(context.agentId, 'agent_execution', 'DENY');
      
      return {
        agentId: context.agentId,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }
  
  reviewOutput(output: unknown, context: Record<string, unknown>): { approved: boolean; feedback?: string } {
    console.log(`[Orchestrator] Reviewing output`);
    
    if (output === null || output === undefined) {
      return { approved: false, feedback: 'Empty output' };
    }
    
    if (typeof output === 'object' && 'error' in output) {
      return { approved: false, feedback: 'Output contains errors' };
    }
    
    return { approved: true };
  }
  
  verifyOutcome(workflowId: string): { success: boolean; metrics: Record<string, unknown> } {
    const workflow = scheduler.getWorkflow(workflowId);
    if (!workflow) {
      return { success: false, metrics: { error: 'Workflow not found' } };
    }
    
    const tasks = scheduler.getWorkflowTasks(workflowId);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const failedTasks = tasks.filter(t => t.status === 'failed');
    
    const metrics = {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      successRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
      status: workflow.status,
    };
    
    return {
      success: workflow.status === 'completed',
      metrics,
    };
  }
  
  getWorkflowHistory(): Workflow[] {
    return this.workflowHistory;
  }
  
  getActiveWorkflows(): Workflow[] {
    return scheduler.getActiveWorkflows();
  }
  
  getPendingEscalations() {
    return escalationManager.getPendingEscalations();
  }
}

export const orchestrator = new OrchestrationEngine();