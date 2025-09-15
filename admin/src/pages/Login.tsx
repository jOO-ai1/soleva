import { useState } from 'react';
import { Form, Input, Button, Card, message, Alert, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password, twoFactorToken);
      
      if (result.success) {
        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          message.info('Please enter your 2FA code');
        } else {
          message.success('Login successful!');
          navigate('/dashboard');
        }
      } else {
        message.error(result.message || 'Login failed');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async () => {
    if (!twoFactorToken) {
      message.error('Please enter your 2FA code');
      return;
    }

    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const result = await login(values.email, values.password, twoFactorToken);
      
      if (result.success) {
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error(result.message || 'Invalid 2FA code');
        setTwoFactorToken('');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-2xl border-0">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <UserOutlined className="text-2xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {!requiresTwoFactor ? (
            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="admin@solevaeg.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Enter your password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 text-lg font-medium"
                >
                  Sign In
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
