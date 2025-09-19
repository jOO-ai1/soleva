import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Avatar,
  Badge,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Switch,
  InputNumber,
  message,
  Tabs,
  Table,
  Statistic,
  Progress,
  Layout,
  List,
  Divider,
  Tooltip,
  Empty,
  Alert,
  Timeline
} from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  SearchOutlined,
  BellOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  HeartOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { chatAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Content, Sider } = Layout;

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'ACTIVE' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  assignedToName?: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  createdAt: string;
  tags: string[];
  source: 'WEBSITE' | 'MOBILE' | 'EMAIL' | 'PHONE';
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface ChatBot {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  autoRespond: boolean;
  isActive: boolean;
  conversationsCount: number;
  successRate: number;
}

interface EscalationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    responseTime?: number;
    messageCount?: number;
    keywords?: string[];
    customerTier?: string;
  };
  actions: {
    notifyAdmin?: boolean;
    autoResponse?: string;
    escalateTo?: string;
    assignTo?: string;
  };
  priority: number;
  isActive: boolean;
  triggerCount: number;
}

const ChatSupport = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [chatBots, setChatBots] = useState<ChatBot[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [botModalVisible, setBotModalVisible] = useState(false);
  const [editingBot, setEditingBot] = useState<ChatBot | null>(null);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [form] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conversationsRes, botsRes, rulesRes] = await Promise.all([
      chatAPI.getConversations(),
      chatAPI.getChatBots(),
      chatAPI.getEscalationRules()]
      );

      if (conversationsRes.success) {
        setConversations(conversationsRes.data);
      }
      if (botsRes.success) {
        setChatBots(botsRes.data as ChatBot[]);
      }
      if (rulesRes.success) {
        setEscalationRules(rulesRes.data as EscalationRule[]);
      }
    } catch {
      message.error('Failed to fetch chat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await chatAPI.getConversation(conversationId);
      if (response.success) {
        setMessages((response.data as {messages: Message[];}).messages || []);
      }
    } catch {
      message.error('Failed to fetch messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await chatAPI.sendMessage(selectedConversation.id, newMessage);
      if (response.success) {
        setNewMessage('');
        fetchMessages(selectedConversation.id);
        fetchData(); // Refresh conversations list
      } else {
        message.error('Failed to send message');
      }
    } catch {
      message.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (conversationId: string, status: string) => {
    try {
      const response = await chatAPI.updateStatus(conversationId, status);
      if (response.success) {
        message.success('Status updated successfully');
        fetchData();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation({ ...selectedConversation, status: status as 'ACTIVE' | 'WAITING' | 'RESOLVED' | 'CLOSED' });
        }
      } else {
        message.error('Failed to update status');
      }
    } catch {
      message.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'green',
      WAITING: 'orange',
      RESOLVED: 'blue',
      CLOSED: 'gray'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'green',
      MEDIUM: 'blue',
      HIGH: 'orange',
      URGENT: 'red'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getSourceIcon = (source: string) => {
    const icons = {
      WEBSITE: <MessageOutlined />,
      MOBILE: <PhoneOutlined />,
      EMAIL: <MessageOutlined />,
      PHONE: <PhoneOutlined />
    };
    return icons[source as keyof typeof icons] || <MessageOutlined />;
  };

  const conversationColumns: ColumnsType<Conversation> = [
  {
    title: 'Customer',
    key: 'customer',
    render: (record, _) =>
    <div className="flex items-center space-x-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.customerName}</div>
            <div className="text-sm text-gray-500">{record.customerEmail}</div>
          </div>
        </div>

  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) =>
    <Tag color={getStatusColor(status)}>{status}</Tag>,

    filters: [
    { text: 'Active', value: 'ACTIVE' },
    { text: 'Waiting', value: 'WAITING' },
    { text: 'Resolved', value: 'RESOLVED' },
    { text: 'Closed', value: 'CLOSED' }],

    onFilter: (value, record) => record.status === value
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    render: (priority: string) =>
    <Tag color={getPriorityColor(priority)}>{priority}</Tag>

  },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    render: (source: string) =>
    <div className="flex items-center space-x-1">
          {getSourceIcon(source)}
          <span>{source}</span>
        </div>

  },
  {
    title: 'Last Message',
    key: 'lastMessage',
    render: (record, _) =>
    <div>
          <div className="text-sm truncate max-w-xs">{record.lastMessage}</div>
          <div className="text-xs text-gray-500">
            {dayjs(record.lastMessageTime).format('MMM DD, YYYY')}
          </div>
        </div>

  },
  {
    title: 'Messages',
    dataIndex: 'messageCount',
    key: 'messageCount',
    render: (count: number) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
    sorter: (a, b) => a.messageCount - b.messageCount
  },
  {
    title: 'Assigned To',
    key: 'assignedTo',
    render: (record, _) =>
    <div>
          {record.assignedToName ?
      <Tag color="blue">{record.assignedToName}</Tag> :

      <Tag color="default">Unassigned</Tag>
      }
        </div>

  },
  {
    title: 'Actions',
    key: 'actions',
    render: (record, _) =>
    <Space>
          <Button
        type="text"
        icon={<EyeOutlined />}
        onClick={() => setSelectedConversation(record)} />

          <Select
        size="small"
        value={record.status}
        onChange={(value) => handleUpdateStatus(record.id, value)}
        style={{ width: 100 }}>

            <Option value="ACTIVE">Active</Option>
            <Option value="WAITING">Waiting</Option>
            <Option value="RESOLVED">Resolved</Option>
            <Option value="CLOSED">Closed</Option>
          </Select>
        </Space>

  }];


  const botColumns: ColumnsType<ChatBot> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record) =>
    <div className="flex items-center space-x-2">
          <RobotOutlined className="text-blue-500" />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{record.model}</div>
          </div>
        </div>

  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: 'Conversations',
    dataIndex: 'conversationsCount',
    key: 'conversationsCount',
    render: (count: number) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />,
    sorter: (a, b) => a.conversationsCount - b.conversationsCount
  },
  {
    title: 'Success Rate',
    dataIndex: 'successRate',
    key: 'successRate',
    render: (rate: number) =>
    <div className="flex items-center space-x-2">
          <Progress
        percent={rate}
        size="small"
        strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f'} />

          <span className="text-sm">{rate}%</span>
        </div>,

    sorter: (a, b) => a.successRate - b.successRate
  },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    render: (isActive: boolean) =>
    <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>

  },
  {
    title: 'Actions',
    key: 'actions',
    render: (record, _) =>
    <Space>
          <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => handleEditBot(record)} />

          <Button
        type="text"
        icon={<DeleteOutlined />}
        danger />

        </Space>

  }];


  const handleEditBot = (bot: ChatBot) => {
    setEditingBot(bot);
    form.setFieldsValue({
      name: bot.name,
      description: bot.description,
      model: bot.model,
      systemPrompt: bot.systemPrompt,
      temperature: bot.temperature,
      maxTokens: bot.maxTokens,
      autoRespond: bot.autoRespond,
      isActive: bot.isActive
    });
    setBotModalVisible(true);
  };

  const handleSaveBot = async (_values: {name: string;description: string;isActive: boolean;}) => {
    try {
      // TODO: Implement bot save logic
      message.success(`Chat bot ${editingBot ? 'updated' : 'created'} successfully`);
      setBotModalVisible(false);
      fetchData();
    } catch {
      message.error(`Failed to ${editingBot ? 'update' : 'create'} chat bot`);
    }
  };

  const stats = {
    totalConversations: conversations.length,
    activeConversations: conversations.filter((c) => c.status === 'ACTIVE').length,
    waitingConversations: conversations.filter((c) => c.status === 'WAITING').length,
    resolvedToday: conversations.filter((c) =>
    c.status === 'RESOLVED' && dayjs(c.createdAt).isSame(dayjs(), 'day')
    ).length,
    avgResponseTime: '2.5 min',
    customerSatisfaction: 4.8
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <MessageOutlined className="mr-2" />
          Chat Support
        </Title>
        <Space>
          <Button icon={<BarChartOutlined />}>
            Analytics
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            New Conversation
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Conversations"
              value={stats.totalConversations}
              prefix={<MessageOutlined />} />

          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Conversations"
              value={stats.activeConversations}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#3f8600' }} />

          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Waiting"
              value={stats.waitingConversations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }} />

          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resolved Today"
              value={stats.resolvedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }} />

          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Conversations" key="conversations">
          <Row gutter={16}>
            <Col span={16}>
              <Card>
                <Table
                  columns={conversationColumns}
                  dataSource={conversations}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} conversations`
                  }}
                  onRow={(record) => ({
                    onClick: () => setSelectedConversation(record),
                    style: { cursor: 'pointer' }
                  })} />

              </Card>
            </Col>
            <Col span={8}>
              {selectedConversation ?
              <Card
                title={
                <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedConversation.customerName}</div>
                        <div className="text-sm text-gray-500">{selectedConversation.customerEmail}</div>
                      </div>
                      <Tag color={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status}
                      </Tag>
                    </div>
                }
                extra={
                <Space>
                      <Button size="small" icon={<PhoneOutlined />} />
                      <Button size="small" icon={<VideoCameraOutlined />} />
                      <Button size="small" icon={<MoreOutlined />} />
                    </Space>
                }>

                  <div className="h-96 overflow-y-auto mb-4 space-y-3">
                    {messages.map((message) =>
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}>

                        <div
                      className={`max-w-xs p-3 rounded-lg ${
                      message.senderType === 'CUSTOMER' ?
                      'bg-gray-100' :
                      'bg-blue-500 text-white'}`
                      }>

                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {dayjs(message.timestamp).format('HH:mm')}
                          </div>
                        </div>
                      </div>
                  )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex space-x-2">
                    <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onPressEnter={handleSendMessage} />

                    <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sending} />

                  </div>
                </Card> :

              <Card>
                  <div className="text-center text-gray-500 py-8">
                    <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>Select a conversation to start chatting</div>
                  </div>
                </Card>
              }
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Chat Bots" key="bots">
          <Card>
            <div className="mb-4">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingBot(null);
                  form.resetFields();
                  setBotModalVisible(true);
                }}>

                Create Chat Bot
              </Button>
            </div>

            <Table
              columns={botColumns}
              dataSource={chatBots}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} bots`
              }} />

          </Card>
        </TabPane>

        <TabPane tab="Escalation Rules" key="rules">
          <Card>
            <div className="mb-4">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRule(null);
                  ruleForm.resetFields();
                  setRuleModalVisible(true);
                }}>

                Create Rule
              </Button>
            </div>

            <Table
              columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name'
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true
              },
              {
                title: 'Priority',
                dataIndex: 'priority',
                key: 'priority',
                render: (priority: number) =>
                <Tag color={priority === 1 ? 'red' : priority === 2 ? 'orange' : 'blue'}>
                      {priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low'}
                    </Tag>

              },
              {
                title: 'Triggers',
                dataIndex: 'triggerCount',
                key: 'triggerCount',
                render: (count: number) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
              },
              {
                title: 'Status',
                dataIndex: 'isActive',
                key: 'isActive',
                render: (isActive: boolean) =>
                <Tag color={isActive ? 'green' : 'red'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Tag>

              },
              {
                title: 'Actions',
                key: 'actions',
                render: (record, _) =>
                <Space>
                      <Button type="text" icon={<EditOutlined />} />
                      <Button type="text" icon={<DeleteOutlined />} danger />
                    </Space>

              }]
              }
              dataSource={escalationRules}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} rules`
              }} />

          </Card>
        </TabPane>
      </Tabs>

      {/* Chat Bot Modal */}
      <Modal
        title={editingBot ? 'Edit Chat Bot' : 'Create Chat Bot'}
        open={botModalVisible}
        onCancel={() => setBotModalVisible(false)}
        footer={null}
        width={800}>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveBot}>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Bot Name"
                rules={[{ required: true, message: 'Please enter bot name' }]}>

                <Input placeholder="Enter bot name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="AI Model"
                rules={[{ required: true, message: 'Please select model' }]}>

                <Select placeholder="Select model">
                  <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
                  <Option value="gpt-4">GPT-4</Option>
                  <Option value="claude-3">Claude 3</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description">

            <TextArea rows={3} placeholder="Enter bot description" />
          </Form.Item>

          <Form.Item
            name="systemPrompt"
            label="System Prompt"
            rules={[{ required: true, message: 'Please enter system prompt' }]}>

            <TextArea rows={4} placeholder="Enter system prompt" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="temperature"
                label="Temperature">

                <InputNumber min={0} max={2} step={0.1} placeholder="0.7" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxTokens"
                label="Max Tokens">

                <InputNumber min={100} max={4000} placeholder="1000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="autoRespond"
                label="Auto Respond"
                valuePropName="checked">

                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked">

            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBotModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingBot ? 'Update Bot' : 'Create Bot'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);

};

export default ChatSupport;