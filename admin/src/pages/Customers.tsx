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
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  Avatar,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/NotificationSystem';
import { customersAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  registrationDate: string;
  lastLogin: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    language: string;
    currency: string;
    notifications: boolean;
  };
}

const Customers: React.FC = () => {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [_form] = Form.useForm();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showError(t('error'), t('fetchCustomersError'));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  const filterCustomers = useCallback(() => {
    let filtered = customers;

    if (searchText) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchText, selectedStatus]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalVisible(true);
  };

  const handleUpdateCustomer = async (customerId: string, data: any) => {
    try {
      const response = await customersAPI.update(customerId, data);
      if (response.success) {
        showSuccess(t('updateSuccess'));
        fetchCustomers();
      } else {
        showError(t('error'), response.message || t('updateError'));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showError(t('error'), t('updateError'));
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const response = await customersAPI.delete(id);
      if (response.success) {
        showSuccess(t('deleteSuccess'));
        fetchCustomers();
      } else {
        showError(t('error'), response.message || t('deleteError'));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      showError(t('error'), t('deleteError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: t('customer'),
      dataIndex: 'name',
      key: 'customer',
      render: (text: string, record: Customer) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <div>
            <Text strong>{text}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 'var(--text-xs)' }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t('phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => (
        <Space>
          <PhoneOutlined />
          <Text>{phone}</Text>
        </Space>
      ),
    },
    {
      title: t('customerTotalOrders'),
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders: number) => (
        <Badge count={orders} style={{ backgroundColor: 'var(--primary)' }} />
      ),
    },
    {
      title: t('totalSpent'),
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => (
        <Text strong style={{ color: 'var(--success)' }}>
          ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t('loyaltyPoints'),
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      render: (points: number) => (
        <Space>
          <StarOutlined style={{ color: 'var(--warning)' }} />
          <Text>{points}</Text>
        </Space>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(status as any)}
            </Tag>
      ),
    },
    {
      title: t('registrationDate'),
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record: Customer) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewCustomer(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleViewCustomer(record)}
          />
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => handleDeleteCustomer(record.id)}
            okText={t('delete')}
            cancelText={t('cancel')}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />} 
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    newCustomers: customers.filter(c => {
      const regDate = new Date(c.registrationDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return regDate > thirtyDaysAgo;
    }).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <div className="customers-container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Title level={2} style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('customers')}
        </Title>
        <Text style={{ color: 'var(--text-secondary)' }}>
          {t('manageCustomersDescription')}
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 'var(--space-6)' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Statistic
              title={t('totalCustomers')}
              value={stats.totalCustomers}
              prefix={<UserOutlined style={{ color: 'var(--primary)' }} />}
              valueStyle={{ color: 'var(--primary)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Statistic
              title={t('activeCustomers')}
              value={stats.activeCustomers}
              prefix={<UserOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--success)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Statistic
              title={t('newCustomers')}
              value={stats.newCustomers}
              prefix={<UserOutlined style={{ color: 'var(--info)' }} />}
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
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder={t('searchCustomers')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: '100%' }}
                  />
                </Col>
          <Col xs={24} sm={12} md={6}>
                  <Select
              placeholder={t('status')}
              value={selectedStatus}
              onChange={setSelectedStatus}
                    style={{ width: '100%' }}
                    allowClear
                  >
              <Option value="active">{t('active')}</Option>
              <Option value="inactive">{t('inactive')}</Option>
              <Option value="suspended">{t('suspended')}</Option>
                  </Select>
                </Col>
              </Row>
      </Card>

      {/* Customers Table */}
      <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Table
          columns={columns}
              dataSource={filteredCustomers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ${t('customers')}`,
              }}
          scroll={{ x: 1000 }}
            />
          </Card>

      {/* Customer Details Modal */}
      <Modal
        title={`${t('customerDetails')} - ${selectedCustomer?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        className="glass"
        footer={null}
      >
        {selectedCustomer && (
          <Tabs defaultActiveKey="profile">
            <TabPane tab={t('profile')} key="profile">
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={100} 
                      src={selectedCustomer.avatar} 
                      icon={<UserOutlined />}
                      style={{ backgroundColor: 'var(--primary)' }}
                    />
                    <Title level={4} style={{ marginTop: 'var(--space-4)' }}>
                      {selectedCustomer.name}
                    </Title>
                    <Tag color={getStatusColor(selectedCustomer.status)}>
                      {t(selectedCustomer.status)}
                    </Tag>
                  </div>
            </Col>
                <Col span={16}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t('customerEmail')}>
                      <Space>
                        <MailOutlined />
                        {selectedCustomer.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('customerPhone')}>
                      <Space>
                        <PhoneOutlined />
                        {selectedCustomer.phone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('registrationDate')}>
                      <Space>
                        <CalendarOutlined />
                        {new Date(selectedCustomer.registrationDate).toLocaleDateString()}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('lastLogin')}>
                      <Space>
                        <CalendarOutlined />
                        {new Date(selectedCustomer.lastLogin).toLocaleDateString()}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
            </Col>
          </Row>
            </TabPane>
            
            <TabPane tab={t('orders')} key="orders">
              <Card size="small">
                <Row gutter={[16, 16]}>
            <Col span={8}>
                    <Statistic
                      title={t('customerTotalOrders')}
                      value={selectedCustomer.totalOrders}
                      prefix={<ShoppingOutlined />}
                    />
            </Col>
            <Col span={8}>
                    <Statistic
                      title={t('totalSpent')}
                      value={selectedCustomer.totalSpent}
                      prefix={<DollarOutlined />}
                      precision={2}
                    />
            </Col>
            <Col span={8}>
                    <Statistic
                      title={t('loyaltyPoints')}
                      value={selectedCustomer.loyaltyPoints}
                      prefix={<StarOutlined />}
                    />
            </Col>
          </Row>
              </Card>
            </TabPane>
            
            <TabPane tab={t('address')} key="address">
              <Card size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('street')}>
                    {selectedCustomer.address.street}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('city')}>
                    {selectedCustomer.address.city}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('state')}>
                    {selectedCustomer.address.state}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('zipCode')}>
                    {selectedCustomer.address.zipCode}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('country')}>
                    {selectedCustomer.address.country}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default Customers;