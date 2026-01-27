import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { apiUrl, getAuthHeaders } from '@/lib/api';
// Using cookie-based auth across the app

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  image?: string;
  images?: string[];
  description?: string;
}

interface Order {
  _id: string;
  orderDate?: string;
  status?: string;
  totalAmount?: number;
  shippingAddress?: string;
  paymentStatus?: string;
  orderItems: OrderItem[];
  paymentDetails?: {
    paymentStatus?: string;
    [key: string]: any;
  };
  // added for UI/typing correctness
  createdAt?: string;
  isVerified?: boolean;
  deliveryStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/clients/user/orders'), {
        credentials: 'include',
        headers: { ...getAuthHeaders() },
      });
      if (res.status === 401) {
        setOrders([]);
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setOrders([]);
        setError(errData.msg || 'Failed to fetch orders.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
        setError('No orders found.');
      }
    } catch (err: any) {
      setOrders([]);
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // Refetch on window focus
    const onFocus = () => fetchOrders();
    window.addEventListener('focus', onFocus);
    // Poll every 20s for updates
    const interval = setInterval(fetchOrders, 20000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);
  // Card background variants (avoid pure white)
  const cardBgPalette = [
    'bg-rose-50','bg-orange-50','bg-amber-50','bg-lime-50','bg-emerald-50','bg-teal-50',
    'bg-cyan-50','bg-sky-50','bg-blue-50','bg-indigo-50','bg-violet-50','bg-purple-50',
    'bg-pink-50','bg-red-50','bg-stone-50','bg-zinc-50','bg-slate-50'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">My Orders</h1>

        {loading ? (
          <div className="text-center text-lg font-medium text-gray-500 animate-pulse">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 font-medium">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-600">No orders found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.flatMap((order, orderIndex) => {
              const displayStatus = (() => {
                if (order.status === 'cancelled') return 'cancelled';
                if (order.status === 'completed') return 'completed';
                // Prefer delivery status if present
                if (order.deliveryStatus === 'delivered') return 'delivered';
                if (order.deliveryStatus === 'shipped') return 'shipped';
                // Verified but not shipped yet
                if (order.isVerified) return 'verified';
                return order.status || 'pending';
              })();

              const isCancellable = displayStatus !== 'cancelled' && displayStatus !== 'completed' && displayStatus !== 'shipped' && displayStatus !== 'delivered';

              const handleCancel = async () => {
                if (!window.confirm('Are you sure you want to cancel this order?')) return;
                try {
                  const res = await fetch(apiUrl(`/clients/order/cancel/${order._id}`), {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  });
                  const data = await res.json();
                  if (res.ok && data.ok !== false) {
                    setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'cancelled' } : o)));
                  } else {
                    alert(data.msg || 'Failed to cancel order.');
                  }
                } catch {
                  alert('Network error. Please try again.');
                }
              };

              return (order.orderItems || []).map((item, idx) => {
                let imageSrc = '';
                if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
                  imageSrc = item.image;
                } else if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string') {
                  imageSrc = item.images[0];
                } else {
                  imageSrc = '/placeholder.svg';
                }

                const colorIndex = (orderIndex * 3 + idx) % cardBgPalette.length;
                const bgClass = cardBgPalette[colorIndex];
                const shortCode = order._id ? order._id.slice(-8) : '';

                return (
                  <Card
                    key={`${order._id}-${idx}`}
                    className={`relative rounded-xl p-5 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md transition-colors flex flex-col h-full overflow-hidden ${bgClass} cursor-pointer`}
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-mono select-all"><span className="font-semibold">#</span>{shortCode}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(shortCode); }}
                          className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100"
                          title="Copy code"
                        >Copy</button>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={`capitalize text-[11px] font-medium px-3 py-0.5 rounded-full border ${
                          displayStatus === 'completed' ? 'bg-green-100 text-green-800 border-green-200'
                          : displayStatus === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200'
                          : displayStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200'
                          : displayStatus === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : displayStatus === 'verified' ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>{displayStatus}</Badge>
                        {typeof order.paymentStatus === 'string' && (
                          <Badge className={`capitalize text-[11px] font-medium px-3 py-0.5 rounded-full border ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : order.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-800 border-gray-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                          }`}>
                            {order.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="grid grid-cols-[80px,1fr] sm:grid-cols-[150px,1fr] items-center gap-4">
                        <div className="w-[80px] h-[80px] sm:w-[150px] sm:h-[150px] flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <img 
                            src={imageSrc} 
                            alt={item.productName || 'Product'} 
                            className="w-full h-full object-contain" 
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} 
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate">{item.productName || item.productId}</div>
                          {item.description && (
                            <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                              {item.description}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs mt-2">
                            <span className="px-2 py-0.5 rounded-full font-medium bg-white border border-gray-200">
                              Qty: {item.quantity}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-medium bg-white border border-gray-200">
                              ₹{Number(item.price).toFixed(2)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-medium bg-white border border-gray-200">
                              Total: ₹{Number(item.totalPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/track-order?code=${shortCode}`); }}
                          className="px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-200 transition-colors ease-in-out duration-300 w-[110px] h-[32px] flex items-center justify-center"
                          title="Track this order"
                        >Track</button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                          }} 
                          disabled={!isCancellable} 
                          className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap ${
                            isCancellable 
                              ? 'bg-red-50 text-red-700 hover:bg-red-200 active:bg-red-300 transition-colors ease-in-out duration-300 cursor-pointer w-[110px] h-[32px] flex items-center justify-center' 
                              : 'bg-gray-100 text-gray-500 cursor-not-allowed w-[110px] h-[32px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
                          }`} 
                        >
                          {displayStatus === 'cancelled' ? 'Cancelled' : displayStatus === 'completed' ? 'Completed' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              });
            })}
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Orders;
