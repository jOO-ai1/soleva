/**
 * Environment-specific error handling and setup recovery
 */

export interface EnvironmentInfo {
  isDocker: boolean;
  isZorinOS: boolean;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  hasSSL: boolean;
  hasNginx: boolean;
  networkType: 'bridged' | 'nat' | 'host' | 'unknown';
  dnsSettings: 'manual' | 'auto' | 'unknown';
}

export interface SetupError {
  type: 'network' | 'ssl' | 'dns' | 'docker' | 'database' | 'uuid' | 'ui_flow';
  message: string;
  context: Record<string, any>;
  recoverable: boolean;
  solutions: string[];
}

class EnvironmentHandler {
  private environmentInfo: EnvironmentInfo;
  private setupErrors: SetupError[] = [];

  constructor() {
    this.environmentInfo = this.detectEnvironment();
    this.initializeHandlers();
  }

  private detectEnvironment(): EnvironmentInfo {
    const userAgent = navigator.userAgent;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    return {
      isDocker: this.detectDocker(),
      isZorinOS: this.detectZorinOS(),
      browser: this.detectBrowser(),
      hasSSL: protocol === 'https:',
      hasNginx: this.detectNginx(),
      networkType: this.detectNetworkType(),
      dnsSettings: this.detectDNSSettings()
    };
  }

  private detectDocker(): boolean {
    // Check for common Docker indicators
    const hostname = window.location.hostname;
    const userAgent = navigator.userAgent;

    return hostname.includes('docker') ||
    hostname.includes('container') ||
    // Check for typical Docker internal IPs
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    // Check for Docker-style hostnames
    /^[a-f0-9]{12}$/.test(hostname);
  }

  private detectZorinOS(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    return userAgent.includes('zorin') ||
    platform.includes('zorin') ||
    // Check for Ubuntu base (Zorin is Ubuntu-based)
    userAgent.includes('ubuntu') && userAgent.includes('gnome');
  }

  private detectBrowser(): EnvironmentInfo['browser'] {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edg')) return 'edge';
    return 'unknown';
  }

  private detectNginx(): boolean {
    // Check for Nginx-specific headers (would need server cooperation)
    // For now, we'll assume Nginx if SSL is present in production
    return window.location.protocol === 'https:' &&
    !window.location.hostname.includes('localhost');
  }

  private detectNetworkType(): EnvironmentInfo['networkType'] {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'host';
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return 'nat';
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return 'bridged';
    return 'unknown';
  }

  private detectDNSSettings(): EnvironmentInfo['dnsSettings'] {
    // This is hard to detect client-side, but we can make educated guesses
    const hostname = window.location.hostname;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return 'manual';
    if (hostname.includes('.local')) return 'manual';
    return 'auto';
  }

  private initializeHandlers() {
    // Set up global error handlers specific to environment
    this.setupNetworkErrorHandler();
    this.setupUUIDErrorHandler();
    this.setupDatabaseErrorHandler();
    this.setupUIFlowErrorHandler();
  }

