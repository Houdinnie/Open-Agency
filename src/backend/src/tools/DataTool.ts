import { BaseTool, ToolResult } from './ToolRegistry.js';

export class NotionTool extends BaseTool {
  constructor() {
    super('notion', 'productivity', 'Notion workspace integration');
  }

  registerActions(): void {
    this.actions.set('createPage', this.createPage.bind(this));
    this.actions.set('updatePage', this.updatePage.bind(this));
    this.actions.set('query', this.query.bind(this));
    this.actions.set('createDatabase', this.createDatabase.bind(this));
  }

  private async createPage(input: Record<string, unknown>): Promise<ToolResult> {
    const title = input.title as string;
    const content = input.content as string;
    const parentId = input.parentId as string;
    
    return {
      success: true,
      data: {
        id: `page_${Date.now()}`,
        title,
        createdAt: new Date(),
      },
    };
  }

  private async updatePage(input: Record<string, unknown>): Promise<ToolResult> {
    const pageId = input.pageId as string;
    const properties = input.properties as Record<string, unknown>;
    
    return { success: true, data: { id: pageId, updated: true } };
  }

  private async query(input: Record<string, unknown>): Promise<ToolResult> {
    const databaseId = input.databaseId as string;
    return { success: true, data: { results: [], count: 0 } };
  }

  private async createDatabase(input: Record<string, unknown>): Promise<ToolResult> {
    const name = input.name as string;
    return { success: true, data: { id: `db_${Date.now()}`, name } };
  }
}

export class GoogleSheetsTool extends BaseTool {
  constructor() {
    super('sheets', 'data', 'Google Sheets integration');
  }

  registerActions(): void {
    this.actions.set('read', this.read.bind(this));
    this.actions.set('write', this.write.bind(this));
    this.actions.set('append', this.append.bind(this));
  }

  private async read(input: Record<string, unknown>): Promise<ToolResult> {
    const spreadsheetId = input.spreadsheetId as string;
    const range = input.range as string;
    
    return {
      success: true,
      data: {
        values: [['Header', 'Data'], ['Value1', 'Value2']],
        range: range || 'Sheet1!A1:Z100',
      },
    };
  }

  private async write(input: Record<string, unknown>): Promise<ToolResult> {
    const spreadsheetId = input.spreadsheetId as string;
    const range = input.range as string;
    const values = input.values as string[][];
    
    return { success: true, data: { updated: true, range } };
  }

  private async append(input: Record<string, unknown>): Promise<ToolResult> {
    const spreadsheetId = input.spreadsheetId as string;
    const values = input.values as string[];
    
    return { success: true, data: { appended: values.length, row: Date.now() } };
  }
}

export class GitHubTool extends BaseTool {
  constructor() {
    super('github', 'development', 'GitHub integration');
  }

  registerActions(): void {
    this.actions.set('createIssue', this.createIssue.bind(this));
    this.actions.set('createPR', this.createPR.bind(this));
    this.actions.set('runAction', this.runAction.bind(this));
    this.actions.set('getRepoInfo', this.getRepoInfo.bind(this));
  }

  private async createIssue(input: Record<string, unknown>): Promise<ToolResult> {
    const title = input.title as string;
    const body = input.body as string;
    
    return { success: true, data: { number: Date.now(), title, state: 'open' } };
  }

  private async createPR(input: Record<string, unknown>): Promise<ToolResult> {
    const title = input.title as string;
    const head = input.head as string;
    const base = input.base as string;
    
    return { success: true, data: { number: Date.now(), title, state: 'open' } };
  }

  private async runAction(input: Record<string, unknown>): Promise<ToolResult> {
    const workflow = input.workflow as string;
    return { success: true, data: { runId: Date.now(), workflow } };
  }

  private async getRepoInfo(input: Record<string, unknown>): Promise<ToolResult> {
    const repo = input.repo as string;
    return { success: true, data: { name: repo, stars: 0, forks: 0 } };
  }
}

import { toolRegistry } from './ToolRegistry.js';
toolRegistry.register(new NotionTool());
toolRegistry.register(new GoogleSheetsTool());
toolRegistry.register(new GitHubTool());