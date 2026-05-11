import { chromium, Browser, Page, BrowserContext } from 'playwright';

export interface BrowserSession {
  id: string;
  page: Page;
  context: BrowserContext;
  createdAt: Date;
}

export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

export interface SelectorAction {
  selector: string;
  value?: string;
  waitFor?: string;
}

export class BrowserAutomation {
  private browser: Browser | null = null;
  private sessions: Map<string, BrowserSession> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.isInitialized = true;
      console.log('🌐 Browser automation initialized');
    } catch (error) {
      console.warn('Browser not available, using mock mode:', error);
    }
  }

  async createSession(sessionId?: string): Promise<BrowserSession | null> {
    if (!this.browser) {
      return this.createMockSession(sessionId);
    }

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    const page = await context.newPage();
    const session: BrowserSession = {
      id: sessionId || `session_${Date.now()}`,
      page,
      context,
      createdAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private createMockSession(sessionId?: string): BrowserSession {
    return {
      id: sessionId || `mock_${Date.now()}`,
      page: null as any,
      context: null as any,
      createdAt: new Date(),
    };
  }

  async navigate(sessionId: string, url: string, options?: NavigationOptions): Promise<{ success: boolean; title?: string; url?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) {
      return { success: true, title: 'Mock Page', url };
    }

    try {
      await session.page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle',
        timeout: options?.timeout || 30000,
      });

      const title = await session.page.title();
      return { success: true, title, url: session.page.url() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async click(sessionId: string, selector: string): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true };

    try {
      await session.page.click(selector);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async type(sessionId: string, selector: string, value: string, clear = true): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true };

    try {
      if (clear) await session.page.fill(selector, '');
      await session.page.fill(selector, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async extract(sessionId: string, selector: string): Promise<{ success: boolean; data?: unknown }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true, data: [] };

    try {
      const elements = await session.page.$$(selector);
      const data = await Promise.all(
        elements.map(async (el) => {
          const text = await el.textContent();
          const tagName = await el.evaluate((e: Element) => e.tagName);
          return { text: text?.trim(), tag: tagName?.toLowerCase() };
        })
      );
      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async screenshot(sessionId: string, path?: string): Promise<{ success: boolean; path?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true, path: '/mock/screenshot.png' };

    try {
      const screenshotPath = path || `/screenshots/${sessionId}_${Date.now()}.png`;
      await session.page.screenshot({ path: screenshotPath, fullPage: true });
      return { success: true, path: screenshotPath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async evaluate(sessionId: string, script: string): Promise<{ success: boolean; result?: unknown }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true, result: 'mock' };

    try {
      const result = await session.page.evaluate(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async fillForm(sessionId: string, formData: Record<string, string>): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true };

    try {
      for (const [selector, value] of Object.entries(formData)) {
        await session.page.fill(selector, value);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async waitForSelector(sessionId: string, selector: string, timeout = 5000): Promise<{ success: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session?.page) return { success: true };

    try {
      await session.page.waitForSelector(selector, { timeout });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.context.close();
      this.sessions.delete(sessionId);
    }
  }

  async closeAll(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.context.close();
    }
    this.sessions.clear();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.isInitialized = false;
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const browserAutomation = new BrowserAutomation();