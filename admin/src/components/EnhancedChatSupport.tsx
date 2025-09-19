
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layout,
  Card,
  List,
  Avatar,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Badge,
  Select,
  message,
  Modal,
  Form,
  Tooltip,
  Empty,
  Timeline,
  Statistic,
  Progress,
  Tabs,
  Alert,
  Switch,
  Divider,
  Rate,
  Spin
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  HeartOutlined,
  StarOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  BellOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ChatConversation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  subject: string;
  status: 'pending' | 'active' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'ai-chat' | 'website' | 'email' | 'phone';
  assignedTo?: string;
  lastMessage: string;
  lastMessageTime: string;
  messagesCount: number;
  rating?: number;
  aiHandled: boolean;
  escalationReason?: string;
  tags: string[];
  createdAt: string;
  resolvedAt?: string;
  responseTime?: number; // in minutes
  customerId?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'ai';
  message: string;
  timestamp: string;
  attachments?: string[];
  isRead: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const PRIORITY_COLORS = {
  low: '#52C41A',
  medium: '#1890FF',
  high: '#FA8C16',
  urgent: '#FF4D4F'
};

const STATUS_COLORS = {
  pending: '#FA8C16',
  active: '#1890FF',
  resolved: '#52C41A',
  escalated: '#FF4D4F'
};

