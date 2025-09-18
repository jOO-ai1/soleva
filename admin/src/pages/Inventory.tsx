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
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Progress,
  Badge,
  Alert,
  Tabs,
  List,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  InboxOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { inventoryAPI, suppliersAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { InventoryItem, Supplier, PurchaseOrder } from '../types/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Using InventoryItem, Supplier, and PurchaseOrder types from API types

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, suppliersRes, ordersRes] = await Promise.all([
        inventoryAPI.getAll(),
        suppliersAPI.getAll(),
        inventoryAPI.getPurchaseOrders(),
      ]);

      if (inventoryRes.success) {
        setInventoryItems(inventoryRes.data as InventoryItem[]);
      }
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data as Supplier[]);
      }
      if (ordersRes.success) {
        setPurchaseOrders(ordersRes.data as PurchaseOrder[]);
      }
    } catch (error) {
      message.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      currentStock: item.currentStock,
      lowStockThreshold: item.lowStockThreshold,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await inventoryAPI.delete(id);
      if (response.success) {
        message.success('Inventory item deleted successfully');
        fetchData();
      } else {
        message.error('Failed to delete inventory item');
      }
    } catch (error) {
      message.error('Failed to delete inventory item');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;
      if (editingItem) {
        response = await inventoryAPI.update(editingItem.id, values);
      } else {
        response = await inventoryAPI.create(values);
      }

      if (response.success) {
        message.success(`Inventory item ${editingItem ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchData();
      } else {
        message.error(`Failed to ${editingItem ? 'update' : 'create'} inventory item`);
      }
    } catch (error) {
      message.error(`Failed to ${editingItem ? 'update' : 'create'} inventory item`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      IN_STOCK: 'green',
      LOW_STOCK: 'orange',
      OUT_OF_STOCK: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'OUT_OF_STOCK';
    if (item.currentStock <= item.lowStockThreshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const getStockPercentage = (item: InventoryItem) => {
    const maxStock = Math.max(item.currentStock + 50, 100); // Assume max stock for percentage
    return Math.round((item.currentStock / maxStock) * 100);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = !searchText || 
      item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !filterStatus || getStatusText(item) === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const lowStockItems = inventoryItems.filter(item => getStatusText(item) === 'LOW_STOCK');
  const outOfStockItems = inventoryItems.filter(item => getStatusText(item) === 'OUT_OF_STOCK');

  const inventoryColumns: ColumnsType<InventoryItem> = [
    {
      title: 'Product',
      key: 'product',
      render: (record, _) => (
        <div>
          <div className="font-medium">{record.productName}</div>
          <div className="text-sm text-gray-500">{record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record) => (
        <div>
          <div className="font-medium">{stock}</div>
          <Progress
            percent={getStockPercentage(record)}
            size="small"
            showInfo={false}
            status={getStatusText(record) === 'OUT_OF_STOCK' ? 'exception' : 'normal'}
          />
        </div>
      ),
      sorter: (a, b) => a.currentStock - b.currentStock,
    },
    {
      title: 'Available',
      dataIndex: 'availableStock',
      key: 'availableStock',
      render: (stock: number) => (
        <Badge count={stock} style={{ backgroundColor: stock > 0 ? '#52c41a' : '#f5222d' }} />
      ),
    },
    {
      title: 'Threshold',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold: number) => (
        <span className="text-gray-600">{threshold}</span>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Status',
      key: 'status',
      render: (record, _) => {
        const status = getStatusText(record);
        return <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>;
      },
      filters: [
        { text: 'In Stock', value: 'IN_STOCK' },
        { text: 'Low Stock', value: 'LOW_STOCK' },
        { text: 'Out of Stock', value: 'OUT_OF_STOCK' },
      ],
      onFilter: (value, record) => getStatusText(record) === value,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record, _) => (
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
            title="Are you sure you want to delete this inventory item?"
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

  const purchaseOrderColumns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          RECEIVED: 'green',
          CANCELLED: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDelivery',
      key: 'expectedDelivery',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record, _) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small">
            View
          </Button>
          <Button type="text" icon={<EditOutlined />} size="small">
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <InboxOutlined className="mr-2" />
          Inventory Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />}>
            Export
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Stock
          </Button>
        </Space>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {lowStockItems.length > 0 && (
            <Col span={12}>
              <Alert
                message={`${lowStockItems.length} items are low in stock`}
                description="Consider reordering these items soon."
                type="warning"
                showIcon
                action={
                  <Button size="small" onClick={() => setFilterStatus('LOW_STOCK')}>
                    View Items
                  </Button>
                }
              />
            </Col>
          )}
          {outOfStockItems.length > 0 && (
            <Col span={12}>
              <Alert
                message={`${outOfStockItems.length} items are out of stock`}
                description="These items need immediate attention."
                type="error"
                showIcon
                action={
                  <Button size="small" onClick={() => setFilterStatus('OUT_OF_STOCK')}>
                    View Items
                  </Button>
                }
              />
            </Col>
          )}
        </Row>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Inventory" key="inventory">
          <Card>
            <div className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    placeholder="Search inventory..."
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
                    <Option value="IN_STOCK">In Stock</Option>
                    <Option value="LOW_STOCK">Low Stock</Option>
                    <Option value="OUT_OF_STOCK">Out of Stock</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={fetchData}
                    style={{ width: '100%' }}
                  >
                    Apply
                  </Button>
                </Col>
              </Row>
            </div>

            <Table
              columns={inventoryColumns}
              dataSource={filteredItems}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Purchase Orders" key="orders">
          <Card>
            <div className="mb-4">
              <Button type="primary" icon={<PlusOutlined />}>
                Create Purchase Order
              </Button>
            </div>

            <Table
              columns={purchaseOrderColumns}
              dataSource={purchaseOrders}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} orders`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Suppliers" key="suppliers">
          <Card>
            <div className="mb-4">
              <Button type="primary" icon={<PlusOutlined />}>
                Add Supplier
              </Button>
            </div>

            <List
              dataSource={suppliers}
              renderItem={(supplier) => (
                <List.Item
                  actions={[
                    <Button type="text" icon={<EditOutlined />} key="edit">
                      Edit
                    </Button>,
                    <Button type="text" icon={<DeleteOutlined />} key="delete" danger>
                      Delete
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<ShoppingOutlined />} />}
                    title={supplier.name}
                    description={
                      <div>
                        <div>{supplier.contactPerson}</div>
                        <div>{supplier.email} • {supplier.phone}</div>
                        <div className="text-sm text-gray-500">{supplier.address}</div>
                      </div>
                    }
                  />
                  <div>
                    <Tag color={supplier.isActive ? 'green' : 'red'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Inventory Update Modal */}
      <Modal
        title={editingItem ? 'Update Inventory' : 'Add Stock'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currentStock"
                label="Current Stock"
                rules={[{ required: true, message: 'Please enter current stock' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lowStockThreshold"
                label="Low Stock Threshold"
                rules={[{ required: true, message: 'Please enter low stock threshold' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="5"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="costPrice"
                label="Cost Price"
                rules={[{ required: true, message: 'Please enter cost price' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sellingPrice"
                label="Selling Price"
                rules={[{ required: true, message: 'Please enter selling price' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingItem ? 'Update Inventory' : 'Add Stock'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;