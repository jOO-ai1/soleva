import { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, FiMapPin, FiCalendar, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { useAuthSafe } from '../contexts/AuthContext';
import { ordersApi } from '../services/api';
import GlassCard from '../components/GlassCard';
import { useParams, Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
    description?: string;
  };
  variant: {
    color: string;
    size: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shippingStatus: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  customerNotes?: string;
  items: OrderItem[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  timeline: Array<{
    id: string;
    status: string;
    description: {
      en: string;
      ar: string;
    };
    timestamp: string;
  }>;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return <FiCheckCircle className="text-green-500" />;
    case 'shipped':
    case 'out_for_delivery':
      return <FiTruck className="text-blue-500" />;
    case 'processing':
    case 'confirmed':
      return <FiPackage className="text-yellow-500" />;
    case 'cancelled':
    case 'returned':
      return <FiXCircle className="text-red-500" />;
    default:
      return <FiClock className="text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'text-green-600 bg-green-100';
    case 'shipped':
    case 'out_for_delivery':
      return 'text-blue-600 bg-blue-100';
    case 'processing':
    case 'confirmed':
      return 'text-yellow-600 bg-yellow-100';
    case 'cancelled':
    case 'returned':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default function OrderDetailsPage() {
  const auth = useAuthSafe();
  const user = auth?.user;
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && user) {
      fetchOrder();
    }
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getById(orderId!);
      
      if (response.success) {
        setOrder(response.data as Order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const getTimelineStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'order_placed':
        return { icon: <FiPackage />, color: 'text-blue-500' };
      case 'order_confirmed':
        return { icon: <FiCheckCircle />, color: 'text-green-500' };
      case 'processing':
        return { icon: <FiPackage />, color: 'text-yellow-500' };
      case 'shipped':
        return { icon: <FiTruck />, color: 'text-blue-500' };
      case 'out_for_delivery':
        return { icon: <FiTruck />, color: 'text-purple-500' };
      case 'delivered':
        return { icon: <FiCheckCircle />, color: 'text-green-500' };
      case 'cancelled':
        return { icon: <FiXCircle />, color: 'text-red-500' };
      default:
        return { icon: <FiClock />, color: 'text-gray-500' };
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <GlassCard>
          <div className="text-center py-12">
            <FiPackage size={64} className="mx-auto mb-4 text-[#d1b16a]" />
            <h1 className="text-2xl font-bold mb-4">Order Details</h1>
            <p className="text-gray-600 mb-6">Please log in to view order details</p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors"
            >
              Login
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <FiRefreshCw className="animate-spin text-[#d1b16a] text-2xl mr-3" />
          <span className="text-gray-600">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <GlassCard>
          <div className="text-center py-12">
            <FiXCircle size={64} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4 text-red-600">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <div className="space-x-4">
              <Link 
                to="/orders" 
                className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Orders
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/orders" 
          className="inline-flex items-center text-[#d1b16a] hover:underline mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
        <p className="text-gray-600">Order #{order.orderNumber}</p>
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              {getStatusIcon(order.orderStatus)}
              <div>
                <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
                <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className="flex flex-col lg:items-end space-y-2">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus.replace('_', ' ')}
              </span>
              <span className="text-xl font-bold text-[#d1b16a]">
                {formatPrice(Number(order.totalAmount))}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {item.product.images[0] && (
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{item.product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.variant.color} • Size {item.variant.size} • Quantity: {item.quantity}
                    </p>
                    {item.product.description && (
                      <p className="text-sm text-gray-500">{item.product.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{formatPrice(Number(item.price))}</p>
                    <p className="text-sm text-gray-600">each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatPrice(Number(order.shippingCost))}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatPrice(Number(order.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatPrice(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Shipping & Payment Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Information */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <FiMapPin className="mr-2" />
              Shipping Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Shipping Address</p>
                <p className="text-gray-600">
                  {order.address.street}<br />
                  {order.address.city}, {order.address.state}<br />
                  {order.address.country} {order.address.postalCode}
                </p>
              </div>
              <div>
                <p className="font-medium">Shipping Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(order.shippingStatus)}`}>
                  {order.shippingStatus.replace('_', ' ')}
                </span>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="font-medium">Tracking Number</p>
                  <p className="text-gray-600 font-mono">{order.trackingNumber}</p>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-gray-600">{formatDate(order.estimatedDelivery)}</p>
                </div>
              )}
              {order.actualDelivery && (
                <div>
                  <p className="font-medium">Delivered On</p>
                  <p className="text-gray-600">{formatDate(order.actualDelivery)}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Payment Information */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <FiCalendar className="mr-2" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Payment Method</p>
                <p className="text-gray-600">{order.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="font-medium">Payment Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.replace('_', ' ')}
                </span>
              </div>
              {order.paymentProofUrl && (
                <div>
                  <p className="font-medium">Payment Proof</p>
                  <a 
                    href={order.paymentProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#d1b16a] hover:underline"
                  >
                    <FiDownload className="mr-1" />
                    Download Receipt
                  </a>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Order Timeline */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-6">Order Timeline</h3>
          <div className="space-y-4">
            {order.timeline.map((event, index) => {
              const statusInfo = getTimelineStatus(event.status);
              const isLast = index === order.timeline.length - 1;
              
              return (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusInfo.color} bg-white border-2 border-current`}>
                    {statusInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {event.description.en}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                    {!isLast && (
                      <div className="mt-2 ml-4 border-l-2 border-gray-200 h-6"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Customer Notes */}
        {order.customerNotes && (
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Customer Notes</h3>
            <p className="text-gray-600">{order.customerNotes}</p>
          </GlassCard>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to={`/track/${order.orderNumber}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors"
          >
            <FiTruck className="mr-2" />
            Track Order
          </Link>
          <Link 
            to="/orders"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