const EnhancedChatSupport: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [escalationModalVisible, setEscalationModalVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();

  // Mock data for demonstration
  const mockConversations: ChatConversation[] = [
    {
      id: '1',
      customerName: 'Ahmed Hassan',
      customerEmail: 'ahmed@example.com',
      subject: 'Order Status Inquiry',
      status: 'pending',
      priority: 'high',
      source: 'ai-chat',
      lastMessage: 'I need help with my order #12345. The AI couldn\'t resolve my issue.',
      lastMessageTime: '2023-12-10T10:30:00Z',
      messagesCount: 5,
      aiHandled: true,
      escalationReason: 'Complex order modification required',
      tags: ['order', 'urgent'],
      createdAt: '2023-12-10T10:00:00Z',
      responseTime: 15
    },
    {
      id: '2',
      customerName: 'Sarah Ahmed',
      customerEmail: 'sarah@example.com',
      subject: 'Product Recommendation',
      status: 'active',
      priority: 'medium',
      source: 'website',
      assignedTo: 'Admin User',
      lastMessage: 'Thank you for the recommendation! Can you show me more options?',
      lastMessageTime: '2023-12-10T11:15:00Z',
      messagesCount: 8,
      rating: 5,
      aiHandled: false,
      tags: ['product', 'recommendation'],
      createdAt: '2023-12-10T10:45:00Z',
      responseTime: 8
    },
    {
      id: '3',
      customerName: 'Mohamed Ali',
      customerEmail: 'mohamed@example.com',
      subject: 'Return Request',
      status: 'resolved',
      priority: 'low',
      source: 'ai-chat',
      lastMessage: 'Perfect! Thank you for processing my return.',
      lastMessageTime: '2023-12-10T09:45:00Z',
      messagesCount: 12,
      rating: 4,
      aiHandled: true,
      tags: ['return', 'resolved'],
      createdAt: '2023-12-10T09:00:00Z',
      resolvedAt: '2023-12-10T09:45:00Z',
      responseTime: 5
    }
  ];

  const mockMessages: { [key: string]: ChatMessage[] } = {
    '1': [
      {
        id: '1',
        conversationId: '1',
        senderId: 'customer1',
        senderName: 'Ahmed Hassan',
        senderType: 'customer',
        message: 'Hi, I need to check my order status for #12345',
        timestamp: '2023-12-10T10:00:00Z',
        isRead: true,
        sentiment: 'neutral'
      },
      {
        id: '2',
        conversationId: '1',
        senderId: 'ai',
        senderName: 'Soleva AI Assistant',
        senderType: 'ai',
        message: 'Hello Ahmed! I can help you check your order status. Let me look that up for you.',
        timestamp: '2023-12-10T10:01:00Z',
        isRead: true,
        sentiment: 'positive'
      },
      {
        id: '3',
        conversationId: '1',
        senderId: 'ai',
        senderName: 'Soleva AI Assistant',
        senderType: 'ai',
        message: 'Your order #12345 is currently being processed. However, I notice you\'d like to make changes to this order. This requires human assistance. Let me connect you with our support team.',
        timestamp: '2023-12-10T10:15:00Z',
        isRead: true,
        sentiment: 'neutral'
      },
      {
        id: '4',
        conversationId: '1',
        senderId: 'customer1',
        senderName: 'Ahmed Hassan',
        senderType: 'customer',
        message: 'Yes, I need to change the delivery address and add another item to my order.',
        timestamp: '2023-12-10T10:20:00Z',
        isRead: true,
        sentiment: 'neutral'
      },
      {
        id: '5',
        conversationId: '1',
        senderId: 'ai',
        senderName: 'Soleva AI Assistant',
        senderType: 'ai',
        message: 'I understand you need to modify your order. I\'m escalating this to our human support team who can assist you with order modifications. They\'ll be with you shortly!',
        timestamp: '2023-12-10T10:30:00Z',
        isRead: true,
        sentiment: 'positive'
      }
    ]
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      // In real implementation, use: const response = await chatAPI.getConversations();
      // For now, using mock data
      setTimeout(() => {
        setConversations(mockConversations);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch conversations');
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      // In real implementation: const response = await chatAPI.getMessages(conversationId);
      const conversationMessages = mockMessages[conversationId] || [];
      setMessages(conversationMessages);
    } catch (error) {
      message.error('Failed to fetch messages');
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation.id);
        }
      }, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedConversation, fetchConversations, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        senderId: 'admin',
        senderName: 'Admin User',
        senderType: 'agent',
        message: messageInput.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        sentiment: 'neutral'
      };

      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      
      // Update conversation status to active if it was pending
      if (selectedConversation.status === 'pending') {
        setSelectedConversation(prev => prev ? { ...prev, status: 'active' } : null);
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id ? { ...conv, status: 'active' } : conv
          )
        );
      }

      message.success('Message sent successfully');
    } catch (error) {
      message.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (conversationId: string, newStatus: string) => {
    try {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, status: newStatus as any } : conv
        )
      );
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      message.success('Status updated successfully');
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleEscalation = async (values: any) => {
    if (!selectedConversation) return;

    try {
      const updatedConversation = {
        ...selectedConversation,
        status: 'escalated' as const,
        escalationReason: values.reason,
        priority: 'urgent' as const
      };

      setSelectedConversation(updatedConversation);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id ? updatedConversation : conv
        )
      );

      setEscalationModalVisible(false);
      form.resetFields();
      message.success('Conversation escalated successfully');
    } catch (error) {
      message.error('Failed to escalate conversation');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <ExclamationCircleOutlined style={{ color: PRIORITY_COLORS.urgent }} />;
      case 'high': return <ThunderboltOutlined style={{ color: PRIORITY_COLORS.high }} />;
      default: return null;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai-chat': return <RobotOutlined />;
      case 'website': return <MessageOutlined />;
      case 'email': return <MessageOutlined />;
      case 'phone': return <PhoneOutlined />;
      default: return <MessageOutlined />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    const matchesSearch = searchQuery === '' || 
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const stats = {
    total: conversations.length,
    pending: conversations.filter(c => c.status === 'pending').length,
    active: conversations.filter(c => c.status === 'active').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
    aiHandled: conversations.filter(c => c.aiHandled).length,
    avgResponseTime: conversations.reduce((sum, c) => sum + (c.responseTime || 0), 0) / conversations.length || 0
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
          AI Chat Support
        </Title>
        <Space>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren="Auto Refresh"
            unCheckedChildren="Manual"
          />
          <Badge count={stats.pending} size="small">
            <Button icon={<BellOutlined />} className="btn-ghost">
              Notifications
            </Button>
          </Badge>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Total Chats"
              value={stats.total}
              prefix={<MessageOutlined style={{ color: 'var(--primary)' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: 'var(--warning)' }} />}
              valueStyle={{ color: 'var(--warning)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<TeamOutlined style={{ color: 'var(--info)' }} />}
              valueStyle={{ color: 'var(--info)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Resolved"
              value={stats.resolved}
              prefix={<CheckCircleOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--success)' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="AI Handled"
              value={stats.aiHandled}
              prefix={<RobotOutlined style={{ color: 'var(--primary)' }} />}
              suffix={`/${stats.total}`}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stats-card">
            <Statistic
              title="Avg Response"
              value={stats.avgResponseTime}
              precision={1}
              suffix="min"
              prefix={<ThunderboltOutlined style={{ color: 'var(--primary)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Layout className="chat-layout" style={{ background: 'transparent', minHeight: '70vh' }}>
        <Sider width={400} className="chat-sidebar" style={{ background: 'transparent' }}>
          <Card className="card-luxury h-full">
            <div className="mb-4">
              <Input
                placeholder="Search conversations..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
              />
              <Row gutter={8}>
                <Col span={12}>
                  <Select
                    placeholder="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Status</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="active">Active</Option>
                    <Option value="resolved">Resolved</Option>
                    <Option value="escalated">Escalated</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Select
                    placeholder="Priority"
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Priority</Option>
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="urgent">Urgent</Option>
                  </Select>
                </Col>
              </Row>
            </div>

            <div style={{ height: 'calc(70vh - 120px)', overflowY: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={filteredConversations}
                loading={loading}
                renderItem={item => (
                  <List.Item
                    className={`conversation-item ${selectedConversation?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(item)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '8px',
                      margin: '4px 0',
                      background: selectedConversation?.id === item.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                      border: selectedConversation?.id === item.id ? '1px solid var(--primary)' : '1px solid transparent'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge dot={item.status === 'pending'}>
                          <Avatar
                            src={item.customerAvatar}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                        </Badge>
                      }
                      title={
                        <div className="flex justify-between items-start">
                          <span className="text-white text-sm font-medium">{item.customerName}</span>
                          <div className="flex items-center space-x-1">
                            {getPriorityIcon(item.priority)}
                            <Tag color={STATUS_COLORS[item.status]} size="small">
                              {item.status}
                            </Tag>
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <div className="text-gray-300 text-xs mb-1">{item.subject}</div>
                          <div className="text-gray-400 text-xs truncate">{item.lastMessage}</div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center space-x-2">
                              {getSourceIcon(item.source)}
                              {item.aiHandled && <RobotOutlined style={{ color: 'var(--primary)' }} />}
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(item.lastMessageTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Sider>

        <Content className="chat-content ml-4">
          {selectedConversation ? (
            <Card className="card-luxury h-full">
              {/* Chat Header */}
              <div className="chat-header flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={selectedConversation.customerAvatar}
                    icon={<UserOutlined />}
                    size="large"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                  <div>
                    <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                      {selectedConversation.customerName}
                    </Title>
                    <Text type="secondary">{selectedConversation.subject}</Text>
                    <div className="flex items-center space-x-2 mt-1">
                      <Tag color={STATUS_COLORS[selectedConversation.status]} size="small">
                        {selectedConversation.status}
                      </Tag>
                      <Tag color={PRIORITY_COLORS[selectedConversation.priority]} size="small">
                        {selectedConversation.priority}
                      </Tag>
                      {selectedConversation.aiHandled && (
                        <Tooltip title="AI Assisted">
                          <RobotOutlined style={{ color: 'var(--primary)' }} />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
                <Space>
                  <Select
                    value={selectedConversation.status}
                    onChange={(value) => handleStatusChange(selectedConversation.id, value)}
                    style={{ width: 120 }}
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="active">Active</Option>
                    <Option value="resolved">Resolved</Option>
                    <Option value="escalated">Escalated</Option>
                  </Select>
                  <Button
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => setEscalationModalVisible(true)}
                    disabled={selectedConversation.status === 'escalated'}
                  >
                    Escalate
                  </Button>
                </Space>
              </div>

              {/* Messages */}
              <div 
                className="messages-container"
                style={{ 
                  height: 'calc(70vh - 200px)', 
                  overflowY: 'auto', 
                  marginBottom: '16px',
                  padding: '0 8px'
                }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.senderType === 'agent' ? 'message-agent' : message.senderType === 'ai' ? 'message-ai' : 'message-customer'} mb-4`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar
                        icon={
                          message.senderType === 'ai' ? <RobotOutlined /> :
                          message.senderType === 'agent' ? <TeamOutlined /> :
                          <UserOutlined />
                        }
                        size="small"
                        style={{
                          backgroundColor: 
                            message.senderType === 'ai' ? 'var(--primary)' :
                            message.senderType === 'agent' ? 'var(--success)' :
                            'var(--info)'
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div 
                          className={`message-bubble p-3 rounded-lg ${
                            message.senderType === 'agent' ? 'bg-green-600' :
                            message.senderType === 'ai' ? 'bg-blue-600' :
                            'bg-gray-600'
                          }`}
                        >
                          <Text style={{ color: 'white' }}>{message.message}</Text>
                        </div>
                        {message.sentiment && (
                          <div className="mt-1">
                            <Tag 
                              size="small" 
                              color={
                                message.sentiment === 'positive' ? 'green' :
                                message.sentiment === 'negative' ? 'red' : 'default'
                              }
                            >
                              {message.sentiment}
                            </Tag>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <div className="flex space-x-2">
                  <Input.TextArea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="btn-primary"
                  >
                    Send
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Press Ctrl+Enter to send
                </div>
              </div>
            </Card>
          ) : (
            <Card className="card-luxury h-full flex items-center justify-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Select a conversation to start chatting
                  </span>
                }
              />
            </Card>
          )}
        </Content>
      </Layout>

      {/* Escalation Modal */}
      <Modal
        title="Escalate Conversation"
        open={escalationModalVisible}
        onCancel={() => setEscalationModalVisible(false)}
        footer={null}
        className="modal-luxury"
      >
        <Form
          form={form}
          onFinish={handleEscalation}
          layout="vertical"
          className="form-luxury"
        >
          <Alert
            message="Escalation Notice"
            description="This conversation will be marked as urgent and escalated to senior support."
            type="warning"
            showIcon
            className="mb-4"
          />
          
          <Form.Item
            name="reason"
            label="Escalation Reason"
            rules={[{ required: true, message: 'Please provide escalation reason' }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe why this conversation needs escalation..."
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEscalationModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" danger>
              Escalate
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedChatSupport;
