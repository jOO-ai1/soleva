import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  message,
  Tabs,
  Divider,
  Avatar,
  Statistic,
  DatePicker,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { customersAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  registrationDate: string;
  preferredLanguage: string;
  loyaltyPoints: number;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({
        search: searchText,
        status: filterStatus,
      });
      
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (customerId: string) => {
    try {
      const [customerRes, ordersRes] = await Promise.all([
        customersAPI.getById(customerId),
        customersAPI.getOrderHistory(customerId),
      ]);

      if (customerRes.success && customerRes.data) {
        setSelectedCustomer(customerRes.data);
        setModalVisible(true);
      }

      if (ordersRes.success && ordersRes.data) {
        setCustomerOrders(ordersRes.data);
      }
    } catch (error) {
      message.error('Failed to fetch customer details');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isActive: customer.isActive,
      preferredLanguage: customer.preferredLanguage,
    });
    setEditModalVisible(true);
  };

  const handleUpdateCustomer = async (values: any) => {
    if (!selectedCustomer) return;

    try {
      const response = await customersAPI.update(selectedCustomer.id, values);
      if (response.success) {
        message.success('Customer updated successfully');
        setEditModalVisible(false);
        fetchCustomers();
        if (modalVisible) {
          handleViewCustomer(selectedCustomer.id);
        }
      } else {
        message.error('Failed to update customer');
      }
    } catch (error) {
      message.error('Failed to update customer');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'green' : 'red';
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toString().toLowerCase()) ||
        record.email.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || 'N/A',
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (orders: number) => (
        <div className="flex items-center space-x-1">
          <ShoppingCartOutlined />
          <span>{orders}</span>
        </div>
      ),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (amount: number) => (
        <div className="flex items-center space-x-1">
          <DollarOutlined />
          <span>${amount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      title: 'Loyalty Points',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      sorter: (a, b) => a.loyaltyPoints - b.loyaltyPoints,
      render: (points: number) => (
        <Tag color="gold">{points} pts</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Registration Date',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewCustomer(record.id)}
          >
            View
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const orderColumns: ColumnsType<CustomerOrder> = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Order Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => (
        <Tag color={status === 'DELIVERED' ? 'green' : status === 'CANCELLED' ? 'red' : 'blue'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'FAILED' ? 'red' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>Customers Management</Title>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchCustomers}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchCustomers}
                style={{ width: '100%' }}
              >
                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} customers`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Customer Details Modal */}
      <Modal
        title={`Customer Details - ${selectedCustomer?.name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <Tabs defaultActiveKey="profile">
            <TabPane tab="Profile" key="profile">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar
                  size={80}
                  src={selectedCustomer.avatar}
                  icon={<UserOutlined />}
                />
                <div>
                  <Title level={4} style={{ margin: 0 }}>{selectedCustomer.name}</Title>
                  <p className="text-gray-500">{selectedCustomer.email}</p>
                  <Tag color={selectedCustomer.isActive ? 'green' : 'red'}>
                    {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Orders"
                    value={selectedCustomer.totalOrders}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Total Spent"
                    value={selectedCustomer.totalSpent}
                    prefix={<DollarOutlined />}
                    precision={2}
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Loyalty Points"
                    value={selectedCustomer.loyaltyPoints}
                    suffix="pts"
                  />
                </Col>
              </Row>

              <Divider />

              <Descriptions bordered column={2}>
                <Descriptions.Item label="Email" span={1}>
                  {selectedCustomer.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone" span={1}>
                  {selectedCustomer.phone || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Preferred Language" span={1}>
                  {selectedCustomer.preferredLanguage}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date" span={1}>
                  {new Date(selectedCustomer.registrationDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Order" span={1}>
                  {selectedCustomer.lastOrderDate 
                    ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                    : 'No orders yet'
                  }
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Order History" key="orders">
              <Table
                dataSource={customerOrders}
                columns={orderColumns}
                rowKey="id"
                loading={ordersLoading}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        title="Edit Customer"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateCustomer}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="preferredLanguage"
            label="Preferred Language"
            rules={[{ required: true, message: 'Please select language' }]}
          >
            <Select placeholder="Select language">
              <Option value="en">English</Option>
              <Option value="ar">Arabic</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Select placeholder="Select status">
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Customer
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
