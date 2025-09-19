
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Progress,
  List,
  Avatar,
  Tooltip,
  Badge
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  EyeOutlined,
  TrendingUpOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface GuestActivity {
  id: string;
  sessionId: string;
  ipAddress: string;
  country: string;
  city: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  visitDuration: number; // in minutes
  pagesViewed: number;
  productsViewed: string[];
  cartItems: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  wishlistItems: string[];
  lastActivity: string;
  isConverted: boolean;
  source: string;
  referrer?: string;
}

const GuestAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [guestActivities, setGuestActivities] = useState<GuestActivity[]>([]);

  // Mock data for demonstration
  const mockData: GuestActivity[] = [
    {
      id: '1',
      sessionId: 'sess_123456789',
      ipAddress: '192.168.1.100',
      country: 'Egypt',
      city: 'Cairo',
      device: 'mobile',
      browser: 'Chrome Mobile',
      visitDuration: 15,
      pagesViewed: 8,
      productsViewed: ['prod_1', 'prod_2', 'prod_3'],
      cartItems: [
        {
          productId: 'prod_1',
          productName: 'Luxury Leather Boots',
          price: 1500,
          quantity: 1
        },
        {
          productId: 'prod_2',
          productName: 'Casual Sneakers',
          price: 800,
          quantity: 2
        }
      ],
      wishlistItems: ['prod_3', 'prod_4'],
      lastActivity: '2023-12-10T14:30:00Z',
      isConverted: false,
      source: 'organic',
      referrer: 'google.com'
    },
    {
      id: '2',
      sessionId: 'sess_987654321',
      ipAddress: '10.0.0.50',
      country: 'UAE',
      city: 'Dubai',
      device: 'desktop',
      browser: 'Chrome',
      visitDuration: 25,
      pagesViewed: 12,
      productsViewed: ['prod_5', 'prod_6', 'prod_7', 'prod_8'],
      cartItems: [
        {
          productId: 'prod_5',
          productName: 'Designer Heels',
          price: 2200,
          quantity: 1
        }
      ],
      wishlistItems: ['prod_6', 'prod_7', 'prod_8', 'prod_9'],
      lastActivity: '2023-12-10T16:45:00Z',
      isConverted: true,
      source: 'paid',
      referrer: 'facebook.com'
    }
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGuestActivities(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <MobileOutlined />;
      case 'tablet': return <TabletOutlined />;
      case 'desktop': return <DesktopOutlined />;
      default: return <DesktopOutlined />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'organic': return 'green';
      case 'paid': return 'blue';
      case 'social': return 'purple';
      case 'direct': return 'gold';
      case 'email': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Session Info',
      key: 'session',
      render: (_: any, record: GuestActivity) => (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            {getDeviceIcon(record.device)}
            <Text strong className="text-white">{record.sessionId.slice(-8)}</Text>
            {record.isConverted && (
              <Badge status="success" text="Converted" />
            )}
          </div>
          <div className="text-xs text-gray-400">
            {record.country}, {record.city}
          </div>
          <div className="text-xs text-gray-400">
            {record.browser}
          </div>
        </div>
      ),
    },
    {
      title: 'Activity',
      key: 'activity',
      render: (_: any, record: GuestActivity) => (
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Tooltip title="Visit Duration">
              <div className="flex items-center space-x-1">
                <ClockCircleOutlined className="text-gray-400" />
                <span className="text-sm text-white">{record.visitDuration}m</span>
              </div>
            </Tooltip>
            <Tooltip title="Pages Viewed">
              <div className="flex items-center space-x-1">
                <EyeOutlined className="text-gray-400" />
                <span className="text-sm text-white">{record.pagesViewed}</span>
              </div>
            </Tooltip>
          </div>
          <div className="text-xs text-gray-400">
            {record.productsViewed.length} products viewed
          </div>
        </div>
      ),
    },
    {
      title: 'Cart & Wishlist',
      key: 'engagement',
      render: (_: any, record: GuestActivity) => (
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Tooltip title="Cart Items">
              <div className="flex items-center space-x-1">
                <ShoppingCartOutlined className="text-blue-400" />
                <span className="text-sm text-white">{record.cartItems.length}</span>
              </div>
            </Tooltip>
            <Tooltip title="Wishlist Items">
              <div className="flex items-center space-x-1">
                <HeartOutlined className="text-red-400" />
                <span className="text-sm text-white">{record.wishlistItems.length}</span>
              </div>
            </Tooltip>
          </div>
          {record.cartItems.length > 0 && (
            <div className="text-xs">
              <span className="currency-egp">
                {record.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
              </span>
              <span className="text-gray-400 ml-1">cart value</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Source',
      key: 'source',
      render: (_: any, record: GuestActivity) => (
        <div>
          <Tag color={getSourceColor(record.source)}>
            {record.source.toUpperCase()}
          </Tag>
          {record.referrer && (
            <div className="text-xs text-gray-400 mt-1">
              from {record.referrer}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Last Activity',
      key: 'lastActivity',
      render: (_: any, record: GuestActivity) => (
        <div className="text-sm text-gray-300">
          {new Date(record.lastActivity).toLocaleString()}
        </div>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    totalSessions: guestActivities.length,
    totalCartValue: guestActivities.reduce((sum, activity) => 
      sum + activity.cartItems.reduce((cartSum, item) => cartSum + (item.price * item.quantity), 0), 0
    ),
    totalWishlistItems: guestActivities.reduce((sum, activity) => sum + activity.wishlistItems.length, 0),
    conversionRate: guestActivities.length > 0 ? 
      (guestActivities.filter(a => a.isConverted).length / guestActivities.length * 100) : 0,
    avgSessionDuration: guestActivities.length > 0 ? 
      guestActivities.reduce((sum, a) => sum + a.visitDuration, 0) / guestActivities.length : 0,
    topCountries: Object.entries(
      guestActivities.reduce((acc: Record<string, number>, activity) => {
        acc[activity.country] = (acc[activity.country] || 0) + 1;
        return acc;
      }, {})
    ).sort(([,a], [,b]) => b - a).slice(0, 5)
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
          Guest Analytics
        </Title>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="1d">Last Day</Option>
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 90 Days</Option>
          </Select>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={24} className="mb-6">
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<UserOutlined style={{ color: 'var(--primary)' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Cart Value"
              value={stats.totalCartValue}
              precision={0}
              prefix="EGP"
              valueStyle={{ color: 'var(--primary)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Wishlist Items"
              value={stats.totalWishlistItems}
              prefix={<HeartOutlined style={{ color: 'var(--error)' }} />}
              valueStyle={{ color: 'var(--error)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Conversion Rate"
              value={stats.conversionRate}
              precision={1}
              suffix="%"
              prefix={<TrendingUpOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--success)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Avg Session"
              value={stats.avgSessionDuration}
              precision={1}
              suffix="min"
              prefix={<ClockCircleOutlined style={{ color: 'var(--info)' }} />}
              valueStyle={{ color: 'var(--info)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Active Now"
              value={Math.floor(Math.random() * 25) + 5}
              prefix={<FireOutlined style={{ color: 'var(--warning)' }} />}
              valueStyle={{ color: 'var(--warning)' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className="mb-6">
        <Col span={16}>
          <Card title="Guest Sessions" className="card-luxury">
            <Table
              columns={columns}
              dataSource={guestActivities}
              rowKey="id"
              loading={loading}
              className="table-luxury"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} sessions`,
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Top Countries" className="card-luxury mb-4">
            <List
              dataSource={stats.topCountries}
              renderItem={([country, count]) => (
                <List.Item>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-2">
                      <GlobalOutlined className="text-gray-400" />
                      <span className="text-white">{country}</span>
                    </div>
                    <Badge count={count} style={{ backgroundColor: 'var(--primary)' }} />
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Device Distribution" className="card-luxury">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <MobileOutlined className="text-gray-400" />
                  <span className="text-white">Mobile</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress percent={60} showInfo={false} strokeColor="var(--primary)" className="w-20" />
                  <span className="text-gray-400">60%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <DesktopOutlined className="text-gray-400" />
                  <span className="text-white">Desktop</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress percent={35} showInfo={false} strokeColor="var(--success)" className="w-20" />
                  <span className="text-gray-400">35%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <TabletOutlined className="text-gray-400" />
                  <span className="text-white">Tablet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress percent={5} showInfo={false} strokeColor="var(--warning)" className="w-20" />
                  <span className="text-gray-400">5%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GuestAnalytics;
