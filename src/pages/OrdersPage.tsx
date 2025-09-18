import { useState, useEffect } from 'react';
import { FiFileText, FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from '../contexts/LangContext';
import { useAuthSafe } from '../contexts/AuthContext';
import { ordersApi } from '../services/api';
import GlassCard from '../components/GlassCard';
import { Link } from 'react-router-dom';

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
  items: OrderItem[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
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

export default function OrdersPage() {
  const t = useTranslation();
  const auth = useAuthSafe();
  const user = auth?.user;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getAll({ page: currentPage, limit: 10 });

      if (response.success) {
        setOrders(response.data as Order[]);
        const pages = (response as any).pagination?.pages as number | undefined;
        setTotalPages(pages || 1);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <GlassCard>
          <div className="text-center py-12">
            <FiFileText size={64} className="mx-auto mb-4 text-[#d1b16a]" />
            <h1 className="text-2xl font-bold mb-4">{t("orders")}</h1>
            <p className="text-gray-600 mb-6">Please log in to view your orders</p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors">

              Login
            </Link>
          </div>
        </GlassCard>
      </div>);

  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <FiRefreshCw className="animate-spin text-[#d1b16a] text-2xl" />
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <GlassCard>
          <div className="text-center py-12">
            <FiXCircle size={64} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors">

              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        </GlassCard>
      </div>);

  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("orders")}</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      {orders.length === 0 ?
      <GlassCard>
          <div className="text-center py-12">
            <FiFileText size={64} className="mx-auto mb-4 text-[#d1b16a]" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You have no previous orders yet.</p>
            <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors">

              Start Shopping
            </Link>
          </div>
        </GlassCard> :

      <div className="space-y-6">
          {orders.map((order) =>
        <GlassCard key={order.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                  {getStatusIcon(order.orderStatus)}
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col lg:items-end space-y-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-[#d1b16a]">
                    {formatPrice(Number(order.totalAmount))}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Items ({order.items.length})</h4>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item) =>
              <div key={item.id} className="flex items-center space-x-3">
                      {item.product.images[0] &&
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded" />

                }
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.variant.color} • Size {item.variant.size} • Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">{formatPrice(Number(item.price))}</span>
                    </div>
              )}
                  {order.items.length > 3 &&
              <p className="text-sm text-gray-600">+{order.items.length - 3} more items</p>
              }
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  <p>Shipping to: {order.address.city}, {order.address.country}</p>
                </div>
                <div className="flex space-x-2">
                  <Link
                to={`/orders/${order.id}`}
                className="inline-flex items-center px-4 py-2 border border-[#d1b16a] text-[#d1b16a] rounded-lg hover:bg-[#d1b16a] hover:text-white transition-colors">

                    View Details
                  </Link>
                  <Link
                to={`/track/${order.orderNumber}`}
                className="inline-flex items-center px-4 py-2 bg-[#d1b16a] text-white rounded-lg hover:bg-[#b89a5a] transition-colors">

                    Track Order
                  </Link>
                </div>
              </div>
            </GlassCard>
        )}

          {totalPages > 1 &&
        <div className="flex justify-center space-x-2 mt-8">
              <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">

                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">

                Next
              </button>
            </div>
        }
        </div>
      }
    </div>);

}