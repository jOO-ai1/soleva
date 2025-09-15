import axios from 'axios';

interface UptimeConfig {
  webhookUrl: string;
  interval: number; // in milliseconds
  enabled: boolean;
}

class UptimeService {
  private static instance: UptimeService;
  private intervalId: NodeJS.Timeout | null = null;
  private config: UptimeConfig;

  private constructor() {
    this.config = {
      webhookUrl: process.env.UPTIME_WEBHOOK_URL || '',
      interval: 5 * 60 * 1000, // 5 minutes
      enabled: !!(process.env.UPTIME_WEBHOOK_URL && process.env.UPTIME_WEBHOOK_URL.trim() !== '')
    };
  }

  static getInstance(): UptimeService {
    if (!UptimeService.instance) {
      UptimeService.instance = new UptimeService();
    }
    return UptimeService.instance;
  }

  start(): void {
    // Check if uptime monitoring is enabled
    if (!this.config.enabled) {
      console.log('Uptime monitoring skipped - UPTIME_WEBHOOK_URL not configured');
      return;
    }

    console.log('Starting uptime monitoring...');
    
    // Send initial heartbeat
    this.sendHeartbeat();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Uptime monitoring stopped');
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const payload = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'solevaeg-api',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      await axios.post(this.config.webhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Soleva-Uptime-Monitor/1.0'
        }
      });

      console.log('Uptime heartbeat sent successfully');
    } catch (error) {
      console.error('Failed to send uptime heartbeat:', error);
    }
  }

  async sendAlert(message: string, level: 'info' | 'warning' | 'error' = 'error'): Promise<void> {
    // Check if uptime monitoring is enabled
    if (!this.config.enabled) {
      console.log(`Uptime alert skipped - UPTIME_WEBHOOK_URL not configured: ${message}`);
      return;
    }

    try {
      const payload = {
        status: level,
        message,
        timestamp: new Date().toISOString(),
        service: 'solevaeg-api',
        uptime: process.uptime()
      };

      await axios.post(this.config.webhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Soleva-Uptime-Monitor/1.0'
        }
      });

      console.log(`Uptime alert sent: ${message}`);
    } catch (error) {
      console.error('Failed to send uptime alert:', error);
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): UptimeConfig {
    return { ...this.config };
  }
}

export const uptimeService = UptimeService.getInstance();
export default uptimeService;
