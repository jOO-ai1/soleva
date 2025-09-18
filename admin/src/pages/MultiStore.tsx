import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Image,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  Popconfirm,
  Tabs,
  Badge,
} from 'antd';
import {
  ShopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  DollarOutlined,
  InboxOutlined,
  GiftOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { multiStoreAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Store, StoreProduct, StoreInventory, StorePromotion } from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Using Store type from API types

// Using StoreProduct, StoreInventory, and StorePromotion types from API types

const MultiStore = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [storePromotions, setStorePromotions] = useState<StorePromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState('stores');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, inventoryRes, promotionsRes] = await Promise.all([
        multiStoreAPI.getStores(),
        multiStoreAPI.getStoreProducts(),
        multiStoreAPI.getStoreInventory(),
        multiStoreAPI.getStorePromotions(),
      ]);

      if (storesRes.success) setStores(storesRes.data as Store[]);
      if (productsRes.success) setStoreProducts(productsRes.data as StoreProduct[]);
      if (inventoryRes.success) setStoreInventory(inventoryRes.data as StoreInventory[]);
      if (promotionsRes.success) setStorePromotions(promotionsRes.data as StorePromotion[]);
    } catch (error) {
      message.error('Failed to fetch multi-store data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStore(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.setFieldsValue({
      name: store.name,
      description: store.description,
      domain: store.domain,
      subdomain: store.subdomain,
      email: store.email,
      phone: store.phone,
      address: store.address,
      currency: store.currency,
      timezone: store.timezone,
      language: store.language,
      isActive: store.isActive,
      isDefault: store.isDefault,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await multiStoreAPI.deleteStore(id);
      if (response.success) {
        message.success('Store deleted successfully');
        fetchData();
      } else {
        message.error('Failed to delete store');
      }
    } catch (error) {
      message.error('Failed to delete store');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;
      if (editingStore) {
        response = await multiStoreAPI.updateStore(editingStore.id, values);
      } else {
        response = await multiStoreAPI.createStore(values);
      }

      if (response.success) {
        message.success(`Store ${editingStore ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchData();
      } else {
        message.error(`Failed to ${editingStore ? 'update' : 'create'} store`);
      }
    } catch (error) {
      message.error(`Failed to ${editingStore ? 'update' : 'create'} store`);
    }
  };

  const storeColumns: ColumnsType<Store> = [
    {
      title: 'Store',
      key: 'store',
      render: (record, _) => (
        <div className="flex items-center space-x-3">
          {record.logo ? (
            <Image
              width={40}
              height={40}
              src={record.logo}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <ShopOutlined />
            </div>
          )}
          <div>
            <div className="font-medium">
              {record.name ? (typeof record.name === 'object' ? (record.name!.en || 'Unnamed Store') : record.name) : 'Unnamed Store'}
            </div>
            <div className="text-sm text-gray-500">{record.domain}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Domain',
      key: 'domain',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.domain}</div>
          <div className="text-sm text-gray-500">{record.subdomain}.soleva.com</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record, _) => (
        <div>
          <div className="text-sm">{record.email}</div>
          <div className="text-sm text-gray-500">{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Settings',
      key: 'settings',
      render: (record, _) => (
        <div>
          <div className="flex items-center space-x-2">
            <Tag color="blue">{record.currency}</Tag>
            <Tag color="green">{record.language.toUpperCase()}</Tag>
          </div>
          <div className="text-sm text-gray-500 mt-1">{record.timezone}</div>
        </div>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (record, _) => (
        <div>
          <div className="text-sm">
            <Badge count={record.productsCount} style={{ backgroundColor: '#1890ff' }} />
            <span className="ml-2">Products</span>
          </div>
          <div className="text-sm">
            <Badge count={record.ordersCount} style={{ backgroundColor: '#52c41a' }} />
            <span className="ml-2">Orders</span>
          </div>
          <div className="text-sm font-medium">${record.revenue.toFixed(2)}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record, _) => (
        <div>
          <div className="flex items-center space-x-2">
            <Tag color={record.isActive ? 'green' : 'red'}>
              {record.isActive ? 'Active' : 'Inactive'}
            </Tag>
            {record.isDefault && (
              <Tag color="blue" icon={<CheckCircleOutlined />}>Default</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record, _) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => window.open(`https://${record.domain}`, '_blank')}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setSelectedStore(record.id)}
          />
          <Popconfirm
            title="Are you sure you want to delete this store?"
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

  const productColumns: ColumnsType<StoreProduct> = [
    {
      title: 'Product',
      key: 'product',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.productName}</div>
          <div className="text-sm text-gray-500">Store: {record.storeId}</div>
        </div>
      ),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (record, _) => (
        <div>
          <div className="font-medium">${record.price.toFixed(2)}</div>
          {record.comparePrice && (
            <div className="text-sm text-gray-500 line-through">
              ${record.comparePrice.toFixed(2)}
            </div>
          )}
          {record.costPrice && (
            <div className="text-sm text-green-600">
              Cost: ${record.costPrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Inventory',
      key: 'inventory',
      render: (record, _) => (
        <div>
          <div className="flex items-center space-x-2">
            <Badge count={record.stockQuantity} style={{ backgroundColor: '#52c41a' }} />
            <span>Stock</span>
          </div>
          <div className="text-sm text-gray-500">
            Low: {record.lowStockThreshold}
          </div>
        </div>
      ),
    },
    {
      title: 'Settings',
      key: 'settings',
      render: (record, _) => (
        <div>
          <div className="flex items-center space-x-2">
            <Tag color={record.isActive ? 'green' : 'red'}>
              {record.isActive ? 'Active' : 'Inactive'}
            </Tag>
            {record.isFeatured && (
              <Tag color="blue">Featured</Tag>
            )}
          </div>
          <div className="text-sm text-gray-500">Order: {record.sortOrder}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record, _) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  const inventoryColumns: ColumnsType<StoreInventory> = [
    {
      title: 'Product',
      key: 'product',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.productName}</div>
          {record.variantName && (
            <div className="text-sm text-gray-500">{record.variantName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.stockQuantity}</div>
          <div className="text-sm text-gray-500">
            Available: {record.availableQuantity}
          </div>
          <div className="text-sm text-orange-500">
            Reserved: {record.reservedQuantity}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (record, _) => (
        <div>
          {record.warehouse && (
            <div className="text-sm">{record.warehouse}</div>
          )}
          {record.shelf && (
            <div className="text-sm text-gray-500">Shelf: {record.shelf}</div>
          )}
          {record.bin && (
            <div className="text-sm text-gray-500">Bin: {record.bin}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record, _) => (
        <Tag color={
          record.status === 'IN_STOCK' ? 'green' :
          record.status === 'LOW_STOCK' ? 'orange' : 'red'
        }>
          {record.status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Threshold',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold: number) => (
        <Badge count={threshold} style={{ backgroundColor: '#faad14' }} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record, _) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<InboxOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  const promotionColumns: ColumnsType<StorePromotion> = [
    {
      title: 'Promotion',
      key: 'promotion',
      render: (record, _) => (
        <div>
          <div className="font-medium">
            {record.name ? (typeof record.name === 'object' ? (record.name!.en || 'Unnamed Promotion') : record.name) : 'Unnamed Promotion'}
          </div>
          <div className="text-sm text-gray-500">
            {record.description ? (typeof record.description === 'object' ? (record.description!.en || 'No description') : record.description) : 'No description'}
          </div>
        </div>
      ),
    },
    {
      title: 'Type & Value',
      key: 'type',
      render: (record, _) => (
        <div>
          <Tag color="blue">{record.type.replace('_', ' ')}</Tag>
          <div className="font-medium">${record.value.toFixed(2)}</div>
        </div>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.usageCount}</div>
          {record.maxUsage && (
            <div className="text-sm text-gray-500">/ {record.maxUsage}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (record, _) => (
        <div>
          <div className="text-sm">{dayjs(record.startDate).format('MMM DD')}</div>
          <div className="text-sm text-gray-500">
            to {record.endDate ? dayjs(record.endDate).format('MMM DD') : '∞'}
          </div>
        </div>
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
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record, _) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <ShopOutlined className="mr-2" />
          Multi-Store Management
        </Title>
        <Space>
          <Button icon={<BarChartOutlined />}>
            Analytics
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Store
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Stores" key="stores" icon={<ShopOutlined />}>
          <Card>
            <Table
              columns={storeColumns}
              dataSource={stores}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} stores`,
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Store Products" key="products" icon={<DollarOutlined />}>
          <Card>
            <div className="mb-4">
              <Select
                placeholder="Filter by store"
                style={{ width: 200 }}
                value={selectedStore}
                onChange={setSelectedStore}
                allowClear
              >
                {stores.map(store => (
                  <Option key={store.id} value={store.id}>
                    {store.name ? (typeof store.name === 'object' ? (store.name!.en || 'Unnamed Store') : store.name) : 'Unnamed Store'}
                  </Option>
                ))}
              </Select>
            </div>

            <Table
              columns={productColumns}
              dataSource={storeProducts.filter(p => !selectedStore || p.storeId === selectedStore)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} products`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Store Inventory" key="inventory" icon={<InboxOutlined />}>
          <Card>
            <div className="mb-4">
              <Select
                placeholder="Filter by store"
                style={{ width: 200 }}
                value={selectedStore}
                onChange={setSelectedStore}
                allowClear
              >
                {stores.map(store => (
                  <Option key={store.id} value={store.id}>
                    {store.name ? (typeof store.name === 'object' ? (store.name!.en || 'Unnamed Store') : store.name) : 'Unnamed Store'}
                  </Option>
                ))}
              </Select>
            </div>

            <Table
              columns={inventoryColumns}
              dataSource={storeInventory.filter(i => !selectedStore || i.storeId === selectedStore)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Store Promotions" key="promotions" icon={<GiftOutlined />}>
          <Card>
            <div className="mb-4">
              <Select
                placeholder="Filter by store"
                style={{ width: 200 }}
                value={selectedStore}
                onChange={setSelectedStore}
                allowClear
              >
                {stores.map(store => (
                  <Option key={store.id} value={store.id}>
                    {store.name ? (typeof store.name === 'object' ? (store.name!.en || 'Unnamed Store') : store.name) : 'Unnamed Store'}
                  </Option>
                ))}
              </Select>
            </div>

            <Table
              columns={promotionColumns}
              dataSource={storePromotions.filter(p => !selectedStore || p.storeId === selectedStore)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} promotions`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Store Edit Modal */}
      <Modal
        title={editingStore ? 'Edit Store' : 'Add Store'}
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
                label="Store Name"
                rules={[{ required: true, message: 'Please enter store name' }]}
              >
                <Input placeholder="Enter store name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="domain"
                label="Domain"
                rules={[{ required: true, message: 'Please enter domain' }]}
              >
                <Input placeholder="cairo.soleva.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subdomain"
                label="Subdomain"
                rules={[{ required: true, message: 'Please enter subdomain' }]}
              >
                <Input placeholder="cairo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Contact Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter contact email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select placeholder="Select currency">
                  <Option value="EGP">Egyptian Pound (EGP)</Option>
                  <Option value="USD">US Dollar (USD)</Option>
                  <Option value="EUR">Euro (EUR)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="timezone"
                label="Timezone"
                rules={[{ required: true, message: 'Please select timezone' }]}
              >
                <Select placeholder="Select timezone">
                  <Option value="Africa/Cairo">Africa/Cairo</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="language"
                label="Language"
                rules={[{ required: true, message: 'Please select language' }]}
              >
                <Select placeholder="Select language">
                  <Option value="en">English</Option>
                  <Option value="ar">Arabic</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter store description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isDefault"
                label="Default Store"
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
              {editingStore ? 'Update Store' : 'Create Store'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MultiStore;
