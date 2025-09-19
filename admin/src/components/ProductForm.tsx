
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Divider,
  Alert,
  Progress,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  LinkOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

const { TextArea } = Input;
const { Option } = Select;

interface ProductVariant {
  id?: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

const COLORS = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Brown', value: 'brown', hex: '#8B4513' },
  { name: 'Tan', value: 'tan', hex: '#D2B48C' },
  { name: 'Red', value: 'red', hex: '#DC2626' },
  { name: 'Blue', value: 'blue', hex: '#2563EB' },
  { name: 'Green', value: 'green', hex: '#16A34A' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
  { name: 'Navy', value: 'navy', hex: '#1E293B' },
  { name: 'Burgundy', value: 'burgundy', hex: '#7C2D12' },
  { name: 'Color Full', value: 'color-full', hex: 'gradient' }
];

const SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const MATERIALS = [
  'Leather',
  'Synthetic Leather',
  'Canvas',
  'Suede',
  'Mesh',
  'Rubber',
  'Fabric',
  'Patent Leather',
  'Nubuck',
  'Cork'
];

const CATEGORIES = [
  'Casual Shoes',
  'Formal Shoes',
  'Sports Shoes',
  'Boots',
  'Sandals',
  'Sneakers',
  'Loafers',
  'High Heels',
  'Flats',
  'Slides'
];

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        basePrice: initialData.basePrice,
        category: initialData.category,
        material: initialData.material,
        isActive: initialData.isActive ?? true,
        isColorFull: initialData.isColorFull ?? false
      });
      setImages(initialData.images || []);
      setVariants(initialData.variants || []);
      setSelectedColors(initialData.colors || []);
      setSelectedSizes(initialData.sizes || []);
    }
  }, [initialData, form]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/v1/upload/product', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImages(prev => [...prev, result.data.url]);
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

  const handleUrlAdd = () => {
    if (urlInput.trim()) {
      setImages(prev => [...prev, urlInput.trim()]);
      setUrlInput('');
      message.success('Image URL added successfully');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateVariants = () => {
    const newVariants: ProductVariant[] = [];
    
    selectedColors.forEach(color => {
      selectedSizes.forEach(size => {
        const existingVariant = variants.find(v => v.color === color && v.size === size);
        if (existingVariant) {
          newVariants.push(existingVariant);
        } else {
          newVariants.push({
            color,
            size,
            sku: `${color.toUpperCase()}-${size}`,
            price: form.getFieldValue('basePrice') || 0,
            stockQuantity: 0,
            isActive: true
          });
        }
      });
    });
    
    setVariants(newVariants);
  };

  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      generateVariants();
    }
  }, [selectedColors, selectedSizes]);

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleSubmit = async (values: any) => {
    try {
      const productData = {
        ...values,
        images,
        variants,
        colors: selectedColors,
        sizes: selectedSizes,
        priceInEGP: values.basePrice, // Ensure price is stored in EGP
        currency: 'EGP'
      };

      await onSubmit(productData);
      
      if (!initialData) {
        form.resetFields();
        setImages([]);
        setVariants([]);
        setSelectedColors([]);
        setSelectedSizes([]);
      }
    } catch (error) {
      message.error('Failed to save product');
    }
  };

  const formatPrice = (price: number) => `EGP ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="product-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="form-luxury"
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Basic Information" className="card-luxury mb-6">
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <TextArea rows={4} placeholder="Enter product description" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="basePrice"
                    label="Base Price (EGP)"
                    rules={[{ required: true, message: 'Please enter price' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `EGP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value!.replace(/EGP\s?|(,*)/g, ''))}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select placeholder="Select category">
                      {CATEGORIES.map(category => (
                        <Option key={category} value={category}>{category}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="material"
                label="Material"
                rules={[{ required: true, message: 'Please select material' }]}
              >
                <Select placeholder="Select material">
                  {MATERIALS.map(material => (
                    <Option key={material} value={material}>{material}</Option>
                  ))}
                </Select>
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
                    name="isColorFull"
                    label="Color Full Mode"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="Multi-Color" 
                      unCheckedChildren="Single Color"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Product Images" className="card-luxury mb-6">
              <div className="mb-4">
                <Space>
                  <Button 
                    type={imageInputType === 'upload' ? 'primary' : 'default'}
                    onClick={() => setImageInputType('upload')}
                  >
                    <UploadOutlined /> Upload
                  </Button>
                  <Button 
                    type={imageInputType === 'url' ? 'primary' : 'default'}
                    onClick={() => setImageInputType('url')}
                  >
                    <LinkOutlined /> URL
                  </Button>
                </Space>
              </div>

              {imageInputType === 'upload' ? (
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                  className="image-upload-area"
                >
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <UploadOutlined style={{ fontSize: '24px', color: 'var(--primary)' }} />
                    <div style={{ marginTop: '8px' }}>
                      {uploading ? 'Uploading...' : 'Click or drag image to upload'}
                    </div>
                  </div>
                </Upload>
              ) : (
                <div className="url-input-area">
                  <Input
                    placeholder="Enter image URL"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onPressEnter={handleUrlAdd}
                    suffix={
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        onClick={handleUrlAdd}
                        disabled={!urlInput.trim()}
                      />
                    }
                  />
                </div>
              )}

              {uploading && (
                <Progress percent={75} showInfo={false} className="mt-2" />
              )}

              <div className="grid grid-cols-3 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white'
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Card title="Colors & Sizes" className="card-luxury mb-6">
          <Row gutter={24}>
            <Col span={12}>
              <h4 className="mb-3">Select Colors:</h4>
              <div className="variant-selector">
                {COLORS.map(color => (
                  <div
                    key={color.value}
                    className={`variant-chip ${selectedColors.includes(color.value) ? 'selected' : ''} ${
                      color.value === 'color-full' ? 'color-full' : ''
                    }`}
                    onClick={() => {
                      if (selectedColors.includes(color.value)) {
                        setSelectedColors(prev => prev.filter(c => c !== color.value));
                      } else {
                        setSelectedColors(prev => [...prev, color.value]);
                      }
                    }}
                  >
                    {color.value !== 'color-full' && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300 mx-auto mb-1"
                        style={{ 
                          backgroundColor: color.hex,
                          border: color.value === 'white' ? '1px solid #ccc' : 'none'
                        }}
                      />
                    )}
                    <span>{color.name}</span>
                  </div>
                ))}
              </div>
            </Col>

            <Col span={12}>
              <h4 className="mb-3">Select Sizes:</h4>
              <div className="variant-selector">
                {SIZES.map(size => (
                  <div
                    key={size}
                    className={`variant-chip ${selectedSizes.includes(size) ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedSizes.includes(size)) {
                        setSelectedSizes(prev => prev.filter(s => s !== size));
                      } else {
                        setSelectedSizes(prev => [...prev, size]);
                      }
                    }}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          {selectedColors.length > 0 && selectedSizes.length > 0 && (
            <Alert
              message={`${variants.length} variants will be generated`}
              description={`${selectedColors.length} colors × ${selectedSizes.length} sizes`}
              type="info"
              showIcon
              className="mt-4"
            />
          )}
        </Card>

        {variants.length > 0 && (
          <Card title="Product Variants" className="card-luxury mb-6">
            <div className="max-h-96 overflow-y-auto">
              {variants.map((variant, index) => (
                <div key={`${variant.color}-${variant.size}`} className="variant-row p-4 border-b border-gray-200">
                  <Row gutter={16} align="middle">
                    <Col span={3}>
                      <div className="text-center">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300 mx-auto mb-1"
                          style={{
                            backgroundColor: COLORS.find(c => c.value === variant.color)?.hex,
                            background: variant.color === 'color-full' 
                              ? 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)'
                              : undefined
                          }}
                        />
                        <span className="text-sm">{variant.color}</span>
                      </div>
                    </Col>
                    <Col span={2}>
                      <div className="text-center">
                        <div className="font-semibold">{variant.size}</div>
                      </div>
                    </Col>
                    <Col span={4}>
                      <Input
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      />
                    </Col>
                    <Col span={4}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        placeholder="Price (EGP)"
                        value={variant.price}
                        onChange={(value) => updateVariant(index, 'price', value || 0)}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>
                    <Col span={4}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="Stock"
                        value={variant.stockQuantity}
                        onChange={(value) => updateVariant(index, 'stockQuantity', value || 0)}
                      />
                    </Col>
                    <Col span={3}>
                      <Switch
                        checked={variant.isActive}
                        onChange={(checked) => updateVariant(index, 'isActive', checked)}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                      />
                    </Col>
                    <Col span={4}>
                      <div className="text-right">
                        <span className="currency-egp text-lg font-semibold">
                          {formatPrice(variant.price)}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Divider />

        <div className="text-right">
          <Space>
            <Button size="large">
              Cancel
            </Button>
            <Button 
              type="primary" 
              size="large" 
              htmlType="submit" 
              loading={loading}
              className="btn-primary"
            >
              {initialData ? 'Update Product' : 'Create Product'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default ProductForm;
