import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
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
  Select,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { categoriesAPI } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Category } from '../types/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Using Category type from API types

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterParent, setFilterParent] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      
      if (response.success && response.data) {
        setCategories(response.data as Category[]);
      }
    } catch {
      message.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setUploadedImage('');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setUploadedImage(category.image || '');
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      slug: category.slug,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await categoriesAPI.delete(id);
      if (response.success) {
        message.success('Category deleted successfully');
        fetchCategories();
      } else {
        message.error('Failed to delete category');
      }
    } catch {
      message.error('Failed to delete category');
    }
  };

  const handleSubmit = async (values: CategoryFormData) => {
    try {
      const categoryData = {
        ...values,
        image: uploadedImage,
      };

      let response;
      if (editingCategory) {
        response = await categoriesAPI.update(editingCategory.id, categoryData);
      } else {
        response = await categoriesAPI.create(categoryData);
      }

      if (response.success) {
        message.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchCategories();
      } else {
        message.error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
      }
    } catch {
      message.error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await categoriesAPI.uploadImage(file);
      if (response.success && response.data) {
        setUploadedImage((response.data as { url: string }).url);
        message.success('Image uploaded successfully');
      } else {
        message.error('Failed to upload image');
      }
    } catch {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleReorder = async (dragIndex: number, hoverIndex: number) => {
    const newCategories = [...categories];
    const draggedCategory = newCategories[dragIndex];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, draggedCategory);

    // Update sortOrder for all affected categories
    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      sortOrder: index
    }));

    try {
      const response = await categoriesAPI.reorder(updates);
      if (response.success) {
        setCategories(newCategories);
        message.success('Categories reordered successfully');
      } else {
        message.error('Failed to reorder categories');
      }
    } catch {
      message.error('Failed to reorder categories');
    }
  };

  const moveUp = async (index: number) => {
    if (index > 0) {
      await handleReorder(index, index - 1);
    }
  };

  const moveDown = async (index: number) => {
    if (index < categories.length - 1) {
      await handleReorder(index, index + 1);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchText || 
      category.name.toLowerCase().includes(searchText.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesParent = !filterParent || 
      (filterParent === 'root' ? !category.parentId : category.parentId === filterParent);
    
    return matchesSearch && matchesParent;
  });

  const columns: ColumnsType<Category> = [
    {
      title: 'Order',
      key: 'order',
      width: 80,
      render: (_, record, index) => (
        <Space>
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            size="small"
            disabled={index === 0}
            onClick={() => moveUp(index)}
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            size="small"
            disabled={index === filteredCategories.length - 1}
            onClick={() => moveDown(index)}
          />
        </Space>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
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
      title: 'Parent',
      dataIndex: 'parentName',
      key: 'parentName',
      render: (parentName: string) => parentName || <Tag color="blue">Root</Tag>,
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>
      ),
      sorter: (a, b) => a.productsCount - b.productsCount,
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
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
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
            title="Are you sure you want to delete this category?"
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

  const parentCategories = categories.filter(cat => !cat.parentId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>Categories Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Category
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Search categories..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by parent"
                style={{ width: '100%' }}
                value={filterParent}
                onChange={setFilterParent}
                allowClear
              >
                <Option value="root">Root Categories</Option>
                {parentCategories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchCategories}
                style={{ width: '100%' }}
              >
                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} categories`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
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
                name="name"
                label="Category Name"
                rules={[{ required: true, message: 'Please enter category name' }]}
              >
                <Input placeholder="Enter category name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[{ required: true, message: 'Please enter slug' }]}
              >
                <Input placeholder="category-slug" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter category description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="parentId"
                label="Parent Category"
              >
                <Select placeholder="Select parent category" allowClear>
                  {parentCategories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="Sort Order"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="image"
            label="Category Image"
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
                  Upload Image
                </Button>
              </Upload>
            </div>

            {uploadedImage && (
              <div className="relative inline-block">
                <Image
                  width={150}
                  height={150}
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
            <Col span={12}>
              <Form.Item
                name="metaTitle"
                label="Meta Title"
              >
                <Input placeholder="SEO meta title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="metaDescription"
            label="Meta Description"
          >
            <TextArea rows={2} placeholder="SEO meta description" />
          </Form.Item>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
