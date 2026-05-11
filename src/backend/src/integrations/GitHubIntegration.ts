import { v4 as uuidv4 } from 'uuid';

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  head: string;
  base: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  status: 'pending' | 'approved' | 'changes_requested' | 'merged';
  reviews: GitHubReview[];
  checks: GitHubCheck[];
}

export interface GitHubReview {
  id: number;
  author: string;
  state: 'approved' | 'changes_requested' | 'commented' | 'pending';
  body?: string;
}

export interface GitHubCheck {
  name: string;
  status: 'pending' | 'success' | 'failure';
  conclusion?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export class GitHubIntegration {
  private token: string;
  private owner: string;
  private repo: string;
  private isConnected = false;
  private pullRequests: Map<number, GitHubPullRequest> = new Map();
  private commits: GitHubCommit[] = [];

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPO || '';
  }

  connect(): void {
    if (this.token && this.owner && this.repo) {
      this.isConnected = true;
      console.log('🐙 GitHub integration connected');
    } else {
      console.log('⚠️ GitHub credentials not configured - running in mock mode');
      this.isConnected = true;
    }
  }

  async createPullRequest(input: {
    title: string;
    body?: string;
    head: string;
    base?: string;
  }): Promise<GitHubPullRequest> {
    const pr: GitHubPullRequest = {
      id: Date.now(),
      number: this.pullRequests.size + 1,
      title: input.title,
      body: input.body,
      state: 'open',
      head: input.head,
      base: input.base || 'main',
      author: 'hermes[bot]',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      reviews: [],
      checks: [
        { name: 'CI Test', status: 'pending' },
        { name: 'Lint', status: 'pending' },
        { name: 'Type Check', status: 'pending' },
      ],
    };

    this.pullRequests.set(pr.id, pr);

    console.log(`🐙 Created PR #${pr.number}: ${pr.title}`);

    return pr;
  }

  async getPullRequest(prId: number): Promise<GitHubPullRequest | undefined> {
    return this.pullRequests.get(prId);
  }

  async getPullRequests(filter?: { state?: string }): Promise<GitHubPullRequest[]> {
    let prs = Array.from(this.pullRequests.values());
    
    if (filter?.state) {
      prs = prs.filter(pr => pr.state === filter.state);
    }

    return prs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updatePRStatus(prId: number, status: GitHubPullRequest['status']): Promise<boolean> {
    const pr = this.pullRequests.get(prId);
    if (pr) {
      pr.status = status;
      pr.updatedAt = new Date();
      
      if (status === 'merged') {
        pr.state = 'merged';
        pr.mergedAt = new Date();
      }
      
      return true;
    }
    return false;
  }

  async addReview(prId: number, review: Omit<GitHubReview, 'id'>): Promise<boolean> {
    const pr = this.pullRequests.get(prId);
    if (pr) {
      pr.reviews.push({ ...review, id: Date.now() });
      
      if (review.state === 'approved') {
        pr.status = 'approved';
      } else if (review.state === 'changes_requested') {
        pr.status = 'changes_requested';
      }
      
      return true;
    }
    return false;
  }

  async updateCheck(prId: number, checkName: string, result: 'success' | 'failure'): Promise<boolean> {
    const pr = this.pullRequests.get(prId);
    if (!pr) return false;

    const check = pr.checks.find(c => c.name === checkName);
    if (check) {
      check.status = result === 'success' ? 'success' : 'failure';
      check.conclusion = result;
    }

    const allPassed = pr.checks.every(c => c.status === 'success');
    const anyFailed = pr.checks.some(c => c.status === 'failure');

    if (allPassed) {
      pr.status = 'approved';
    } else if (anyFailed) {
      pr.status = 'changes_requested';
    }

    return true;
  }

  async mergePullRequest(prId: number): Promise<boolean> {
    const pr = this.pullRequests.get(prId);
    if (!pr) return false;

    pr.status = 'merged';
    pr.state = 'merged';
    pr.mergedAt = new Date();
    pr.updatedAt = new Date();

    console.log(`🔀 Merged PR #${pr.number}: ${pr.title}`);

    return true;
  }

  async getCommits(limit = 10): Promise<GitHubCommit[]> {
    if (this.commits.length === 0) {
      this.commits = [
        { sha: 'abc123', message: 'fix: resolve type error in API handler', author: 'hermes[bot]', date: new Date() },
        { sha: 'def456', message: 'feat: add new pricing tier', author: 'hermes[bot]', date: new Date(Date.now() - 86400000) },
        { sha: 'ghi789', message: 'chore: update dependencies', author: 'hermes[bot]', date: new Date(Date.now() - 172800000) },
      ];
    }

    return this.commits.slice(0, limit);
  }

  async getStats(): Promise<{
    openPRs: number;
    mergedPRs: number;
    pendingReviews: number;
    failedChecks: number;
  }> {
    const prs = Array.from(this.pullRequests.values());

    return {
      openPRs: prs.filter(pr => pr.state === 'open').length,
      mergedPRs: prs.filter(pr => pr.state === 'merged').length,
      pendingReviews: prs.filter(pr => pr.status === 'pending').length,
      failedChecks: prs.filter(pr => pr.checks.some(c => c.status === 'failure')).length,
    };
  }
}

export const githubIntegration = new GitHubIntegration();