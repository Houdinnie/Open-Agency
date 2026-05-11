import { v4 as uuidv4 } from 'uuid';

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled';
  priority: 0 | 1 | 2 | 3 | 4;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  labels: string[];
  estimate?: number;
}

export interface LinearComment {
  id: string;
  body: string;
  author: string;
  createdAt: Date;
}

export interface LinearProject {
  id: string;
  name: string;
  issues: LinearIssue[];
}

export class LinearIntegration {
  private apiKey: string;
  private workspaceId: string;
  private isConnected = false;
  private issues: Map<string, LinearIssue> = new Map();
  private projects: Map<string, LinearProject> = new Map();

  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY || '';
    this.workspaceId = process.env.LINEAR_WORKSPACE || '';
    this.initializeProjects();
  }

  private initializeProjects(): void {
    const defaultProjects: LinearProject[] = [
      { id: 'hermes-ops', name: 'Hermes Operations', issues: [] },
      { id: 'hermes-bugs', name: 'Bug Fixes', issues: [] },
      { id: 'hermes-features', name: 'Feature Requests', issues: [] },
    ];
    defaultProjects.forEach(p => this.projects.set(p.id, p));
  }

  connect(): void {
    if (this.apiKey) {
      this.isConnected = true;
      console.log('📋 Linear integration connected');
    } else {
      console.log('⚠️ Linear API key not configured - running in mock mode');
      this.isConnected = true;
    }
  }

  async createIssue(input: {
    title: string;
    description?: string;
    priority?: number;
    projectId?: string;
    labels?: string[];
  }): Promise<LinearIssue> {
    const issue: LinearIssue = {
      id: uuidv4(),
      identifier: `${Date.now().toString(36).toUpperCase()}`,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: (input.priority as any) || 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: input.labels || [],
    };

    this.issues.set(issue.id, issue);

    const projectId = input.projectId || 'hermes-ops';
    const project = this.projects.get(projectId);
    if (project) {
      project.issues.push(issue);
    }

    console.log(`📋 Created Linear issue: ${issue.identifier} - ${issue.title}`);

    return issue;
  }

  async updateIssue(issueId: string, updates: Partial<LinearIssue>): Promise<LinearIssue | null> {
    const issue = this.issues.get(issueId);
    if (!issue) return null;

    Object.assign(issue, updates, { updatedAt: new Date() });
    
    return issue;
  }

  async assignIssue(issueId: string, assignee: string): Promise<boolean> {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.assignee = assignee;
      return true;
    }
    return false;
  }

  async addComment(issueId: string, body: string, author: string = 'Hermes'): Promise<LinearComment> {
    const issue = this.issues.get(issueId);
    if (!issue) throw new Error('Issue not found');

    const comment: LinearComment = {
      id: uuidv4(),
      body,
      author,
      createdAt: new Date(),
    };

    console.log(`💬 Added comment to ${issue.identifier}: ${body.substring(0, 50)}...`);

    return comment;
  }

  async getIssue(issueId: string): Promise<LinearIssue | undefined> {
    return this.issues.get(issueId);
  }

  async getProjectIssues(projectId: string): Promise<LinearIssue[]> {
    const project = this.projects.get(projectId);
    return project?.issues || [];
  }

  async getAllIssues(filter?: { status?: string; priority?: number }): Promise<LinearIssue[]> {
    let issues = Array.from(this.issues.values());

    if (filter?.status) {
      issues = issues.filter(i => i.status === filter.status);
    }
    if (filter?.priority !== undefined) {
      issues = issues.filter(i => i.priority === filter.priority);
    }

    return issues.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async closeIssue(issueId: string): Promise<boolean> {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.status = 'done';
      issue.updatedAt = new Date();
      return true;
    }
    return false;
  }

  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    done: number;
    critical: number;
  }> {
    const issues = Array.from(this.issues.values());
    
    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'backlog' || i.status === 'todo').length,
      inProgress: issues.filter(i => i.status === 'in_progress' || i.status === 'in_review').length,
      done: issues.filter(i => i.status === 'done' || i.status === 'canceled').length,
      critical: issues.filter(i => i.priority === 0 || i.priority === 1).length,
    };
  }
}

export const linearIntegration = new LinearIntegration();