  private setupNetworkErrorHandler() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        const setupError = this.createNetworkSetupError(error, args[0]);
        this.handleSetupError(setupError);
        throw error;
      }
    };
  }

  private setupUUIDErrorHandler() {
    // Monitor for UUID-related errors in console
    const originalConsoleError = console.error;

    console.error = (...args) => {
      const message = args.join(' ').toLowerCase();

      if (message.includes('uuid') || message.includes('unique identifier')) {
        const setupError: SetupError = {
          type: 'uuid',
          message: 'UUID generation or validation error detected',
          context: { args, timestamp: Date.now() },
          recoverable: true,
          solutions: [
          'Clear browser cache and cookies',
          'Restart the application',
          'Check for duplicate session storage',
          'Verify UUID library is properly loaded']

        };

        this.handleSetupError(setupError);
      }

      originalConsoleError(...args);
    };
  }

  private setupDatabaseErrorHandler() {
    // Listen for database setup errors
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;

      if (this.isDatabaseError(error)) {
        const setupError: SetupError = {
          type: 'database',
          message: 'Database setup or connection error',
          context: { error: error.message, stack: error.stack },
          recoverable: true,
          solutions: [
          'Retry database initialization',
          'Clear application data',
          'Check database permissions',
          'Verify Supabase configuration']

        };

        this.handleSetupError(setupError);
        event.preventDefault(); // Prevent unhandled rejection
      }
    });
  }

  private setupUIFlowErrorHandler() {
    // Monitor for UI flow blockages
    let lastUIInteraction = Date.now();

    document.addEventListener('click', () => {
      lastUIInteraction = Date.now();
    });

    // Check for UI blockages every 30 seconds
    setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastUIInteraction;

      // If no interactions for 5 minutes and errors present, might be UI blockage
      if (timeSinceLastInteraction > 300000 && this.setupErrors.length > 0) {
        const setupError: SetupError = {
          type: 'ui_flow',
          message: 'Potential UI flow blockage detected',
          context: {
            timeSinceLastInteraction,
            activeErrors: this.setupErrors.length
          },
          recoverable: true,
          solutions: [
          'Refresh the page',
          'Clear browser cache',
          'Restart the application',
          'Check browser console for errors']

        };

        this.handleSetupError(setupError);
      }
    }, 30000);
  }

  private createNetworkSetupError(error: any, url: string | URL): SetupError {
    const urlString = typeof url === 'string' ? url : url.toString();

    let solutions: string[] = [];

    if (this.environmentInfo.isDocker) {
      solutions.push(...[
      'Check Docker network configuration',
      'Verify container port mappings',
      'Restart Docker container',
      'Check Docker bridge network settings']
      );
    }

    if (this.environmentInfo.hasSSL) {
      solutions.push(...[
      'Verify SSL certificate validity',
      'Check Nginx SSL configuration',
      'Try HTTP instead of HTTPS for development']
      );
    }

    if (this.environmentInfo.dnsSettings === 'manual') {
      solutions.push(...[
      'Verify DNS settings',
      'Try using IP address instead of hostname',
      'Flush DNS cache']
      );
    }

    solutions.push(...[
    'Check internet connectivity',
    'Verify firewall settings',
    'Restart network services']
    );

    return {
      type: 'network',
      message: `Network connectivity error during setup: ${error.message}`,
      context: {
        url: urlString,
        error: error.message,
        environment: this.environmentInfo
      },
      recoverable: true,
      solutions
    };
  }

  private isDatabaseError(error: any): boolean {
    if (!error || typeof error !== 'object') return false;

    const message = (error.message || '').toLowerCase();
    return message.includes('database') ||
    message.includes('supabase') ||
    message.includes('postgresql') ||
    message.includes('connection refused') ||
    message.includes('table') ||
    message.includes('sql');
  }

  private handleSetupError(error: SetupError) {
    console.warn(`🔧 Setup Error Detected [${error.type.toUpperCase()}]:`, error);

    // Add to error list if not already present
    const existingError = this.setupErrors.find((e) =>
    e.type === error.type && e.message === error.message
    );

    if (!existingError) {
      this.setupErrors.push(error);
    }

    // Auto-recovery for certain error types
    if (error.recoverable) {
      this.attemptAutoRecovery(error);
    }

    // Notify user about the error and available solutions
    this.notifyUser(error);
  }

  private attemptAutoRecovery(error: SetupError) {
    console.info(`🔄 Attempting auto-recovery for ${error.type} error...`);

    switch (error.type) {
      case 'network':
        this.recoverNetworkError();
        break;
      case 'uuid':
        this.recoverUUIDError();
        break;
      case 'database':
        this.recoverDatabaseError();
        break;
      case 'ui_flow':
        this.recoverUIFlowError();
        break;
    }
  }

  private recoverNetworkError() {
    // Try to bypass network checks where appropriate
    console.info('📡 Enabling offline mode and fallback data...');

    // Store fallback mode in session
    sessionStorage.setItem('fallbackMode', 'true');
    sessionStorage.setItem('offlineMode', 'true');
  }

  private recoverUUIDError() {
    // Clear potentially corrupted UUID data
    console.info('🆔 Clearing UUID cache and regenerating...');

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('uuid') || key.includes('id'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  private recoverDatabaseError() {
    // Enable fallback data mode
    console.info('🗄️ Enabling database fallback mode...');

    sessionStorage.setItem('databaseFallback', 'true');
    sessionStorage.setItem('useMockData', 'true');
  }

  private recoverUIFlowError() {
    // Clear potential UI state issues
    console.info('🖥️ Clearing UI state and refreshing...');

    // Clear form data and UI state
    sessionStorage.removeItem('formData');
    sessionStorage.removeItem('uiState');

    // Refresh after a delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  private notifyUser(error: SetupError) {
    // Create user-friendly notification
    const notification = {
      title: this.getErrorTitle(error.type),
      message: this.getErrorMessage(error.type),
      solutions: error.solutions.slice(0, 3), // Show top 3 solutions
      timestamp: Date.now()
    };

    console.info('📢 User notification:', notification);

    // In a real app, this would show a toast or modal
    if (window.showNotification) {
      (window as any).showNotification(notification);
    }
  }

  private getErrorTitle(type: SetupError['type']): string {
    const titles = {
      network: 'Connection Issues',
      ssl: 'Security Configuration',
      dns: 'DNS Resolution',
      docker: 'Container Configuration',
      database: 'Database Setup',
      uuid: 'ID Generation',
      ui_flow: 'Interface Issues'
    };

    return titles[type] || 'Setup Issue';
  }

  private getErrorMessage(type: SetupError['type']): string {
    const messages = {
      network: 'Having trouble connecting to our servers. Working on alternatives...',
      ssl: 'SSL configuration needs attention. Switching to fallback mode...',
      dns: 'DNS resolution issues detected. Using alternative methods...',
      docker: 'Container environment needs adjustment. Applying fixes...',
      database: 'Database setup issues detected. Using offline mode...',
      uuid: 'ID generation problems found. Cleaning up and retrying...',
      ui_flow: 'Interface blockage detected. Refreshing components...'
    };

    return messages[type] || 'Setup issue detected. Applying automatic fixes...';
  }

  public getEnvironmentInfo(): EnvironmentInfo {
    return { ...this.environmentInfo };
  }

  public getSetupErrors(): SetupError[] {
    return [...this.setupErrors];
  }

  public clearError(type: SetupError['type']) {
    this.setupErrors = this.setupErrors.filter((error) => error.type !== type);
  }

  public clearAllErrors() {
    this.setupErrors = [];
  }

  public isRecoveryMode(): boolean {
    return sessionStorage.getItem('fallbackMode') === 'true' ||
    sessionStorage.getItem('offlineMode') === 'true' ||
    sessionStorage.getItem('databaseFallback') === 'true';
  }

  public exitRecoveryMode() {
    sessionStorage.removeItem('fallbackMode');
    sessionStorage.removeItem('offlineMode');
    sessionStorage.removeItem('databaseFallback');
    sessionStorage.removeItem('useMockData');
    this.clearAllErrors();
    console.info('✅ Exited recovery mode');
  }
}

export const environmentHandler = new EnvironmentHandler();

// Utility functions
export const isRecoveryMode = () => environmentHandler.isRecoveryMode();
export const getEnvironmentInfo = () => environmentHandler.getEnvironmentInfo();
export const getSetupErrors = () => environmentHandler.getSetupErrors();