import React from 'react';
const { Component } = React;
import { FiAlertTriangle, FiRefreshCw, FiMessageCircle } from 'react-icons/fi';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onReport: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReport
}) => {
  const isArabic = document.documentElement.dir === 'rtl' ||
  document.documentElement.lang === 'ar';

  return (
    <div className="chat-error-fallback">
      <div className="error-content">
        <div className="error-icon">
          <FiAlertTriangle size={48} />
        </div>
        
        <h3 className="error-title">
          {isArabic ? 'حدث خطأ في المحادثة' : 'Chat Error Occurred'}
        </h3>
        
        <p className="error-description">
          {isArabic ?
          'عذراً، حدث خطأ غير متوقع في نظام المحادثة. يمكنك المحاولة مرة أخرى أو الاتصال بنا مباشرة.' :
          'Sorry, an unexpected error occurred in the chat system. You can try again or contact us directly.'
          }
        </p>

        {error &&
        <details className="error-details">
            <summary>
              {isArabic ? 'تفاصيل الخطأ التقنية' : 'Technical Error Details'}
            </summary>
            <pre className="error-stack">
              <strong>Error:</strong> {error.message}
              {error.stack &&
            <>
                  <br />
                  <strong>Stack:</strong>
                  <br />
                  {error.stack}
                </>
            }
            </pre>
          </details>
        }

        <div className="error-actions">
          <button onClick={onRetry} className="retry-button">
            <FiRefreshCw size={16} />
            {isArabic ? 'إعادة المحاولة' : 'Retry Chat'}
          </button>
          
          <button onClick={onReport} className="report-button">
            <FiMessageCircle size={16} />
            {isArabic ? 'تواصل معنا' : 'Contact Us'}
          </button>
        </div>

        <div className="error-help">
          <p>
            {isArabic ?
            'يمكنك أيضاً تجديد الصفحة أو مسح ذاكرة التخزين المؤقت للمتصفح.' :
            'You can also refresh the page or clear your browser cache.'
            }
          </p>
        </div>
      </div>

      <style>{`
        .chat-error-fallback {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 400px;
          max-width: calc(100vw - 48px);
          background: var(--glass-bg);
          backdrop-filter: blur(30px);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          overflow: hidden;
        }

        .error-content {
          padding: 24px;
          text-align: center;
        }

        .error-icon {
          color: #f59e0b;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .error-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 16px 0;
        }

        .error-details {
          text-align: left;
          margin: 16px 0;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          overflow: hidden;
        }

        .error-details summary {
          padding: 8px 12px;
          background: var(--bg-secondary);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .error-details summary:hover {
          background: var(--bg-primary);
        }

        .error-stack {
          padding: 12px;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          background: var(--bg-primary);
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
        }

        .error-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
        }

        .retry-button,
        .report-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button {
          background: var(--primary);
          color: white;
        }

        .retry-button:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }

        .report-button {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
        }

        .report-button:hover {
          background: var(--bg-primary);
        }

        .error-help {
          font-size: 12px;
          color: var(--text-secondary);
          padding-top: 16px;
          border-top: 1px solid var(--border-primary);
        }

        .error-help p {
          margin: 0;
        }

        @media (max-width: 480px) {
          .chat-error-fallback {
            bottom: 16px;
            right: 16px;
            left: 16px;
            width: auto;
          }

          .error-actions {
            flex-direction: column;
          }

          .retry-button,
          .report-button {
            width: 100%;
            justify-content: center;
          }
        }

        /* Dark theme */
        [data-theme="dark"] .chat-error-fallback {
          background: rgba(10, 10, 10, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>);

};

class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `chat_error_${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Chat Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo?: React.ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    console.error('🔍 Chat error report:', errorData);

    // Here you could send to your error reporting service
    try {






























      // Example: Sentry, LogRocket, or custom endpoint
      // window.gtag?.('event', 'exception', {
      //   description: error.message,
      //   fatal: false
      // });
    } catch (reportingError) {console.error('Failed to report chat error:', reportingError);}};private handleRetry = () => {console.info('🔄 Retrying chat after error...'); // Clear error state
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: '' }); // Clear any potentially corrupted chat data
    try {sessionStorage.removeItem('chat_state');sessionStorage.removeItem('chat_messages');sessionStorage.removeItem('chat_conversation');} catch (e) {console.warn('Could not clear chat storage:', e);}};private handleReport = () => {console.info('📞 Redirecting to contact form...'); // Open contact form or phone number
    const contactUrl = window.location.origin + '/contact';window.open(contactUrl, '_blank');};
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReport={this.handleReport} />);


    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;