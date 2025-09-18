import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  Form, 
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  TruckOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/NotificationSystem';
import { ordersAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const Orders: React.FC = () => {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [_form] = Form.useForm();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError(t('error'), t('fetchOrdersError'));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    if (searchText) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (selectedPaymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === selectedPaymentStatus);
    }

    setFilteredOrders(filtered);
  }, [orders, searchText, selectedStatus, selectedPaymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await ordersAPI.updateStatus(orderId, newStatus);
      if (response.success) {
        showSuccess(t('updateSuccess'));
        fetchOrders();
      } else {
        showError(t('error'), response.message || t('updateError'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError(t('error'), t('updateError'));
    }
  };

  const handleProcessRefund = async (orderId: string, amount: number, reason: string) => {
    try {
      const response = await ordersAPI.processRefund(orderId, amount, reason);
      if (response.success) {
        showSuccess(t('refundProcessed'));
        fetchOrders();
      } else {
        showError(t('error'), response.message || t('refundError'));
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      showError(t('error'), t('refundError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'processing';
      case 'shipped': return 'blue';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'failed': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: t('orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => (
        <Text strong style={{ color: 'var(--primary)' }}>{text}</Text>
      ),
    },
    {
      title: t('customerName'),
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: Order) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 'var(--text-xs)' }}>
              {record.customerEmail}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t('total'),
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
        <Tag color={getStatusColor(status)}>
          {t(status as any)}
        </Tag>
      ),
    },
    {
      title: t('paymentStatus'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {t(status as any)}
        </Tag>
      ),
    },
    {
      title: t('orderDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record: Order) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewOrder(record)}
          />
          <Select
            size="small"
            value={record.status}
            onChange={(value) => handleUpdateStatus(record.id, value)}
            style={{ width: 120 }}
          >
            <Option value="pending">{t('pending')}</Option>
            <Option value="processing">{t('processing')}</Option>
            <Option value="shipped">{t('shipped')}</Option>
            <Option value="delivered">{t('delivered')}</Option>
            <Option value="cancelled">{t('cancelled')}</Option>
          </Select>
        </Space>
      ),
    },
  ];

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    processingOrders: orders.filter(o => o.status === 'processing').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="orders-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Title level={2} style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('orders')}
        </Title>
        <Text style={{ color: 'var(--text-secondary)' }}>
          {t('manageOrdersDescription')}
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 'var(--space-6)' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Statistic
              title={t('totalOrders')}
              value={stats.totalOrders}
              prefix={<ShoppingOutlined style={{ color: 'var(--primary)' }} />}
              valueStyle={{ color: 'var(--primary)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Statistic
              title={t('pendingOrders')}
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined style={{ color: 'var(--warning)' }} />}
              valueStyle={{ color: 'var(--warning)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Statistic
              title={t('processingOrders')}
              value={stats.processingOrders}
              prefix={<TruckOutlined style={{ color: 'var(--info)' }} />}
              valueStyle={{ color: 'var(--info)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Statistic
              title={t('totalRevenue')}
              value={stats.totalRevenue}
              prefix={<DollarOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--success)' }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.5s', marginBottom: 'var(--space-6)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder={t('searchOrders')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={t('orderStatus')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="pending">{t('pending')}</Option>
              <Option value="processing">{t('processing')}</Option>
              <Option value="shipped">{t('shipped')}</Option>
              <Option value="delivered">{t('delivered')}</Option>
              <Option value="cancelled">{t('cancelled')}</Option>
              <Option value="refunded">{t('refunded')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={t('paymentStatus')}
              value={selectedPaymentStatus}
              onChange={setSelectedPaymentStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="pending">{t('pending')}</Option>
              <Option value="paid">{t('paid')}</Option>
              <Option value="failed">{t('failed')}</Option>
              <Option value="refunded">{t('refunded')}</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} ${t('orders')}`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={`${t('orderDetails')} - ${selectedOrder?.orderNumber}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        className="glass"
        footer={null}
      >
        {selectedOrder && (
          <div>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title={t('customerInfo')} size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t('customerName')}>
                      {selectedOrder.customerName}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('customerEmail')}>
                      {selectedOrder.customerEmail}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('customerPhone')}>
                      {selectedOrder.customerPhone}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={t('orderInfo')} size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t('orderNumber')}>
                      {selectedOrder.orderNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderDate')}>
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('total')}>
                      <Text strong style={{ color: 'var(--primary)' }}>
                        ${selectedOrder.total.toFixed(2)}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card title={t('shippingAddress')} size="small" style={{ marginTop: 'var(--space-4)' }}>
              <Text>
                {selectedOrder.shippingAddress.street}<br />
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                {selectedOrder.shippingAddress.country}
              </Text>
            </Card>

            <Card title={t('orderItems')} size="small" style={{ marginTop: 'var(--space-4)' }}>
              <Table
                dataSource={selectedOrder.items}
                columns={[
                  { title: t('productName'), dataIndex: 'name', key: 'name' },
                  { title: t('quantity'), dataIndex: 'quantity', key: 'quantity' },
                  { 
                    title: t('price'), 
                    dataIndex: 'price', 
                    key: 'price',
                    render: (price: number) => `$${price.toFixed(2)}`
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>

            <div style={{ marginTop: 'var(--space-4)', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>
                  {t('close')}
                </Button>
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    type="primary"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                  >
                    {t('markAsDelivered')}
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;