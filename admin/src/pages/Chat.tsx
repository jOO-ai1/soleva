import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Badge,
  Modal,
  Form,
  message } from
'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  SearchOutlined,
  FilterOutlined,
  MessageOutlined,
  ClockCircleOutlined } from
'@ant-design/icons';
import { chatAPI } from '../services/api';
import type { Conversation } from '../types/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Using Conversation and Message types from API types

const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations({
        status: filterStatus
      });

      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch {
      message.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation]);

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const response = await chatAPI.getConversation(conversationId);
      if (response.success && response.data) {
        setSelectedConversation(response.data as Conversation);
      }
    } catch {
      message.error('Failed to fetch conversation details');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await chatAPI.sendMessage(selectedConversation.id, newMessage);
      if (response.success) {
        setNewMessage('');
        // Refresh conversation
        handleSelectConversation(selectedConversation.id);
        fetchConversations();
      } else {
        message.error('Failed to send message');
      }
    } catch {
      message.error('Failed to send message');
    }
  };

  const handleUpdateStatus = async (conversationId: string, status: string) => {
    try {
      const response = await chatAPI.updateStatus(conversationId, status);
      if (response.success) {
        message.success('Status updated successfully');
        fetchConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation((prev) => prev ? { ...prev, status: status as 'active' | 'resolved' | 'pending' } : null);
        }
      } else {
        message.error('Failed to update status');
      }
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleAIAssist = async () => {
    if (!aiPrompt.trim()) return;

    try {
      // This would integrate with your AI service
      // For now, we'll simulate an AI response
      const aiResponse = `AI Assistant: Based on your query "${aiPrompt}", here's what I recommend...`;

      if (selectedConversation) {
        await chatAPI.sendMessage(selectedConversation.id, aiResponse);
        handleSelectConversation(selectedConversation.id);
        fetchConversations();
      }

      setAiModalVisible(false);
      setAiPrompt('');
      message.success('AI response sent successfully');
    } catch {
      message.error('Failed to send AI response');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: {[key: string]: string;} = {
      active: 'green',
      pending: 'orange',
      resolved: 'blue'
    };
    return colors[status] || 'default';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>AI Chat Support</Title>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={() => setAiModalVisible(true)}>

          AI Assistant
        </Button>
      </div>

      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversations List */}
        <Col span={8}>
          <Card
            title="Conversations"
            extra={
            <Space>
                <Input
                placeholder="Search conversations..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small" />

                <Select
                placeholder="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                size="small"
                style={{ width: 100 }}>

                  <Option value="">All</Option>
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="resolved">Resolved</Option>
                </Select>
                <Button
                icon={<FilterOutlined />}
                onClick={fetchConversations}
                size="small" />

              </Space>
            }
            style={{ height: '100%' }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' }}>

            <List
              dataSource={conversations.filter((conv) =>
              conv.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
              conv.customerEmail.toLowerCase().includes(searchText.toLowerCase())
              )}
              loading={loading}
              renderItem={(conversation) =>
              <List.Item
                onClick={() => handleSelectConversation(conversation.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conversation.id ? '#f0f0f0' : 'transparent',
                  padding: '12px 16px'
                }}>

                  <List.Item.Meta
                  avatar={
                  <Badge count={conversation.unreadCount} size="small">
                        <Avatar icon={<UserOutlined />} />
                      </Badge>
                  }
                  title={
                  <div className="flex justify-between items-center">
                        <span>{conversation.customerName}</span>
                        <Tag color={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Tag>
                      </div>
                  }
                  description={
                  <div>
                        <div className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </div>
                        <div className="text-xs text-gray-400">
                          <ClockCircleOutlined /> {formatTime(conversation.lastMessageTime)}
                        </div>
                      </div>
                  } />

                </List.Item>
              } />

          </Card>
        </Col>

        {/* Chat Area */}
        <Col span={16}>
          {selectedConversation ?
          <Card
            title={
            <div className="flex justify-between items-center">
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedConversation.customerName}
                    </Title>
                    <Text type="secondary">{selectedConversation.customerEmail}</Text>
                  </div>
                  <Space>
                    <Select
                  value={selectedConversation.status}
                  onChange={(value) => handleUpdateStatus(selectedConversation.id, value)}
                  size="small">

                      <Option value="active">Active</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="resolved">Resolved</Option>
                    </Select>
                  </Space>
                </div>
            }
            style={{ height: '100%' }}
            bodyStyle={{
              padding: 0,
              height: 'calc(100% - 57px)',
              display: 'flex',
              flexDirection: 'column'
            }}>

              {/* Messages */}
              <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              maxHeight: 'calc(100% - 80px)'
            }}>
                {selectedConversation.messages.map((message) =>
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'admin' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px'
                }}>

                    <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: message.sender === 'admin' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>

                      <Avatar
                    icon={message.sender === 'admin' ? <UserOutlined /> : <RobotOutlined />}
                    size="small" />

                      <div
                    style={{
                      backgroundColor: message.sender === 'admin' ? '#1890ff' : '#f0f0f0',
                      color: message.sender === 'admin' ? 'white' : 'black',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '14px'
                    }}>

                        {message.content}
                      </div>
                    </div>
                  </div>
              )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }} />

                  <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}>

                    Send
                  </Button>
                </Space.Compact>
              </div>
            </Card> :

          <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="text-center">
                <MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} type="secondary">Select a conversation to start chatting</Title>
                <Text type="secondary">Choose a conversation from the list to view messages and respond to customers.</Text>
              </div>
            </Card>
          }
        </Col>
      </Row>

      {/* AI Assistant Modal */}
      <Modal
        title="AI Assistant"
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        footer={null}>

        <Form layout="vertical">
          <Form.Item label="AI Prompt">
            <TextArea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={4} />

          </Form.Item>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setAiModalVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleAIAssist}
              disabled={!aiPrompt.trim() || !selectedConversation}>

              Send AI Response
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);

};

export default Chat;