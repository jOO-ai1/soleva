import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
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
  Tabs } from
'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined } from
'@ant-design/icons';
import { productsAPI } from '../services/api';
import ProductForm from '../components/ProductForm';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  brand: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  brand: string;
  isActive: boolean;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const categories = ['Sneakers', 'Boots', 'Sandals', 'Dress Shoes', 'Casual Shoes'];
  const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Converse', 'Vans'];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({
        search: searchText,
        category: filterCategory,
        brand: filterBrand
      });

      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [searchText, filterCategory, filterBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAdd = () => {
    setEditingProduct(null);
    setUploadedImages([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setUploadedImages(product.images || []);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      category: product.category,
      brand: product.brand,
      isActive: product.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await productsAPI.delete(id);
      if (response.success) {
        message.success('Product deleted successfully');
        fetchProducts();
      } else {
        message.error('Failed to delete product');
      }
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleSubmit = async (values: ProductFormData) => {
    try {
      const productData = {
        ...values,
        images: uploadedImages
      };

      let response;
      if (editingProduct) {
        response = await productsAPI.update(editingProduct.id, productData);
      } else {
        response = await productsAPI.create({ ...productData, variants: [] });
      }

      if (response.success) {
        message.success(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchProducts();
      } else {
        message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
    } catch (error) {
      message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await productsAPI.uploadImage(file);
      if (response.success && response.data) {
        setUploadedImages((prev) => [...prev, (response.data as any).url]);
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

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const columns: ColumnsType<Product> = [
  {
    title: 'Image',
    dataIndex: 'images',
    key: 'images',
    width: 80,
    render: (images: string[]) =>
    <Image
      width={50}
      height={50}
      src={images?.[0] || '/placeholder-image.jpg'}
      style={{ objectFit: 'cover', borderRadius: 4 }} />


  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filteredValue: searchText ? [searchText] : null,
    onFilter: (value, record) =>
    record.name.toLowerCase().includes(value.toString().toLowerCase())
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    filters: categories.map((cat) => ({ text: cat, value: cat })),
    onFilter: (value, record) => record.category === value
  },
  {
    title: 'Brand',
    dataIndex: 'brand',
    key: 'brand',
    filters: brands.map((brand) => ({ text: brand, value: brand })),
    onFilter: (value, record) => record.brand === value
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (price: number) =>
    <span className="currency-egp">
        {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>,

    sorter: (a, b) => a.price - b.price
  },
  {
    title: 'Stock',
    dataIndex: 'stockQuantity',
    key: 'stockQuantity',
    render: (stock: number) =>
    <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>,

    sorter: (a, b) => a.stockQuantity - b.stockQuantity
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
    title: 'Actions',
    key: 'actions',
    width: 150,
    render: (_, record) =>
    <Space>
          <Button
        type="text"
        icon={<EyeOutlined />}
        onClick={() => handleEdit(record)} />

          <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => handleEdit(record)} />

          <Popconfirm
        title="Are you sure you want to delete this product?"
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
        <Title level={2} style={{ margin: 0 }}>Products Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}>

          Add Product
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchProducts} />

            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by category"
                style={{ width: '100%' }}
                value={filterCategory}
                onChange={setFilterCategory}
                allowClear>

                {categories.map((cat) =>
                <Option key={cat} value={cat}>{cat}</Option>
                )}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by brand"
                style={{ width: '100%' }}
                value={filterBrand}
                onChange={setFilterBrand}
                allowClear>

                {brands.map((brand) =>
                <Option key={brand} value={brand}>{brand}</Option>
                )}
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchProducts}
                style={{ width: '100%' }}>

                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} products`
          }}
          scroll={{ x: 1000 }} />

      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1200}
        className="modal-luxury">

        <ProductForm
          initialData={editingProduct}
          onSubmit={async (data) => {
            try {
              let response;
              if (editingProduct) {
                response = await productsAPI.update(editingProduct.id, data);
              } else {
                response = await productsAPI.create(data);
              }

              if (response.success) {
                message.success(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
                setModalVisible(false);
                fetchProducts();
              } else {
                throw new Error('API request failed');
              }
            } catch (error) {
              message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
              throw error;
            }
          }}
          loading={false} />

      </Modal>
    </div>);

};

export default Products;