import React, { useState, useEffect } from 'react';
import { FiBox, FiSearch, FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, FiMapPin, FiCalendar } from 'react-icons/fi';
import { useLang } from '../contexts/LangContext';
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
  createdAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
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

export default function OrderTrackingPage() {
  const { lang } = useLang();
  const t = (key: string) => key; // Simple fallback translation function
  const auth = useAuthSafe();
  const user = auth?.user;
  const { orderNumber } = useParams<{orderNumber: string;}>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(orderNumber || '');

  useEffect(() => {
    if (orderNumber) {
      fetchOrder(orderNumber);
    }
  }, [orderNumber]);

  const fetchOrder = async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.track(identifier);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchOrder(searchInput.trim());
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
        return { icon: <FiBox />, color: 'text-blue-500' };
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

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("orderTracking")}</h1>
        <p className="text-gray-600">Track your order status and delivery progress</p>
      </div>

      {/* Search Form */}
      <GlassCard className="p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter order number (e.g., SOL-20241201-12345)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1b16a] focus:border-transparent" />

          </div>
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

            {loading ?
            <FiRefreshCw className="animate-spin mr-2" /> :

            <FiSearch className="mr-2" />
            }
            Track Order
          </button>
        </form>
      </GlassCard>

      {/* Loading State */}
      {loading &&
      <GlassCard>
          <div className="flex items-center justify-center py-12">
            <FiRefreshCw className="animate-spin text-[#d1b16a] text-2xl mr-3" />
            <span className="text-gray-600">Tracking order...</span>
          </div>
        </GlassCard>
      }

      {/* Error State */}
      {error && !loading &&
      <GlassCard>
          <div className="text-center py-12">
            <FiXCircle size={64} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find an order with that number. Please check the order number and try again.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Make sure you're entering the correct order number from your confirmation email.
              </p>
              {user &&
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 text-[#d1b16a] hover:underline">

                  View All Orders
                </Link>
            }
            </div>
          </div>
        </GlassCard>
      }

      {/* Order Details */}
      {order && !loading &&
      <div className="space-y-6">
          {/* Order Summary */}
          <GlassCard className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                {getStatusIcon(order.orderStatus)}
                <div>
                  <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
                  <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                  <p className="text-lg font-medium mt-2 text-[#d1b16a]">
                    Your order is {order.orderStatus.toLowerCase().replace('_', ' ')}.
                  </p>
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
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item) =>
              <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {item.product.images[0] &&
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded" />

                }
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.variant.color} • Size {item.variant.size} • Quantity: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">{formatPrice(Number(item.price))}</span>
                  </div>
              )}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FiMapPin className="mr-2" />
                  Shipping Address
                </h3>
                <div className="text-gray-600">
                  <p>{order.address.street}</p>
                  <p>{order.address.city}, {order.address.state}</p>
                  <p>{order.address.country} {order.address.postalCode}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FiCalendar className="mr-2" />
                  Delivery Information
                </h3>
                <div className="text-gray-600 space-y-1">
                  {order.trackingNumber &&
                <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>
                }
                  {order.estimatedDelivery &&
                <p><strong>Estimated Delivery:</strong> {formatDate(order.estimatedDelivery)}</p>
                }
                  {order.actualDelivery &&
                <p><strong>Delivered On:</strong> {formatDate(order.actualDelivery)}</p>
                }
                </div>
              </div>
            </div>
          </GlassCard>

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
                      {!isLast &&
                    <div className="mt-2 ml-4 border-l-2 border-gray-200 h-6"></div>
                    }
                    </div>
                  </div>);

            })}
            </div>
          </GlassCard>
        </div>
      }

      {/* Help Section */}
      {!order && !loading && !error &&
      <GlassCard className="p-6">
          <div className="text-center">
            <FiBox size={48} className="mx-auto mb-4 text-[#d1b16a]" />
            <h3 className="text-lg font-semibold mb-2">Track Your Order</h3>
            <p className="text-gray-600 mb-4">
              Enter your order number above to track your order status and delivery progress.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Order numbers look like: SOL-20241201-12345</p>
              <p>• You can find your order number in your confirmation email</p>
              {user &&
            <p>• <Link to="/orders" className="text-[#d1b16a] hover:underline">View all your orders</Link></p>
            }
            </div>
          </div>
        </GlassCard>
      }
    </div>);

}