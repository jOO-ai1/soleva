
import React from 'react';
import { Alert, Button, Card, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface ErrorHandlerProps {
  error?: Error | null;
  resetError?: () => void;
  showReload?: boolean;
  showHome?: boolean;
  title?: string;
  description?: string;
  type?: 'error' | 'warning' | 'network' | 'permission';
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  resetError,
  showReload = true,
  showHome = false,
  title,
  description,
  type = 'error'
}) => {
  const getErrorInfo = () => {
    switch (type) {
      case 'network':
        return {
          title: title || 'Network Error',
          description: description || 'Unable to connect to the server. Please check your internet connection.',
          icon: <WarningOutlined style={{ color: 'var(--warning)' }} />
        };
      case 'permission':
        return {
          title: title || 'Access Denied',
          description: description || 'You don\'t have permission to access this resource.',
          icon: <WarningOutlined style={{ color: 'var(--error)' }} />
        };
      case 'warning':
        return {
          title: title || 'Warning',
          description: description || 'Something needs your attention.',
          icon: <WarningOutlined style={{ color: 'var(--warning)' }} />
        };
      default:
        return {
          title: title || 'Something went wrong',
          description: description || error?.message || 'An unexpected error occurred.',
          icon: <WarningOutlined style={{ color: 'var(--error)' }} />
        };
    }
  };

  const errorInfo = getErrorInfo();

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  return (
    <div className="flex items-center justify-center min-h-96 p-6">
      <Card className="card-luxury max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">
            {errorInfo.icon}
          </div>
          <Title level={3} style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {errorInfo.title}
          </Title>
          <Paragraph style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {errorInfo.description}
          </Paragraph>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <Alert
            message="Development Error Details"
            description={
              <div style={{ textAlign: 'left', marginTop: '8px' }}>
                <code style={{ 
                  background: 'var(--surface-light)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  display: 'block',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {error.stack || error.message}
                </code>
              </div>
            }
            type="info"
            className="mb-6"
            style={{ textAlign: 'left' }}
          />
        )}

        <Space size="middle">
          {showReload && (
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={handleReload}
              className="btn-primary"
            >
              Try Again
            </Button>
          )}
          {showHome && (
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleGoHome}
              className="btn-ghost"
            >
              Go to Dashboard
            </Button>
          )}
        </Space>

        <div className="mt-6 pt-4 border-t border-gray-600">
          <Paragraph style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Error ID: {Date.now().toString(36).toUpperCase()}
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default ErrorHandler;
