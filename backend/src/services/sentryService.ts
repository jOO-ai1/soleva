// TODO: Update Sentry to v8 API compatibility
// Temporarily disabled to avoid compilation errors
import { Express } from 'express';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  beforeSend?: (event: any) => any;
  sensitiveFields?: string[];
}

export const initializeSentry = (_sentryConfig: SentryConfig) => {
  console.log('Sentry initialization disabled - requires API update to v8');
  // TODO: Implement with @sentry/node v8+ API
};

export const setupSentryMiddleware = (_app: Express) => {
  console.log('Sentry middleware disabled - requires API update to v8');
  // TODO: Implement with @sentry/node v8+ API
};

export const setupSentryErrorHandler = (_app: Express) => {
  console.log('Sentry error handler disabled - requires API update to v8');
  // TODO: Implement with @sentry/node v8+ API
};

export class SentryService {
  private static instance: SentryService;
  private initialized = false;

  private constructor() {}

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  initialize(_config: SentryConfig): void {
    console.log('SentryService initialize disabled - requires API update to v8');
    this.initialized = false;
  }

  captureException(error: Error, _context?: any) {
    console.error('Error (Sentry disabled):', error);
    // TODO: Implement with @sentry/node v8+ API
  }

  captureMessage(message: string, level: string = 'info', _context?: any) {
    console.log(`Message (Sentry disabled) [${level}]:`, message);
    // TODO: Implement with @sentry/node v8+ API
  }

  setUser(user: { id: string; email?: string; role?: string }) {
    console.log('Set user (Sentry disabled):', user.id);
    // TODO: Implement with @sentry/node v8+ API
  }

  clearUser() {
    console.log('Clear user (Sentry disabled)');
    // TODO: Implement with @sentry/node v8+ API
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: string; data?: any }) {
    console.log('Breadcrumb (Sentry disabled):', breadcrumb.message);
    // TODO: Implement with @sentry/node v8+ API
  }

  startTransaction(name: string, op: string): any {
    console.log(`Transaction started (Sentry disabled): ${name} [${op}]`);
    // TODO: Implement with @sentry/node v8+ API
    return null;
  }

  withTransaction(name: string, op: string, callback: (transaction: any) => Promise<any>): Promise<any> {
    console.log(`Transaction (Sentry disabled): ${name} [${op}]`);
    return callback(null);
  }

  getCurrentHub(): any {
    console.log('Get current hub (Sentry disabled)');
    // TODO: Implement with @sentry/node v8+ API
    return null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const sentryService = SentryService.getInstance();