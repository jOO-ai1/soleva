
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
  Statistic,
  Progress,
  Timeline } from
'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BankOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined } from
'@ant-design/icons';
import { suppliersAPI } from '../services/api'; // We'll use this for now, should be investorsAPI
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface Investor {
  id: string;
  name: string;
  type: 'individual' | 'corporate' | 'fund';
  email: string;
  phone: string;
  address: string;
  country: string;
  website?: string;
  contactPerson: string;
  investmentAmount: number;
  investmentDate: string;
  equityPercentage: number;
  status: 'active' | 'pending' | 'exited';
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  sector: string;
  notes?: string;
  expectedReturn: number;
  investmentTerm: number; // in months
  lastInteraction?: string;
  documentStatus: 'pending' | 'completed' | 'review';
  createdAt: string;
  updatedAt: string;
}

const INVESTOR_TYPES = [
{ value: 'individual', label: 'Individual Investor' },
{ value: 'corporate', label: 'Corporate Investor' },
{ value: 'fund', label: 'Investment Fund' }];


const RISK_PROFILES = [
{ value: 'conservative', label: 'Conservative', color: '#52C41A' },
{ value: 'moderate', label: 'Moderate', color: '#1890FF' },
{ value: 'aggressive', label: 'Aggressive', color: '#FF4D4F' }];


const SECTORS = [
'Technology',
'Fashion & Retail',
'E-commerce',
'Manufacturing',
'Real Estate',
'Healthcare',
'Finance',
'Energy',
'Consumer Goods',
'Services'];


const COUNTRIES = [
'Egypt', 'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman', 'Bahrain',
'United States', 'United Kingdom', 'Germany', 'France', 'Singapore',
'Hong Kong', 'Switzerland', 'Netherlands', 'Canada'];


