/**
 * Enhanced Environment Configuration Handler
 * Handles environment variables and fallback configurations
 */

interface EnvironmentConfig {
  apiUrl: string;
  chatApiUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  enableOfflineMode: boolean;
  apiTimeout: number;
  enableMockData: boolean;
}

class EnvironmentConfigHandler {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    console.info('🔧 Environment configuration loaded:', this.config);
  }

  private loadConfiguration(): EnvironmentConfig {
    const isProduction = import.meta.env.PROD;
    const isDevelopment = import.meta.env.DEV;

    // Primary API URL sources (in order of preference)
    const apiUrl = this.getApiUrl();
    
    // Chat-specific API URL
    const chatApiUrl = this.getChatApiUrl() || apiUrl;

    return {
      apiUrl,
      chatApiUrl,
      isProduction,
      isDevelopment,
      enableOfflineMode: this.getBoolean('VITE_ENABLE_OFFLINE_MODE', false),
      apiTimeout: this.getNumber('VITE_API_TIMEOUT', 10000),
      enableMockData: this.getBoolean('VITE_ENABLE_MOCK_DATA', isDevelopment)
    };
  }

  private getApiUrl(): string {
    // Try multiple environment variable names
    const envUrls = [
      import.meta.env.VITE_API_URL,
      import.meta.env.VITE_API_BASE_URL,
      import.meta.env.VITE_BACKEND_URL,
      import.meta.env.VITE_SERVER_URL
    ].filter(Boolean);

    if (envUrls.length > 0) {
      return envUrls[0];
    }

    // Production fallback
    if (import.meta.env.PROD) {
      // Try to construct from current domain
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // Common production API patterns
      const possibleUrls = [
        `${protocol}//api.${hostname}`,
        `${protocol}//${hostname}/api`,
        `${protocol}//${hostname.replace('www.', 'api.')}`,
        'https://api.solevaeg.com/api/v1'
      ];

      return possibleUrls[0];
    }

    // Development fallback
    return 'http://localhost:3001/api';
  }

  private getChatApiUrl(): string | null {
    return import.meta.env.VITE_CHAT_API_URL || null;
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private validateConfiguration(): void {
    const issues: string[] = [];

    if (!this.config.apiUrl) {
      issues.push('API URL is not configured');
    }

    if (this.config.apiTimeout < 1000) {
      issues.push('API timeout is too low (minimum 1000ms recommended)');
    }

    if (issues.length > 0) {
      console.warn('⚠️ Environment configuration issues:', issues);
    }
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public getApiUrl(): string {
    return this.config?.apiUrl || 'http://localhost:3001/api';
  }

  public getChatApiUrl(): string {
    return this.config?.chatApiUrl || this.config?.apiUrl || 'http://localhost:3001/api';
  }

  public isOfflineModeEnabled(): boolean {
    return this.config.enableOfflineMode;
  }

  public shouldUseMockData(): boolean {
    return this.config.enableMockData;
  }

  public getTimeout(): number {
    return this.config.apiTimeout;
  }

  public isDev(): boolean {
    return this.config.isDevelopment;
  }

  public isProd(): boolean {
    return this.config.isProduction;
  }
}

// Export singleton instance
export const environmentConfig = new EnvironmentConfigHandler();

// Convenience exports with null checks
export const getApiUrl = () => {
  try {
    return environmentConfig.getApiUrl();
  } catch {
    return 'http://localhost:3001/api';
  }
};

export const getChatApiUrl = () => {
  try {
    return environmentConfig.getChatApiUrl();
  } catch {
    return 'http://localhost:3001/api';
  }
};

export const isOfflineModeEnabled = () => {
  try {
    return environmentConfig.isOfflineModeEnabled();
  } catch {
    return false;
  }
};

export const shouldUseMockData = () => {
  try {
    return environmentConfig.shouldUseMockData();
  } catch {
    return true;
  }
};

export const getApiTimeout = () => {
  try {
    return environmentConfig.getTimeout();
  } catch {
    return 10000;
  }
};
