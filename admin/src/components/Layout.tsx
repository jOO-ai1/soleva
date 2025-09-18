import { useState, ReactNode } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FireOutlined,
  GiftOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  InboxOutlined,
  TruckOutlined,
  EditOutlined,
  AuditOutlined,
  TeamOutlined,
  MessageOutlined,
  LogoutOutlined,
  CustomerServiceOutlined,
  ShopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined } from
'@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: t('dashboard')
  },
  {
    key: '/products',
    icon: <ShoppingOutlined />,
    label: t('products')
  },
  {
    key: '/categories',
    icon: <AppstoreOutlined />,
    label: t('categories')
  },
  {
    key: '/flash-sales',
    icon: <FireOutlined />,
    label: t('flashSales')
  },
  {
    key: '/coupons',
    icon: <GiftOutlined />,
    label: t('coupons')
  },
  {
    key: '/orders',
    icon: <FileTextOutlined />,
    label: t('orders')
  },
  {
    key: '/customers',
    icon: <UserOutlined />,
    label: t('customers')
  },
  {
    key: '/inventory',
    icon: <InboxOutlined />,
    label: t('inventory')
  },
  {
    key: '/shipping',
    icon: <TruckOutlined />,
    label: t('shipping')
  },
  {
    key: '/cms',
    icon: <EditOutlined />,
    label: t('cms')
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: t('reports')
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: t('users')
  },
  {
    key: '/chat',
    icon: <MessageOutlined />,
    label: t('aiChat')
  },
  {
    key: '/chat-support',
    icon: <CustomerServiceOutlined />,
    label: t('chatSupport')
  },
  {
    key: '/multi-store',
    icon: <ShopOutlined />,
    label: t('multiStore')
  },
  {
    key: '/audit-logs',
    icon: <AuditOutlined />,
    label: t('auditLogs')
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: t('settings')
  }];


  const handleMenuClick = ({ key }: {key: string;}) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: t('profile')
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: t('settings')
  },
  {
    type: 'divider' as const
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: t('logout'),
    onClick: handleLogout
  }];


  return (
    <div className="admin-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <AntLayout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="admin-sidebar"
          width={280}
          collapsedWidth={80}
          style={{
            background: 'transparent',
            borderRight: '1px solid var(--border-primary)'
          }}>

          <div className="glass" style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '16px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: '#000000',
            fontWeight: '700',
            fontSize: collapsed ? 'var(--text-lg)' : 'var(--text-xl)',
            boxShadow: '0 8px 25px var(--primary-300)'
          }}>
            {collapsed ? 'SA' : 'Soleva Admin'}
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="admin-menu"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0 16px'
            }}
            theme="light" />

        </Sider>
        
        <AntLayout style={{ background: 'transparent' }}>
          <Header className="admin-header" style={{
            background: 'transparent',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            lineHeight: '64px'
          }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="btn-ghost"
              style={{
                fontSize: '16px',
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)'
              }} />

            
            <Space size="middle">
              <Badge count={5} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  className="btn-ghost"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)'
                  }} />

              </Badge>
              
              <LanguageSwitcher />
              
              <Dropdown
                menu={{ items: userMenuItems }}
                placement={isRTL ? 'bottomLeft' : 'bottomRight'}
                trigger={['click']}>

                <Space style={{ cursor: 'pointer' }} className="user-profile">
                  <Avatar
                    src={user?.avatar}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#000000',
                      border: '2px solid var(--primary-200)'
                    }} />

                  {!collapsed &&
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                        {user?.name || user?.email}
                      </Text>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {user?.role}
                      </Text>
                    </div>
                  }
                </Space>
              </Dropdown>
            </Space>
          </Header>
          
          <Content className="admin-content">
            <div className="glass animate-fade-in-up" style={{
              padding: 'var(--space-6)',
              minHeight: 'calc(100vh - 112px)',
              borderRadius: 'var(--radius-xl)'
            }}>
              {children}
            </div>
          </Content>
        </AntLayout>
      </AntLayout>
    </div>);

};

export default Layout;