const Investors: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [form] = Form.useForm();

  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for demo - in real app, use investorsAPI.getAll()
      const mockInvestors: Investor[] = [
      {
        id: '1',
        name: 'Ahmed Al-Rashid',
        type: 'individual',
        email: 'ahmed@example.com',
        phone: '+971501234567',
        address: 'Dubai Marina, Dubai',
        country: 'UAE',
        contactPerson: 'Ahmed Al-Rashid',
        investmentAmount: 500000,
        investmentDate: '2023-06-15',
        equityPercentage: 12.5,
        status: 'active',
        riskProfile: 'moderate',
        sector: 'Fashion & Retail',
        expectedReturn: 25,
        investmentTerm: 36,
        documentStatus: 'completed',
        createdAt: '2023-06-01',
        updatedAt: '2023-06-15'
      },
      {
        id: '2',
        name: 'Nile Capital Partners',
        type: 'fund',
        email: 'info@nilecapital.com',
        phone: '+20223456789',
        address: 'New Capital, Cairo',
        country: 'Egypt',
        contactPerson: 'Sarah Mohamed',
        investmentAmount: 2000000,
        investmentDate: '2023-03-20',
        equityPercentage: 35,
        status: 'active',
        riskProfile: 'aggressive',
        sector: 'E-commerce',
        expectedReturn: 30,
        investmentTerm: 60,
        documentStatus: 'completed',
        createdAt: '2023-03-01',
        updatedAt: '2023-03-20'
      }];

      setInvestors(mockInvestors);
    } catch (error) {
      message.error('Failed to fetch investors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleAdd = () => {
    setEditingInvestor(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'pending',
      type: 'individual',
      riskProfile: 'moderate',
      expectedReturn: 20,
      investmentTerm: 36,
      documentStatus: 'pending'
    });
    setModalVisible(true);
  };

  const handleEdit = (investor: Investor) => {
    setEditingInvestor(investor);
    form.setFieldsValue({
      ...investor,
      investmentDate: dayjs(investor.investmentDate)
    });
    setModalVisible(true);
  };

  const handleView = (investor: Investor) => {
    setSelectedInvestor(investor);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      message.success('Investor deleted successfully');
      fetchInvestors();
    } catch (error) {
      message.error('Failed to delete investor');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const investorData = {
        ...values,
        investmentDate: values.investmentDate.format('YYYY-MM-DD')
      };

      message.success(`Investor ${editingInvestor ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchInvestors();
    } catch (error) {
      message.error(`Failed to ${editingInvestor ? 'update' : 'create'} investor`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':return 'green';
      case 'pending':return 'orange';
      case 'exited':return 'red';
      default:return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual':return <UserOutlined />;
      case 'corporate':return <BankOutlined />;
      case 'fund':return <TrophyOutlined />;
      default:return <UserOutlined />;
    }
  };

  const getRiskColor = (risk: string) => {
    const profile = RISK_PROFILES.find((p) => p.value === risk);
    return profile?.color || '#1890FF';
  };

  const columns: ColumnsType<Investor> = [
  {
    title: 'Investor',
    key: 'investor',
    render: (_, record) =>
    <Space>
          <Avatar
        icon={getTypeIcon(record.type)}
        style={{ backgroundColor: 'var(--primary)' }} />

          <div>
            <div className="font-semibold text-white">{record.name}</div>
            <Text type="secondary">{record.type}</Text>
          </div>
        </Space>

  },
  {
    title: 'Investment',
    key: 'investment',
    render: (_, record) =>
    <div>
          <div className="currency-egp text-lg font-semibold">
            {record.investmentAmount.toLocaleString()}
          </div>
          <Text type="secondary" className="text-xs">
            {record.equityPercentage}% equity
          </Text>
        </div>

  },
  {
    title: 'Terms',
    key: 'terms',
    render: (_, record) =>
    <div>
          <div className="text-white">{record.expectedReturn}% return</div>
          <Text type="secondary" className="text-xs">
            {record.investmentTerm} months term
          </Text>
        </div>

  },
  {
    title: 'Risk Profile',
    key: 'risk',
    render: (_, record) =>
    <Tag color={getRiskColor(record.riskProfile)} className="tag-luxury">
          {record.riskProfile.toUpperCase()}
        </Tag>

  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) =>
    <div>
          <Tag color={getStatusColor(record.status)} className="tag-luxury mb-1">
            {record.status.toUpperCase()}
          </Tag>
          <br />
          <Tag color={record.documentStatus === 'completed' ? 'green' : 'orange'} size="small">
            Docs: {record.documentStatus}
          </Tag>
        </div>

  },
  {
    title: 'Contact',
    key: 'contact',
    render: (_, record) =>
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
        onClick={() => handleView(record)}
        className="btn-ghost" />

          <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => handleEdit(record)}
        className="btn-ghost" />

          <Popconfirm
        title="Are you sure you want to delete this investor?"
        onConfirm={() => handleDelete(record.id)}
        okText="Yes"
        cancelText="No">

            <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          className="btn-ghost" />

          </Popconfirm>
        </Space>

  }];


  const totalInvestors = investors.length;
  const activeInvestors = investors.filter((i) => i.status === 'active').length;
  const totalInvestment = investors.reduce((sum, i) => sum + i.investmentAmount, 0);
  const avgEquity = investors.reduce((sum, i) => sum + i.equityPercentage, 0) / investors.length || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
          Investors Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="btn-primary">

          Add Investor
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Investors"
              value={totalInvestors}
              prefix={<UserOutlined style={{ color: 'var(--primary)' }} />} />

          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Active Investors"
              value={activeInvestors}
              prefix={<CheckCircleOutlined style={{ color: 'var(--success)' }} />} />

          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Investment"
              value={totalInvestment}
              precision={0}
              prefix="EGP"
              valueStyle={{ color: 'var(--primary)' }} />

          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Avg Equity"
              value={avgEquity}
              precision={1}
              suffix="%"
              valueStyle={{ color: 'var(--warning)' }} />

          </Card>
        </Col>
      </Row>

      <Card className="card-luxury">
        <Table
          columns={columns}
          dataSource={investors}
          rowKey="id"
          loading={loading}
          className="table-luxury"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} investors`
          }}
          scroll={{ x: 1200 }} />

      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingInvestor ? 'Edit Investor' : 'Add New Investor'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        className="modal-luxury">

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="form-luxury">

          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Information" key="basic">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Investor Name"
                    rules={[{ required: true, message: 'Please enter investor name' }]}>

                    <Input placeholder="Enter investor name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Investor Type"
                    rules={[{ required: true, message: 'Please select type' }]}>

                    <Select placeholder="Select investor type">
                      {INVESTOR_TYPES.map((type) =>
                      <Option key={type.value} value={type.value}>{type.label}</Option>
                      )}
                    </Select>
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
                    { type: 'email', message: 'Please enter valid email' }]
                    }>

                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true, message: 'Please enter phone' }]}>

                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}>

                <TextArea rows={3} placeholder="Enter full address" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="country"
                    label="Country"
                    rules={[{ required: true, message: 'Please select country' }]}>

                    <Select placeholder="Select country">
                      {COUNTRIES.map((country) =>
                      <Option key={country} value={country}>{country}</Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactPerson"
                    label="Contact Person"
                    rules={[{ required: true, message: 'Please enter contact person' }]}>

                    <Input placeholder="Enter contact person name" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="website"
                label="Website">

                <Input placeholder="Enter website URL" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Investment Details" key="investment">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="investmentAmount"
                    label="Investment Amount (EGP)"
                    rules={[{ required: true, message: 'Please enter investment amount' }]}>

                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      formatter={(value) => `EGP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => parseInt(value!.replace(/EGP\s?|(,*)/g, ''))}
                      placeholder="Enter investment amount" />

                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="investmentDate"
                    label="Investment Date"
                    rules={[{ required: true, message: 'Please select investment date' }]}>

                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="equityPercentage"
                    label="Equity Percentage"
                    rules={[{ required: true, message: 'Please enter equity percentage' }]}>

                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="Enter equity percentage"
                      suffix="%" />

                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="expectedReturn"
                    label="Expected Return (%)"
                    rules={[{ required: true, message: 'Please enter expected return' }]}>

                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      step={1}
                      placeholder="Enter expected return"
                      suffix="%" />

                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="investmentTerm"
                    label="Investment Term (Months)"
                    rules={[{ required: true, message: 'Please enter investment term' }]}>

                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={240}
                      placeholder="Enter investment term" />

                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="riskProfile"
                    label="Risk Profile"
                    rules={[{ required: true, message: 'Please select risk profile' }]}>

                    <Select placeholder="Select risk profile">
                      {RISK_PROFILES.map((profile) =>
                      <Option key={profile.value} value={profile.value}>
                          {profile.label}
                        </Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sector"
                    label="Sector Interest"
                    rules={[{ required: true, message: 'Please select sector' }]}>

                    <Select placeholder="Select sector">
                      {SECTORS.map((sector) =>
                      <Option key={sector} value={sector}>{sector}</Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Please select status' }]}>

                    <Select placeholder="Select status">
                      <Option value="active">Active</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="exited">Exited</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="documentStatus"
                label="Document Status"
                rules={[{ required: true, message: 'Please select document status' }]}>

                <Select placeholder="Select document status">
                  <Option value="pending">Pending</Option>
                  <Option value="review">Under Review</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notes">

                <TextArea rows={4} placeholder="Enter additional notes" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <div className="flex justify-end mt-6 space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="btn-primary">
              {editingInvestor ? 'Update Investor' : 'Create Investor'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Investor Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        className="modal-luxury">

        {selectedInvestor &&
        <div>
            <Row gutter={24}>
              <Col span={8}>
                <div className="text-center mb-6">
                  <Avatar
                  size={80}
                  icon={getTypeIcon(selectedInvestor.type)}
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }} />

                  <Title level={4} className="mt-2" style={{ color: 'var(--text-primary)' }}>
                    {selectedInvestor.name}
                  </Title>
                  <Tag color={getStatusColor(selectedInvestor.status)} className="tag-luxury mb-2">
                    {selectedInvestor.status.toUpperCase()}
                  </Tag>
                  <br />
                  <Tag color={getRiskColor(selectedInvestor.riskProfile)} className="tag-luxury">
                    {selectedInvestor.riskProfile.toUpperCase()} RISK
                  </Tag>
                </div>
              </Col>
              <Col span={16}>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investment Amount:</span>
                    <span className="currency-egp text-lg font-semibold">
                      {selectedInvestor.investmentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Equity Percentage:</span>
                    <span className="text-white font-semibold">{selectedInvestor.equityPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Return:</span>
                    <span className="text-green-400 font-semibold">{selectedInvestor.expectedReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investment Term:</span>
                    <span className="text-white">{selectedInvestor.investmentTerm} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investment Date:</span>
                    <span className="text-white">{dayjs(selectedInvestor.investmentDate).format('MMM DD, YYYY')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sector Interest:</span>
                    <span className="text-white">{selectedInvestor.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{selectedInvestor.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Documents:</span>
                    <Tag color={selectedInvestor.documentStatus === 'completed' ? 'green' : 'orange'}>
                      {selectedInvestor.documentStatus.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="mt-6 pt-4 border-t border-gray-600">
              <Title level={5} style={{ color: 'var(--text-primary)' }}>Investment Progress</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <div className="text-center">
                    <Progress
                    type="circle"
                    percent={Math.round(selectedInvestor.equityPercentage / 50 * 100)}
                    format={() => `${selectedInvestor.equityPercentage}%`}
                    strokeColor="var(--primary)" />

                    <div className="mt-2 text-gray-400 text-sm">Equity Share</div>
                  </div>
                </Col>
                <Col span={16}>
                  <Timeline>
                    <Timeline.Item
                    color="green"
                    dot={<CheckCircleOutlined />}>

                      <div className="text-white">Investment Committed</div>
                      <div className="text-gray-400 text-sm">
                        {dayjs(selectedInvestor.investmentDate).format('MMM DD, YYYY')}
                      </div>
                    </Timeline.Item>
                    <Timeline.Item
                    color={selectedInvestor.documentStatus === 'completed' ? 'green' : 'orange'}
                    dot={selectedInvestor.documentStatus === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>

                      <div className="text-white">Documentation</div>
                      <div className="text-gray-400 text-sm">
                        Status: {selectedInvestor.documentStatus}
                      </div>
                    </Timeline.Item>
                    <Timeline.Item
                    color={selectedInvestor.status === 'active' ? 'green' : 'orange'}
                    dot={selectedInvestor.status === 'active' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>

                      <div className="text-white">Active Investment</div>
                      <div className="text-gray-400 text-sm">
                        Current status: {selectedInvestor.status}
                      </div>
                    </Timeline.Item>
                  </Timeline>
                </Col>
              </Row>
            </div>

            {selectedInvestor.notes &&
          <div className="mt-6 pt-4 border-t border-gray-600">
                <Title level={5} style={{ color: 'var(--text-primary)' }}>Notes:</Title>
                <p className="text-gray-300">{selectedInvestor.notes}</p>
              </div>
          }
          </div>
        }
      </Modal>
    </div>);

};

export default Investors;