// Sentry service is disabled due to missing dependencies
// Uncomment and install @sentry/react and @sentry/tracing to enable

import React from 'react';

// Placeholder service for when Sentry is disabled
class PlaceholderSentryService {
  init() {






































    // Sentry initialization disabled
  }captureException(_error: Error, _context?: Record<string, any>) {


    // Error tracking disabled
  }captureMessage(_message: string, _level?: string, _context?: Record<string, any>) {


    // Message tracking disabled
  }capturePerformance(_name: string, _duration: number, _context?: Record<string, any>) {


    // Performance tracking disabled
  }setUser(_user: {id: string;email?: string;name?: string;}) {


    // User tracking disabled
  }clearUser() {


    // User clearing disabled
  }addBreadcrumb(_breadcrumb: {message: string;category?: string;level?: string;}) {


    // Breadcrumb tracking disabled
  }startTransaction(_name: string, _op: string) {// Transaction tracking disabled
    return { setTag: () => {}, setData: () => {}, finish: () => {} };}} // React Error Boundary component
export const SentryErrorBoundary = ({ children }: {children: React.ReactNode;}) => children;export default new PlaceholderSentryService();