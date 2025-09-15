import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  Timeline,
  InputNumber,
  message,
  Popconfirm,
  Tabs,
  Divider,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  DollarOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { ordersAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  variant?: {
    id: string;
    size: string;
    color: string;
  };
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingStatus: string;
  timeline: Array<{
    id: string;
    status: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [refundForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

  const orderStatuses = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];

  const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll({
        search: searchText,
        status: filterStatus,
      });
      
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const response = await ordersAPI.getById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
        setModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch order details');
    }
  };

  const handleUpdateStatus = async (values: { status: string; notes?: string }) => {
    if (!selectedOrder) return;

    try {
      const response = await ordersAPI.updateStatus(selectedOrder.id, values.status, values.notes);
      if (response.success) {
        message.success('Order status updated successfully');
        setStatusModalVisible(false);
        fetchOrders();
        if (modalVisible) {
          handleViewOrder(selectedOrder.id);
        }
      } else {
        message.error('Failed to update order status');
      }
    } catch (error) {
      message.error('Failed to update order status');
    }
  };

  const handleProcessRefund = async (values: { amount: number; reason: string }) => {
    if (!selectedOrder) return;

    try {
      const response = await ordersAPI.processRefund(selectedOrder.id, values.amount, values.reason);
      if (response.success) {
        message.success('Refund processed successfully');
        setRefundModalVisible(false);
        fetchOrders();
        if (modalVisible) {
          handleViewOrder(selectedOrder.id);
        }
      } else {
        message.error('Failed to process refund');
      }
    } catch (error) {
      message.error('Failed to process refund');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      PROCESSING: 'purple',
      SHIPPED: 'cyan',
      DELIVERED: 'green',
      CANCELLED: 'red',
      RETURNED: 'volcano',
      PAID: 'green',
      FAILED: 'red',
      REFUNDED: 'orange',
      PARTIALLY_REFUNDED: 'yellow',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: Order) => (
        <Button
          type="link"
          onClick={() => handleViewOrder(record.id)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['user', 'name'],
      key: 'customer',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.user.name.toLowerCase().includes(value.toString().toLowerCase()) ||
        record.user.email.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Order Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: orderStatuses.map(status => ({ text: status, value: status })),
      onFilter: (value, record) => record.orderStatus === value,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: paymentStatuses.map(status => ({ text: status, value: status })),
      onFilter: (value, record) => record.paymentStatus === value,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record.id)}
          >
            View
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setStatusModalVisible(true);
            }}
          >
            Update Status
          </Button>
          {record.paymentStatus === 'PAID' && (
            <Button
              type="text"
              icon={<DollarOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setRefundModalVisible(true);
              }}
            >
              Refund
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>Orders Management</Title>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search orders..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchOrders}
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
                {orderStatuses.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by payment status"
                style={{ width: '100%' }}
                value={filterPaymentStatus}
                onChange={setFilterPaymentStatus}
                allowClear
              >
                {paymentStatuses.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchOrders}
                style={{ width: '100%' }}
              >
                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={`Order Details - ${selectedOrder?.orderNumber}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedOrder && (
          <Tabs defaultActiveKey="details">
            <TabPane tab="Order Details" key="details">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Order Number" span={1}>
                  {selectedOrder.orderNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Order Status" span={1}>
                  <Tag color={getStatusColor(selectedOrder.orderStatus)}>
                    {selectedOrder.orderStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Status" span={1}>
                  <Tag color={getStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount" span={1}>
                  ${selectedOrder.totalAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Name" span={1}>
                  {selectedOrder.user.name}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Email" span={1}>
                  {selectedOrder.user.email}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Phone" span={1}>
                  {selectedOrder.user.phone || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Order Date" span={1}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Title level={4}>Shipping Address</Title>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Street" span={2}>
                  {selectedOrder.address.street}
                </Descriptions.Item>
                <Descriptions.Item label="City" span={1}>
                  {selectedOrder.address.city}
                </Descriptions.Item>
                <Descriptions.Item label="State" span={1}>
                  {selectedOrder.address.state}
                </Descriptions.Item>
                <Descriptions.Item label="ZIP Code" span={1}>
                  {selectedOrder.address.zipCode}
                </Descriptions.Item>
                <Descriptions.Item label="Country" span={1}>
                  {selectedOrder.address.country}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Order Items" key="items">
              <Table
                dataSource={selectedOrder.items}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, record) => (
                      <div>
                        <div className="font-medium">{record.product.name}</div>
                        {record.variant && (
                          <div className="text-sm text-gray-500">
                            {record.variant.size} - {record.variant.color}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `$${price.toFixed(2)}`,
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    key: 'total',
                    render: (total: number) => `$${total.toFixed(2)}`,
                  },
                ]}
              />
            </TabPane>

            <TabPane tab="Order Timeline" key="timeline">
              <Timeline
                items={selectedOrder.timeline.map(item => ({
                  color: getStatusColor(item.status),
                  children: (
                    <div>
                      <div className="font-medium">{item.status}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      {item.notes && (
                        <div className="text-sm mt-1">{item.notes}</div>
                      )}
                    </div>
                  ),
                }))}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title="Update Order Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateStatus}
          initialValues={{ status: selectedOrder?.orderStatus }}
        >
          <Form.Item
            name="status"
            label="Order Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              {orderStatuses.map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea rows={3} placeholder="Add any notes about this status change" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setStatusModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Status
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        title="Process Refund"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        footer={null}
      >
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={handleProcessRefund}
          initialValues={{ amount: selectedOrder?.totalAmount }}
        >
          <Form.Item
            name="amount"
            label="Refund Amount"
            rules={[{ required: true, message: 'Please enter refund amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={selectedOrder?.totalAmount}
              step={0.01}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Refund Reason"
            rules={[{ required: true, message: 'Please enter refund reason' }]}
          >
            <TextArea rows={3} placeholder="Enter reason for refund" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setRefundModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" danger>
              Process Refund
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
