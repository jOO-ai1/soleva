import { useState } from 'react';
import { Form, Input, Button, Card, message, Alert, Space, Divider, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const { login } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password, twoFactorToken);
      
      if (result.success) {
        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          message.info(t('twoFactorRequired'));
        } else {
          message.success(t('loginSuccess'));
          navigate('/dashboard');
        }
      } else {
        message.error(result.message || t('loginError'));
      }
    } catch (error) {
      message.error(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async () => {
    if (!twoFactorToken) {
      message.error(t('enterTwoFactorCode'));
      return;
    }

    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const result = await login(values.email, values.password, twoFactorToken);
      
      if (result.success) {
        message.success(t('loginSuccess'));
        navigate('/dashboard');
      } else {
        message.error(result.message || t('invalidTwoFactorCode'));
        setTwoFactorToken('');
      }
    } catch (error) {
      message.error(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="admin-layout" 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        padding: 'var(--space-4)',
      }}
    >
      <div style={{ 
        position: 'absolute', 
        top: '24px', 
        [isRTL ? 'left' : 'right']: '24px',
        zIndex: 10,
      }}>
        <LanguageSwitcher />
      </div>
      
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <Card className="glass animate-fade-in-scale" style={{
          border: 'none',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--space-8)',
            padding: 'var(--space-6) var(--space-6) 0',
          }}>
            <div style={{
              margin: '0 auto var(--space-6)',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px var(--primary-300)',
            }}>
              <UserOutlined style={{ fontSize: '32px', color: '#000000' }} />
            </div>
            <Title level={2} style={{ 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-2)',
              fontWeight: '700',
            }}>
              Soleva Admin
            </Title>
            <Text style={{ 
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
            }}>
              {t('signInToAccount')}
            </Text>
          </div>

          {!requiresTwoFactor ? (
            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              style={{ padding: '0 var(--space-6) var(--space-6)' }}
            >
              <Form.Item
                name="email"
                label={<Text strong style={{ color: 'var(--text-primary)' }}>{t('email')}</Text>}
                rules={[
                  { required: true, message: t('required') },
                  { type: 'email', message: t('invalidEmail') }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />}
                  placeholder="admin@solevaeg.com"
                  className="form-input"
                  style={{
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text strong style={{ color: 'var(--text-primary)' }}>{t('password')}</Text>}
                rules={[
                  { required: true, message: t('required') },
                  { min: 6, message: t('minLength', { min: 6 }) }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />}
                  placeholder={t('enterPassword')}
                  className="form-input"
                  style={{
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 'var(--space-6)' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '48px',
                    fontSize: 'var(--text-base)',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    border: 'none',
                    boxShadow: '0 6px 20px var(--primary-300)',
                  }}
                >
                  {t('login')}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <div>
              <Alert
                message="Two-Factor Authentication Required"
                description="Please enter the 6-digit code from your authenticator app."
                type="info"
                showIcon
                className="mb-6"
              />
              
              <Form layout="vertical" size="large">
                <Form.Item label="2FA Code">
                  <Input
                    prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                    placeholder="000000"
                    value={twoFactorToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorToken(e.target.value)}
                    maxLength={6}
                  />
                </Form.Item>

                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    onClick={handleTwoFactorSubmit}
                    loading={loading}
                    className="w-full h-12 text-lg font-medium"
                  >
                    Verify & Sign In
                  </Button>
                  
                  <Button
                    type="link"
                    onClick={() => {
                      setRequiresTwoFactor(false);
                      setTwoFactorToken('');
                    }}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </Space>
              </Form>
            </div>
          )}

          <Divider className="my-6" />
          
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Soleva E-commerce. All rights reserved.</p>
            <p className="mt-1">Secure admin access only</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
