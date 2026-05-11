import { Task, TaskStatus, Workflow, AgentResult, ExecutionContext } from './types';
import { TaskGraph } from './taskGraph';
import { v4 as uuidv4 } from 'uuid';

type TaskExecutor = (context: ExecutionContext) => Promise<AgentResult>;

export class ExecutionScheduler {
  private workflows: Map<string, Workflow> = new Map();
  private graphs: Map<string, TaskGraph> = new Map();
  private runningTasks: Map<string, { taskId: string; startTime: Date }> = new Map();
  private taskExecutor: TaskExecutor | null = null;
  
  private readonly MAX_CONCURRENT_TASKS = 10;
  private readonly MAX_RETRIES = 3;
  private readonly TASK_TIMEOUT_MS = 300000;
  
  setExecutor(executor: TaskExecutor): void {
    this.taskExecutor = executor;
  }
  
  createWorkflow(name: string, trigger: string): Workflow {
    const workflow: Workflow = {
      id: uuidv4(),
      name,
      trigger,
      tasks: [],
      status: 'pending',
      createdAt: new Date(),
    };
    
    this.workflows.set(workflow.id, workflow);
    this.graphs.set(workflow.id, new TaskGraph());
    
    return workflow;
  }
  
  addTaskToWorkflow(workflowId: string, task: Task): void {
    const workflow = this.workflows.get(workflowId);
    const graph = this.graphs.get(workflowId);
    
    if (!workflow || !graph) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    workflow.tasks.push(task);
    graph.addTask(task);
  }
  
  async executeWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    const graph = this.graphs.get(workflowId);
    
    if (!workflow || !graph) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    workflow.status = 'running';
    console.log(`[Scheduler] Starting workflow: ${workflow.name} (${workflowId})`);
    
    const runningIds = new Set<string>();
    const results: Map<string, AgentResult> = new Map();
    
    while (!graph.isComplete()) {
      if (graph.hasFailures()) {
        console.log(`[Scheduler] Workflow failed - task failure detected`);
        workflow.status = 'failed';
        break;
      }
      
      if (runningIds.size >= this.MAX_CONCURRENT_TASKS) {
        await this.wait(1000);
        continue;
      }
      
      const readyTasks = graph.getReadyTasks(runningIds);
      const slotsAvailable = this.MAX_CONCURRENT_TASKS - runningIds.size;
      const tasksToRun = readyTasks.slice(0, slotsAvailable);
      
      for (const task of tasksToRun) {
        this.executeTask(workflowId, task, results, runningIds);
      }
      
      if (readyTasks.length === 0 && runningIds.size === 0) {
        break;
      }
      
      await this.wait(500);
    }
    
    if (graph.isComplete() && !graph.hasFailures()) {
      workflow.status = 'completed';
      workflow.completedAt = new Date();
      console.log(`[Scheduler] Workflow completed: ${workflow.name}`);
    }
    
    return workflow;
  }
  
  private async executeTask(
    workflowId: string,
    task: Task,
    results: Map<string, AgentResult>,
    runningIds: Set<string>
  ): Promise<void> {
    if (!this.taskExecutor) {
      console.error('[Scheduler] No task executor configured');
      return;
    }
    
    const graph = this.graphs.get(workflowId);
    if (!graph) return;
    
    runningIds.add(task.id);
    graph.updateTaskStatus(task.id, 'running');
    
    console.log(`[Scheduler] Running task: ${task.title} (agent: ${task.agentId})`);
    
    const context: ExecutionContext = {
      workflowId,
      taskId: task.id,
      agentId: task.agentId || 'unknown',
      input: task.input,
      startTime: new Date(),
    };
    
    try {
      const result = await this.executeWithTimeout(context);
      
      graph.updateTaskStatus(task.id, 'completed', result.output);
      results.set(task.id, result);
      
      console.log(`[Scheduler] Task completed: ${task.title} (${result.duration}ms)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      graph.updateTaskStatus(task.id, 'failed', undefined, errorMessage);
      
      results.set(task.id, {
        agentId: task.agentId || 'unknown',
        success: false,
        error: errorMessage,
        duration: 0,
      });
      
      console.error(`[Scheduler] Task failed: ${task.title} - ${errorMessage}`);
    } finally {
      runningIds.delete(task.id);
    }
  }
  
  private async executeWithTimeout(context: ExecutionContext): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'));
      }, this.TASK_TIMEOUT_MS);
      
      this.taskExecutor!(context)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }
  
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    
    workflow.status = 'cancelled';
    console.log(`[Scheduler] Workflow cancelled: ${workflowId}`);
    return true;
  }
  
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }
  
  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
  
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.workflows.values()).filter(w => w.status === 'running');
  }
  
  getWorkflowTasks(workflowId: string): Task[] {
    return this.graphs.get(workflowId)?.getAllTasks() || [];
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getRunningTaskCount(): number {
    return this.runningTasks.size;
  }
  
  getTaskCount(): number {
    return this.workflows.size;
  }
}

export const scheduler = new ExecutionScheduler();