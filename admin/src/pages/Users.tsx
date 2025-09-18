import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Switch } from
'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  LockOutlined } from
'@ant-design/icons';
import { usersAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  isActive: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const roles = [
  { value: 'OWNER', label: 'Owner', color: 'red' },
  { value: 'ADMIN', label: 'Admin', color: 'blue' },
  { value: 'MANAGER', label: 'Manager', color: 'green' },
  { value: 'CONTENT', label: 'Content Manager', color: 'orange' },
  { value: 'SUPPORT', label: 'Support', color: 'purple' }];


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({
        search: searchText,
        role: filterRole
      });

      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await usersAPI.delete(id);
      if (response.success) {
        message.success('User deleted successfully');
        fetchUsers();
      } else {
        message.error('Failed to delete user');
      }
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSubmit = async (values: UserFormData) => {
    try {
      let response;
      if (editingUser) {
        response = await usersAPI.update(editingUser.id, values);
      } else {
        response = await usersAPI.create(values);
      }

      if (response.success) {
        message.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchUsers();
      } else {
        message.error(`Failed to ${editingUser ? 'update' : 'create'} user`);
      }
    } catch (error) {
      message.error(`Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return roleConfig?.color || 'default';
  };

  const columns: ColumnsType<AdminUser> = [
  {
    title: 'User',
    key: 'user',
    render: (_, record) =>
    <div className="flex items-center space-x-3">
          <Avatar
        size={40}
        src={record.avatar}
        icon={<UserOutlined />} />

          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>,

    filteredValue: searchText ? [searchText] : null,
    onFilter: (value, record) =>
    record.name.toLowerCase().includes(value.toString().toLowerCase()) ||
    record.email.toLowerCase().includes(value.toString().toLowerCase())
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    render: (role: string) => {
      const roleConfig = roles.find((r) => r.value === role);
      return (
        <Tag color={getRoleColor(role)}>
            {roleConfig?.label || role}
          </Tag>);

    },
    filters: roles.map((role) => ({ text: role.label, value: role.value })),
    onFilter: (value, record) => record.role === value
  },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    render: (isActive: boolean) =>
    <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>,

    filters: [
    { text: 'Active', value: true },
    { text: 'Inactive', value: false }],

    onFilter: (value, record) => record.isActive === value
  },
  {
    title: '2FA',
    dataIndex: 'twoFactorEnabled',
    key: 'twoFactorEnabled',
    render: (enabled: boolean) =>
    <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>

  },
  {
    title: 'Last Login',
    dataIndex: 'lastLoginAt',
    key: 'lastLoginAt',
    render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    sorter: (a, b) => {
      if (!a.lastLoginAt && !b.lastLoginAt) return 0;
      if (!a.lastLoginAt) return 1;
      if (!b.lastLoginAt) return -1;
      return new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime();
    }
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 150,
    render: (_, record) =>
    <Space>
          <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => handleEdit(record)} />

          <Popconfirm
        title="Are you sure you want to delete this user?"
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
        <Title level={2} style={{ margin: 0 }}>Admin Users Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}>

          Add User
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchUsers} />

            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by role"
                style={{ width: '100%' }}
                value={filterRole}
                onChange={setFilterRole}
                allowClear>

                {roles.map((role) =>
                <Option key={role.value} value={role.value}>{role.label}</Option>
                )}
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
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchUsers}
                style={{ width: '100%' }}>

                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} users`
          }}
          scroll={{ x: 1000 }} />

      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}>

            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter valid email' }]
            }>

            <Input placeholder="Enter email" />
          </Form.Item>

          {!editingUser &&
          <Form.Item
            name="password"
            label="Password"
            rules={[
            { required: true, message: 'Please enter password' },
            { min: 8, message: 'Password must be at least 8 characters' }]
            }>

              <Input.Password placeholder="Enter password" />
            </Form.Item>
          }

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}>

            <Select placeholder="Select role">
              {roles.map((role) =>
              <Option key={role.value} value={role.value}>
                  <Tag color={role.color} style={{ marginRight: 8 }}>
                    {role.label}
                  </Tag>
                </Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked">

            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);

};

export default Users;