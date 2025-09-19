
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Popconfirm,
  message,
  Tabs,
  DatePicker,
  InputNumber,
  Avatar,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShopOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { suppliersAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  website?: string;
  contactPerson: string;
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: string;
  deliveryTime: number; // in days
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const COUNTRIES = [
  'Egypt', 'China', 'India', 'Turkey', 'Italy', 'Spain', 'Germany',
  'United Kingdom', 'France', 'United States', 'Brazil', 'Vietnam',
  'Bangladesh', 'Pakistan', 'Thailand', 'Indonesia'
];

const PAYMENT_TERMS = [
  'Net 30',
  'Net 60',
  'Net 90',
  'Cash on Delivery',
  '2/10 Net 30',
  'Letter of Credit',
  'Advance Payment',
  'Payment on Delivery'
];

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      rating: 5,
      deliveryTime: 7
    });
    setModalVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      country: supplier.country,
      website: supplier.website,
      contactPerson: supplier.contactPerson,
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      status: supplier.status,
      deliveryTime: supplier.deliveryTime,
      notes: supplier.notes
    });
    setModalVisible(true);
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await suppliersAPI.delete(id);
      if (response.success) {
        message.success('Supplier deleted successfully');
        fetchSuppliers();
      } else {
        message.error('Failed to delete supplier');
      }
    } catch (error) {
      message.error('Failed to delete supplier');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;
      if (editingSupplier) {
        response = await suppliersAPI.update(editingSupplier.id, values);
      } else {
        response = await suppliersAPI.create(values);
      }

      if (response.success) {
        message.success(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchSuppliers();
      } else {
        message.error(`Failed to ${editingSupplier ? 'update' : 'create'} supplier`);
      }
    } catch (error) {
      message.error(`Failed to ${editingSupplier ? 'update' : 'create'} supplier`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={<ShopOutlined />} 
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <div>
            <div className="font-semibold text-white">{record.name}</div>
            <Text type="secondary">{record.contactPerson}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div className="flex items-center mb-1">
            <MailOutlined className="mr-2 text-gray-400" />
            <span className="text-sm text-gray-300">{record.email}</span>
          </div>
          <div className="flex items-center">
            <PhoneOutlined className="mr-2 text-gray-400" />
            <span className="text-sm text-gray-300">{record.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <div>
          <div className="text-white">{record.country}</div>
          <Text type="secondary" className="text-xs">
            Delivery: {record.deliveryTime} days
          </Text>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => (
        <div>
          <div className="text-yellow-400 mb-1">
            {getRatingStars(record.rating)} ({record.rating}/5)
          </div>
          <div className="text-sm text-gray-300">
            {record.totalOrders} orders
          </div>
        </div>
      ),
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => (
        <div className="text-right">
          <div className="currency-egp text-lg font-semibold">
            {record.totalValue.toLocaleString()}
          </div>
          <Text type="secondary" className="text-xs">
            {record.paymentTerms}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} className="tag-luxury">
          {record.status.toUpperCase()}
        </Tag>
      ),
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
            onClick={() => handleView(record)}
            className="btn-ghost"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="btn-ghost"
          />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="btn-ghost"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0);
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
          Suppliers Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="btn-primary"
        >
          Add Supplier
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Suppliers"
              value={totalSuppliers}
              prefix={<ShopOutlined style={{ color: 'var(--primary)' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Active Suppliers"
              value={activeSuppliers}
              prefix={<UserOutlined style={{ color: 'var(--success)' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Value"
              value={totalValue}
              precision={0}
              prefix="EGP"
              suffix="K"
              valueStyle={{ color: 'var(--primary)' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Avg Rating"
              value={avgRating}
              precision={1}
              suffix="/5"
              prefix="⭐"
              valueStyle={{ color: 'var(--warning)' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="card-luxury">
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          className="table-luxury"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} suppliers`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="modal-luxury"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="form-luxury"
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Information" key="basic">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Supplier Name"
                    rules={[{ required: true, message: 'Please enter supplier name' }]}
                  >
                    <Input placeholder="Enter supplier name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactPerson"
                    label="Contact Person"
                    rules={[{ required: true, message: 'Please enter contact person' }]}
                  >
                    <Input placeholder="Enter contact person name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true, message: 'Please enter phone' }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <TextArea rows={3} placeholder="Enter full address" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="country"
                    label="Country"
                    rules={[{ required: true, message: 'Please select country' }]}
                  >
                    <Select placeholder="Select country">
                      {COUNTRIES.map(country => (
                        <Option key={country} value={country}>{country}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="website"
                    label="Website"
                  >
                    <Input placeholder="Enter website URL" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Business Terms" key="business">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms"
                    label="Payment Terms"
                    rules={[{ required: true, message: 'Please select payment terms' }]}
                  >
                    <Select placeholder="Select payment terms">
                      {PAYMENT_TERMS.map(term => (
                        <Option key={term} value={term}>{term}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deliveryTime"
                    label="Delivery Time (Days)"
                    rules={[{ required: true, message: 'Please enter delivery time' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={365}
                      placeholder="Enter delivery time"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="rating"
                    label="Rating"
                    rules={[{ required: true, message: 'Please select rating' }]}
                  >
                    <Select placeholder="Select rating">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Option key={rating} value={rating}>
                          {'★'.repeat(rating) + '☆'.repeat(5 - rating)} ({rating}/5)
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Please select status' }]}
                  >
                    <Select placeholder="Select status">
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                      <Option value="pending">Pending</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea rows={4} placeholder="Enter additional notes" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <div className="flex justify-end mt-6 space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="btn-primary">
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Supplier Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        className="modal-luxury"
      >
        {selectedSupplier && (
          <div>
            <Row gutter={24}>
              <Col span={8}>
                <div className="text-center mb-4">
                  <Avatar 
                    size={80} 
                    icon={<ShopOutlined />} 
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
                  />
                  <Title level={4} className="mt-2" style={{ color: 'var(--text-primary)' }}>
                    {selectedSupplier.name}
                  </Title>
                  <Tag color={getStatusColor(selectedSupplier.status)} className="tag-luxury">
                    {selectedSupplier.status.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={16}>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contact Person:</span>
                    <span className="text-white">{selectedSupplier.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedSupplier.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{selectedSupplier.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{selectedSupplier.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Terms:</span>
                    <span className="text-white">{selectedSupplier.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Time:</span>
                    <span className="text-white">{selectedSupplier.deliveryTime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating:</span>
                    <span className="text-yellow-400">
                      {getRatingStars(selectedSupplier.rating)} ({selectedSupplier.rating}/5)
                    </span>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="mt-6 pt-4 border-t border-gray-600">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Orders"
                    value={selectedSupplier.totalOrders}
                    valueStyle={{ color: 'var(--primary)' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Total Value"
                    value={selectedSupplier.totalValue}
                    prefix="EGP"
                    valueStyle={{ color: 'var(--primary)' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Last Order"
                    value={selectedSupplier.lastOrderDate || 'Never'}
                    valueStyle={{ color: 'var(--text-secondary)' }}
                  />
                </Col>
              </Row>
            </div>

            {selectedSupplier.notes && (
              <div className="mt-6 pt-4 border-t border-gray-600">
                <Title level={5} style={{ color: 'var(--text-primary)' }}>Notes:</Title>
                <p className="text-gray-300">{selectedSupplier.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Suppliers;
