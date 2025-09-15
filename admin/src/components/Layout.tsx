import { useState, ReactNode } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Orders',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: 'Inventory',
    },
    {
      key: '/shipping',
      icon: <TruckOutlined />,
      label: 'Shipping',
    },
    {
      key: '/cms',
      icon: <EditOutlined />,
      label: 'CMS',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Users',
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'AI Chat',
    },
    {
      key: '/audit-logs',
      icon: <AuditOutlined />,
      label: 'Audit Logs',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
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
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
      >
        <div className="p-4 text-center">
          <h2 className="text-white text-lg font-bold">
            {collapsed ? 'SA' : 'Soleva Admin'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <AntLayout>
        <Header className="bg-white shadow-sm px-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {menuItems.find(item => item.key === location.pathname)?.label || 'Admin Panel'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<MessageOutlined />}
                onClick={() => navigate('/chat')}
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="flex items-center space-x-2 cursor-pointer">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span className="text-gray-700">{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6 bg-gray-50">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;