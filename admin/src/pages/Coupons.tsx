import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
  Progress,
  Badge } from
'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  CopyOutlined,
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined } from
'@ant-design/icons';
import { couponsAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Coupon } from '../types/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Using Coupon type from API types

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  userLimit: number;
  validFrom: string;
  validTo?: string;
  freeShipping: boolean;
  isActive: boolean;
}

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponsAPI.getAll();

      if (response.success && response.data) {
        setCoupons(response.data as Coupon[]);
      }
    } catch (error) {
      message.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.setFieldsValue({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      minOrderValue: coupon.minOrderValue,
      usageLimit: coupon.usageLimit,
      userLimit: coupon.userLimit,
      validFrom: dayjs(coupon.validFrom),
      validTo: coupon.validTo ? dayjs(coupon.validTo) : null,
      freeShipping: coupon.freeShipping,
      isActive: coupon.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await couponsAPI.delete(id);
      if (response.success) {
        message.success('Coupon deleted successfully');
        fetchCoupons();
      } else {
        message.error('Failed to delete coupon');
      }
    } catch (error) {
      message.error('Failed to delete coupon');
    }
  };

  const handleSubmit = async (values: CouponFormData) => {
    try {
      const couponData = {
        ...values,
        validFrom: dayjs(values.validFrom).toISOString(),
        validTo: values.validTo ? dayjs(values.validTo).toISOString() : null
      };

      let response;
      if (editingCoupon) {
        response = await couponsAPI.update(editingCoupon.id, couponData);
      } else {
        response = await couponsAPI.create(couponData);
      }

      if (response.success) {
        message.success(`Coupon ${editingCoupon ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchCoupons();
      } else {
        message.error(`Failed to ${editingCoupon ? 'update' : 'create'} coupon`);
      }
    } catch (error) {
      message.error(`Failed to ${editingCoupon ? 'update' : 'create'} coupon`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('Coupon code copied to clipboard');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldsValue({ code: result });
  };

  const getStatusColor = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

    if (!coupon.isActive) return 'red';
    if (now < validFrom) return 'blue';
    if (validTo && now > validTo) return 'gray';
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'orange';
    return 'green';
  };

  const getStatusText = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

    if (!coupon.isActive) return 'Inactive';
    if (now < validFrom) return 'Scheduled';
    if (validTo && now > validTo) return 'Expired';
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'Fully Used';
    return 'Active';
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.usageLimit) return 0;
    return Math.round(coupon.usageCount / coupon.usageLimit * 100);
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = !searchText ||
    coupon.code.toLowerCase().includes(searchText.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = !filterType || coupon.type === filterType;

    const matchesStatus = !filterStatus ||
    filterStatus === 'active' && coupon.isActive && new Date() >= new Date(coupon.validFrom) && (!coupon.validTo || new Date() <= new Date(coupon.validTo)) && (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) ||
    filterStatus === 'expired' && coupon.validTo && new Date() > new Date(coupon.validTo) ||
    filterStatus === 'inactive' && !coupon.isActive ||
    filterStatus === 'fully-used' && coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;

    return matchesSearch && matchesType && matchesStatus;
  });

  const columns: ColumnsType<Coupon> = [
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
    render: (code: string) =>
    <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
            {code}
          </code>
          <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={() => copyCode(code)} />

        </div>

  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filteredValue: searchText ? [searchText] : null,
    onFilter: (value, record) =>
    record.name.toLowerCase().includes(value.toString().toLowerCase()) ||
    record.code.toLowerCase().includes(value.toString().toLowerCase())
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => {
      const icons = {
        PERCENTAGE: <PercentageOutlined />,
        FIXED_AMOUNT: <DollarOutlined />,
        FREE_SHIPPING: <GiftOutlined />
      };
      const colors = {
        PERCENTAGE: 'blue',
        FIXED_AMOUNT: 'green',
        FREE_SHIPPING: 'purple'
      };
      return (
        <Tag color={colors[type as keyof typeof colors]} icon={icons[type as keyof typeof icons]}>
            {type.replace('_', ' ')}
          </Tag>);

    },
    filters: [
    { text: 'Percentage', value: 'PERCENTAGE' },
    { text: 'Fixed Amount', value: 'FIXED_AMOUNT' },
    { text: 'Free Shipping', value: 'FREE_SHIPPING' }],

    onFilter: (value, record) => record.type === value
  },
  {
    title: 'Value',
    key: 'value',
    render: (_, record) =>
    <div>
          <div className="font-medium">
            {record.type === 'PERCENTAGE' ?
        `${record.value}%` :
        record.type === 'FIXED_AMOUNT' ?
        `$${record.value}` :
        'Free Shipping'
        }
          </div>
          {record.maxDiscount &&
      <div className="text-xs text-gray-500">
              Max: ${record.maxDiscount}
            </div>
      }
        </div>

  },
  {
    title: 'Usage',
    key: 'usage',
    render: (_, record) =>
    <div>
          <div className="text-sm">
            {record.usageCount} / {record.usageLimit || '∞'}
          </div>
          {record.usageLimit &&
      <Progress
        percent={getUsagePercentage(record)}
        size="small"
        showInfo={false} />

      }
        </div>

  },
  {
    title: 'Validity',
    key: 'validity',
    render: (_, record) =>
    <div>
          <div className="text-sm">
            {dayjs(record.validFrom).format('MMM DD, YYYY')}
          </div>
          <div className="text-sm text-gray-500">
            {record.validTo ? dayjs(record.validTo).format('MMM DD, YYYY') : 'No expiry'}
          </div>
        </div>

  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      const status = getStatusText(record);
      const color = getStatusColor(record);
      return <Tag color={color}>{status}</Tag>;
    },
    filters: [
    { text: 'Active', value: 'active' },
    { text: 'Expired', value: 'expired' },
    { text: 'Inactive', value: 'inactive' },
    { text: 'Fully Used', value: 'fully-used' }],

    onFilter: (value, record) => {
      const now = new Date();
      const validFrom = new Date(record.validFrom);
      const validTo = record.validTo ? new Date(record.validTo) : null;

      if (value === 'active') return record.isActive && now >= validFrom && (!validTo || now <= validTo) && (!record.usageLimit || record.usageCount < record.usageLimit);
      if (value === 'expired') return validTo && now > validTo;
      if (value === 'inactive') return !record.isActive;
      if (value === 'fully-used') return record.usageLimit && record.usageCount >= record.usageLimit;
      return true;
    }
  },
  {
    title: 'Orders',
    dataIndex: 'ordersCount',
    key: 'ordersCount',
    render: (count: number) =>
    <Badge count={count} showZero />,

    sorter: (a, b) => a.ordersCount - b.ordersCount
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 150,
    render: (_, record) =>
    <Space>
          <Button
        type="text"
        icon={<EyeOutlined />}
        onClick={() => handleEdit(record)} />

          <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => handleEdit(record)} />

          <Popconfirm
        title="Are you sure you want to delete this coupon?"
        onConfirm={() => handleDelete(record.id)}
        okText="Yes"
        cancelText="No">

            <Button
          type="text"
          danger
          icon={<DeleteOutlined />} />

          </Popconfirm>
        </Space>

  }];


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <GiftOutlined className="mr-2" />
          Coupons Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}>

          Create Coupon
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search coupons..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)} />

            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by type"
                style={{ width: '100%' }}
                value={filterType}
                onChange={setFilterType}
                allowClear>

                <Option value="PERCENTAGE">Percentage</Option>
                <Option value="FIXED_AMOUNT">Fixed Amount</Option>
                <Option value="FREE_SHIPPING">Free Shipping</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear>

                <Option value="active">Active</Option>
                <Option value="expired">Expired</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="fully-used">Fully Used</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchCoupons}
                style={{ width: '100%' }}>

                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredCoupons}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} coupons`
          }}
          scroll={{ x: 1200 }} />

      </Card>

      <Modal
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[{ required: true, message: 'Please enter coupon code' }]}>

                <Input placeholder="Enter coupon code" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label=" ">
                <Button onClick={generateCode} style={{ width: '100%' }}>
                  Generate Code
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Coupon Name"
                rules={[{ required: true, message: 'Please enter coupon name' }]}>

                <Input placeholder="Enter coupon name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Coupon Type"
                rules={[{ required: true, message: 'Please select coupon type' }]}>

                <Select placeholder="Select coupon type">
                  <Option value="PERCENTAGE">Percentage</Option>
                  <Option value="FIXED_AMOUNT">Fixed Amount</Option>
                  <Option value="FREE_SHIPPING">Free Shipping</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description">

            <TextArea rows={3} placeholder="Enter coupon description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="value"
                label="Discount Value"
                rules={[{ required: true, message: 'Please enter discount value' }]}>

                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  step={0.01} />

              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxDiscount"
                label="Max Discount">

                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="No limit"
                  min={0}
                  step={0.01} />

              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minOrderValue"
                label="Min Order Value">

                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="No minimum"
                  min={0}
                  step={0.01} />

              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="usageLimit"
                label="Usage Limit">

                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Unlimited"
                  min={1} />

              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="userLimit"
                label="Per User Limit"
                rules={[{ required: true, message: 'Please enter per user limit' }]}>

                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="1"
                  min={1} />

              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="validFrom"
                label="Valid From"
                rules={[{ required: true, message: 'Please select valid from date' }]}>

                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm" />

              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="validTo"
                label="Valid To">

                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm" />

              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="freeShipping"
                label="Free Shipping"
                valuePropName="checked">

                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked">

                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);

};

export default Coupons;