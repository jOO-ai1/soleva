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
  Upload,
  Image,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { flashSalesAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { FlashSale } from '../types/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Using FlashSale type from API types

interface FlashSaleFormData {
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFeatured: boolean;
  bannerImage?: string;
  countdownEnabled: boolean;
}

const FlashSales = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await flashSalesAPI.getAll();
      
      if (response.success && response.data) {
        setFlashSales(response.data as FlashSale[]);
      }
    } catch (error) {
      message.error('Failed to fetch flash sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSale(null);
    setUploadedImage('');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setUploadedImage(sale.bannerImage || '');
    form.setFieldsValue({
      name: sale.name,
      description: sale.description,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      maxDiscount: sale.maxDiscount,
      minOrderValue: sale.minOrderValue,
      startDate: dayjs(sale.startDate),
      endDate: dayjs(sale.endDate),
      isActive: sale.isActive,
      isFeatured: sale.isFeatured,
      countdownEnabled: sale.countdownEnabled,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await flashSalesAPI.delete(id);
      if (response.success) {
        message.success('Flash sale deleted successfully');
        fetchFlashSales();
      } else {
        message.error('Failed to delete flash sale');
      }
    } catch (error) {
      message.error('Failed to delete flash sale');
    }
  };

  const handleSubmit = async (values: FlashSaleFormData) => {
    try {
      const saleData = {
        ...values,
        startDate: dayjs(values.startDate).toISOString(),
        endDate: dayjs(values.endDate).toISOString(),
        bannerImage: uploadedImage,
      };

      let response;
      if (editingSale) {
        response = await flashSalesAPI.update(editingSale.id, saleData);
      } else {
        response = await flashSalesAPI.create(saleData);
      }

      if (response.success) {
        message.success(`Flash sale ${editingSale ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchFlashSales();
      } else {
        message.error(`Failed to ${editingSale ? 'update' : 'create'} flash sale`);
      }
    } catch (error) {
      message.error(`Failed to ${editingSale ? 'update' : 'create'} flash sale`);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await flashSalesAPI.uploadImage(file);
      if (response.success && response.data) {
        setUploadedImage((response.data as { url: string }).url);
        message.success('Image uploaded successfully');
      } else {
        message.error('Failed to upload image');
      }
    } catch (error) {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);

    if (!sale.isActive) return 'red';
    if (now < start) return 'blue';
    if (now > end) return 'gray';
    return 'green';
  };

  const getStatusText = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);

    if (!sale.isActive) return 'Inactive';
    if (now < start) return 'Scheduled';
    if (now > end) return 'Expired';
    return 'Active';
  };

  const getTimeRemaining = (sale: FlashSale) => {
    const now = new Date();
    const end = new Date(sale.endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  const filteredSales = flashSales.filter(sale => {
    const matchesSearch = !searchText || 
      sale.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && sale.isActive && new Date() >= new Date(sale.startDate) && new Date() <= new Date(sale.endDate)) ||
      (filterStatus === 'scheduled' && sale.isActive && new Date() < new Date(sale.startDate)) ||
      (filterStatus === 'expired' && new Date() > new Date(sale.endDate)) ||
      (filterStatus === 'inactive' && !sale.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<FlashSale> = [
    {
      title: 'Banner',
      dataIndex: 'bannerImage',
      key: 'bannerImage',
      width: 80,
      render: (image: string) => (
        <Image
          width={50}
          height={50}
          src={image || '/placeholder-image.jpg'}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.discountType === 'PERCENTAGE' 
              ? `${record.discountValue}%` 
              : `$${record.discountValue}`
            }
          </div>
          {record.maxDiscount && (
            <div className="text-xs text-gray-500">
              Max: ${record.maxDiscount}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div className="text-sm">
            {dayjs(record.startDate).format('MMM DD, YYYY')}
          </div>
          <div className="text-sm text-gray-500">
            to {dayjs(record.endDate).format('MMM DD, YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = getStatusText(record);
        const color = getStatusColor(record);
        return (
          <div>
            <Tag color={color}>{status}</Tag>
            {status === 'Active' && record.countdownEnabled && (
              <div className="text-xs text-gray-500 mt-1">
                <ClockCircleOutlined /> {getTimeRemaining(record)}
              </div>
            )}
          </div>
        );
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'Expired', value: 'expired' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => {
        const now = new Date();
        const start = new Date(record.startDate);
        const end = new Date(record.endDate);

        if (value === 'active') return record.isActive && now >= start && now <= end;
        if (value === 'scheduled') return record.isActive && now < start;
        if (value === 'expired') return now > end;
        if (value === 'inactive') return !record.isActive;
        return true;
      },
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_, record) => (
        <div className="text-center">
          <div className="text-sm font-medium">{record.productsCount}</div>
          <div className="text-xs text-gray-500">Products</div>
          <div className="text-sm font-medium">{record.ordersCount}</div>
          <div className="text-xs text-gray-500">Orders</div>
        </div>
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
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this flash sale?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <FireOutlined className="mr-2" />
          Flash Sales Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Create Flash Sale
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Search flash sales..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="scheduled">Scheduled</Option>
                <Option value="expired">Expired</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchFlashSales}
                style={{ width: '100%' }}
              >
                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredSales}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} flash sales`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Sale Name"
                rules={[{ required: true, message: 'Please enter sale name' }]}
              >
                <Input placeholder="Enter sale name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Discount Type"
                rules={[{ required: true, message: 'Please select discount type' }]}
              >
                <Select placeholder="Select discount type">
                  <Option value="PERCENTAGE">Percentage</Option>
                  <Option value="FIXED_AMOUNT">Fixed Amount</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter sale description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[{ required: true, message: 'Please enter discount value' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxDiscount"
                label="Max Discount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="No limit"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minOrderValue"
                label="Min Order Value"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="No minimum"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bannerImage"
            label="Banner Image"
          >
            <div className="mb-4">
              <Upload
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                >
                  Upload Banner
                </Button>
              </Upload>
            </div>

            {uploadedImage && (
              <div className="relative inline-block">
                <Image
                  width={200}
                  height={100}
                  src={uploadedImage}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setUploadedImage('')}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </div>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isFeatured"
                label="Featured"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="countdownEnabled"
                label="Countdown Timer"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingSale ? 'Update Flash Sale' : 'Create Flash Sale'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FlashSales;
