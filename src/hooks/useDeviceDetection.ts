import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  cpuCores: number;
  memoryGB: number | null;
  connectionType: string;
  isLowSpec: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  adaptiveModeEnabled: boolean;
}

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  inp: number | null; // Interaction to Next Paint
  cls: number | null; // Cumulative Layout Shift
  loadTime: number;
}

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const { theme, setTheme } = useTheme();

  const detectDevice = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const cpuCores = navigator.hardwareConcurrency || 1;

    // Memory detection (Chrome only)
    const memoryGB = (navigator as any).deviceMemory || null;

    // Connection detection
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = connection?.effectiveType || 'unknown';

    // Device type detection
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad/i.test(userAgent) || screenWidth >= 768 && screenWidth <= 1024) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }
    } else if (screenWidth <= 768) {
      deviceType = 'mobile';
    } else if (screenWidth <= 1024) {
      deviceType = 'tablet';
    }

    // OS detection
    let os = 'unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';else
    if (/Mac/i.test(userAgent)) os = 'macOS';else
    if (/Linux/i.test(userAgent)) os = 'Linux';else
    if (/Android/i.test(userAgent)) os = 'Android';else
    if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

    // Browser detection
    let browser = 'unknown';
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';else
    if (/Firefox/i.test(userAgent)) browser = 'Firefox';else
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';else
    if (/Edge/i.test(userAgent)) browser = 'Edge';

    // Performance level assessment
    const performanceScore = calculatePerformanceScore({
      cpuCores,
      memoryGB,
      connectionType,
      deviceType,
      screenWidth,
      devicePixelRatio
    });

    const isLowSpec = performanceScore < 40;
    const performanceLevel: 'low' | 'medium' | 'high' =
    performanceScore < 40 ? 'low' :
    performanceScore < 70 ? 'medium' : 'high';

    return {
      deviceType,
      os,
      browser,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      cpuCores,
      memoryGB,
      connectionType,
      isLowSpec,
      performanceLevel,
      adaptiveModeEnabled: isLowSpec
    };
  };

  const calculatePerformanceScore = (params: {
    cpuCores: number;
    memoryGB: number | null;
    connectionType: string;
    deviceType: string;
    screenWidth: number;
    devicePixelRatio: number;
  }): number => {
    let score = 50; // Base score

    // CPU cores impact
    score += Math.min(params.cpuCores * 10, 30);

    // Memory impact
    if (params.memoryGB) {
      score += Math.min(params.memoryGB * 5, 25);
    }

    // Connection impact
    const connectionScores: Record<string, number> = {
      'slow-2g': -20,
      '2g': -15,
      '3g': -10,
      '4g': 10,
      '5g': 20,
      'wifi': 15
    };
    score += connectionScores[params.connectionType] || 0;

    // Device type impact
    const deviceScores: Record<string, number> = {
      'mobile': -10,
      'tablet': 0,
      'desktop': 10
    };
    score += deviceScores[params.deviceType] || 0;

    // High DPI penalty for low-end devices
    if (params.devicePixelRatio > 2 && params.screenWidth < 1200) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  };

  const measurePerformanceMetrics = (): Promise<PerformanceMetrics> => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      // Use PerformanceObserver for modern metrics
      const metrics: Partial<PerformanceMetrics> = {
        loadTime: startTime,
        fcp: null,
        lcp: null,
        inp: null,
        cls: null
      };

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.fcp = entries[0].startTime;
        }
        fcpObserver.disconnect();
      });

      try {
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {




        // FCP observation not supported
      } // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {const entries = list.getEntries();if (entries.length > 0) {
            metrics.lcp = entries[entries.length - 1].startTime;
          }
        });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {




        // LCP observation not supported
      } // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {let clsValue = 0;for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {




        // CLS observation not supported
      } // Interaction to Next Paint (experimental)
      const inpObserver = new PerformanceObserver((list) => {const entries = list.getEntries();if (entries.length > 0) {
            metrics.inp = Math.max(...entries.map((entry) => (entry as any).processingDuration || 0));
          }
        });

      try {
        inpObserver.observe({ entryTypes: ['event'] });
      } catch (e) {




        // INP observation not supported
      } // Resolve after a delay to collect metrics
      setTimeout(() => {fcpObserver.disconnect();lcpObserver.disconnect();
          clsObserver.disconnect();
          inpObserver.disconnect();

          metrics.loadTime = performance.now() - startTime;
          resolve(metrics as PerformanceMetrics);
        }, 5000);
    });
  };

  const logDeviceData = async (deviceInfo: DeviceInfo, metrics: PerformanceMetrics) => {
    try {
      // Get IP and location info
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();

      const logData = {
        ...deviceInfo,
        ...metrics,
        ipAddress: ipData.ip,
        country: ipData.country_name,
        city: ipData.city,
        timestamp: new Date().toISOString()
      };

      // Send to backend
      await fetch('/api/v1/analytics/device-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {




      // Failed to log device data
    }};const enableAdaptiveMode = (deviceInfo: DeviceInfo) => {if (deviceInfo.isLowSpec) {
      // Force light mode for better performance
      if (theme === 'dark') {
        setTheme('light');
        // Adaptive mode: Switched to light theme for better performance
      }

      // Reduce animation intensity
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.style.setProperty('--transition-duration', '0.1s');

      // Add adaptive mode class
      document.body.classList.add('adaptive-mode');

      // Disable heavy effects
      const style = document.createElement('style');
      style.textContent = `
        .adaptive-mode .glass {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: rgba(255, 255, 255, 0.95) !important;
        }
        .adaptive-mode .animate-liquid-float,
        .adaptive-mode .animate-smooth-bounce,
        .adaptive-mode .animate-gentle-rotate {
          animation: none !important;
        }
        .adaptive-mode .product-card:hover {
          transform: none !important;
        }
        .adaptive-mode .interactive-hover:hover {
          transform: translateY(-2px) !important;
        }
      `;
      document.head.appendChild(style);

      // Adaptive mode enabled: Reduced animations and effects for low-spec device
    }
  };

  useEffect(() => {
    const initializeDeviceDetection = async () => {
      // Detect device capabilities
      const device = detectDevice();
      setDeviceInfo(device);

      // Measure performance metrics
      const metrics = await measurePerformanceMetrics();
      setPerformanceMetrics(metrics);

      // Enable adaptive mode if needed
      enableAdaptiveMode(device);

      // Log data to backend
      await logDeviceData(device, metrics);
    };

    // Run detection after initial render
    setTimeout(initializeDeviceDetection, 1000);
  }, []);

  return {
    deviceInfo,
    performanceMetrics,
    isAdaptiveModeEnabled: deviceInfo?.adaptiveModeEnabled || false
  };
};