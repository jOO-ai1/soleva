import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  Spin,
} from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  lowStockItems: number;
  ordersGrowth: number;
  revenueGrowth: number;
  customersGrowth: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentOrders(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      
      if (ordersRes.success && ordersRes.data) {
        setRecentOrders(ordersRes.data);
      }

      // Mock data for charts (replace with real API calls when available)
      setSalesData([
        { date: '2024-01-01', sales: 12000 },
        { date: '2024-01-02', sales: 15000 },
        { date: '2024-01-03', sales: 18000 },
        { date: '2024-01-04', sales: 14000 },
        { date: '2024-01-05', sales: 16000 },
        { date: '2024-01-06', sales: 20000 },
        { date: '2024-01-07', sales: 17000 },
      ]);

      setCategoryData([
        { name: 'Sneakers', value: 35 },
        { name: 'Boots', value: 25 },
        { name: 'Sandals', value: 20 },
        { name: 'Dress Shoes', value: 15 },
        { name: 'Others', value: 5 },
      ]);
    } catch (error) {
      // Failed to fetch dashboard data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const orderColumns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: RecentOrder) => (
        <Button
          type="link"
          onClick={() => navigate(`/orders/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          PROCESSING: 'purple',
          SHIPPED: 'cyan',
          DELIVERED: 'green',
          CANCELLED: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (record: RecentOrder) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const pieColors = ['#d1b16a', '#b8965a', '#e4c97d', '#a67c4a', '#f0d98b'];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Space>
          <RangePicker
            value={[dateRange[0], dateRange[1]]}
            onChange={(dates: any) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Orders'
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              suffix={
                <span style={{ fontSize: 12, color: stats?.ordersGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                  {stats?.ordersGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(stats?.ordersGrowth || 0)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Revenue'
              value={stats?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix='EGP'
              precision={0}
              formatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <div style={{ fontSize: 12, color: stats?.revenueGrowth >= 0 ? '#10b981' : '#ef4444', marginTop: 8 }}>
              {stats?.revenueGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(stats?.revenueGrowth || 0)}% from last period
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Total Customers'
              value={stats?.totalCustomers || 0}
              prefix={<UserOutlined />}
              suffix={
                <span style={{ fontSize: 12, color: stats?.customersGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                  {stats?.customersGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(stats?.customersGrowth || 0)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Low Stock Items'
              value={stats?.lowStockItems || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: stats?.lowStockItems > 0 ? '#ef4444' : '#10b981' }}
            />
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/inventory')}
              style={{ padding: 0, marginTop: 8 }}
            >
View Inventory
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Sales Chart */}
        <Col xs={24} lg={16}>
          <Card title='Sales Trend' style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} EGP`, 'Sales']} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#d1b16a"
                  strokeWidth={2}
                  dot={{ fill: '#d1b16a', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Category Distribution */}
        <Col xs={24} lg={8}>
          <Card title='Top Products' style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card
        title='Recent Orders'
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            All Orders
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
