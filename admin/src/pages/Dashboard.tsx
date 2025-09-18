import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Button, Space, Typography, Spin, Alert } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardAPI } from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenue: number;
  growth: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  date: string;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenue: 0,
    growth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real dashboard stats from API
      const statsResponse = await dashboardAPI.getStats();
      if (statsResponse.success) {
        setStats({
          totalSales: statsResponse.data.totalOrders || 0,
          totalOrders: statsResponse.data.totalOrders || 0,
          totalCustomers: statsResponse.data.totalCustomers || 0,
          totalProducts: 0, // This would need a separate API call
          revenue: statsResponse.data.totalRevenue || 0,
          growth: statsResponse.data.revenueGrowth || 0,
        });
      }

      // Fetch recent orders from API
      const ordersResponse = await dashboardAPI.getRecentOrders();
      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data.map((order: any) => ({
          id: order.id || order.orderNumber,
          customerName: order.customerName || order.customer?.name || 'Unknown Customer',
          total: order.total || order.amount || 0,
          status: order.status || 'pending',
          date: order.createdAt || order.date || new Date().toISOString(),
        })));
      }

      // Fetch analytics for top products
      const analyticsResponse = await dashboardAPI.getAnalytics('30d');
      if (analyticsResponse.success) {
        setTopProducts((analyticsResponse.data.topProducts || []).map((product: any) => ({
          id: product.productId || product.id,
          name: product.productName || product.name || 'Unknown Product',
          sales: product.sales || 0,
          revenue: product.revenue || 0,
          growth: product.growth || 0,
        })));
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const recentOrdersColumns = [
    {
      title: t('orderNumber'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>#{id.slice(-8)}</Text>,
    },
    {
      title: t('customerName'),
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: t('orderTotal'),
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <Text strong style={{ color: 'var(--primary)' }}>
          ${total.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t('orderStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: '500',
            background: status === 'completed' ? 'var(--success)' : 'var(--warning)',
            color: 'white',
          }}
        >
          {t(status as any)}
        </span>
      ),
    },
    {
      title: t('orderDate'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  const topProductsColumns = [
    {
      title: t('productName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('sales'),
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (
        <Text strong>{sales.toLocaleString()}</Text>
      ),
    },
    {
      title: t('revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: 'var(--primary)' }}>
          ${revenue.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t('growth'),
      dataIndex: 'growth',
      key: 'growth',
      render: (growth: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Progress
            percent={Math.abs(growth)}
            size="small"
            status={growth >= 0 ? 'success' : 'exception'}
            style={{ width: '60px' }}
          />
          <Text style={{ color: growth >= 0 ? 'var(--success)' : 'var(--error)' }}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </Text>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('error')}
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchDashboardData}>
            {t('refresh')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Title level={2} style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('dashboard')}
        </Title>
        <Text style={{ color: 'var(--text-secondary)' }}>
          {t('welcomeBack')} - {new Date().toLocaleDateString()}
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 'var(--space-8)' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Statistic
              title={t('totalSales')}
              value={stats.totalSales}
              prefix={<ShoppingOutlined style={{ color: 'var(--primary)' }} />}
              valueStyle={{ color: 'var(--primary)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Statistic
              title={t('totalOrders')}
              value={stats.totalOrders}
              prefix={<FileTextOutlined style={{ color: 'var(--info)' }} />}
              valueStyle={{ color: 'var(--info)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Statistic
              title={t('totalCustomers')}
              value={stats.totalCustomers}
              prefix={<UserOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--success)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Statistic
              title={t('revenue')}
              value={stats.revenue}
              prefix={<DollarOutlined style={{ color: 'var(--warning)' }} />}
              valueStyle={{ color: 'var(--warning)' }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Tables */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            className="glass animate-fade-in-up" 
            style={{ animationDelay: '0.5s' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                  {t('recentOrders')}
                </Title>
                <Button type="primary" icon={<PlusOutlined />} size="small">
                  {t('create')}
                </Button>
              </div>
            }
          >
            <Table
              columns={recentOrdersColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            className="glass animate-fade-in-up" 
            style={{ animationDelay: '0.6s' }}
            title={
              <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                {t('topProducts')}
              </Title>
            }
          >
            <Table
              columns={topProductsColumns}
              dataSource={topProducts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Growth Chart Placeholder */}
      <Row gutter={[24, 24]} style={{ marginTop: 'var(--space-6)' }}>
        <Col span={24}>
          <Card 
            className="glass animate-fade-in-up" 
            style={{ animationDelay: '0.7s' }}
            title={
              <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                {t('salesChart')}
              </Title>
            }
          >
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--primary-200)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <RiseOutlined style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: 'var(--space-4)' }} />
                <Text style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
                  {t('chartPlaceholder')}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;