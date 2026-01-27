import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewSection } from '@/components/ReviewSection';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import { Clock, ShieldCheck, Truck, CheckCircle2, XCircle, ShoppingCart, Receipt, CalendarDays, CreditCard, MapPin, Package, Copy, Phone, ExternalLink, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/hooks/AuthProvider';

interface OrderItem {
  productId: string;
  variantId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  image?: string;
  images?: string[];
  description?: string;
  variantDetails?: {
    size?: string;
    color?: string;
    attributes?: Record<string, string>;
  };
}

interface Order {
  _id: string;
  status?: string;
  createdAt?: string;
  orderDate?: string;
  paymentStatus?: string;
  deliveryStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
  isVerified?: boolean;
  verifiedAt?: string | null;
  trackingNumber?: string | null;
  deliveryDate?: string | null;
  shippingAddress?: string;
  orderItems: OrderItem[];
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  paymentMethod?: string;
  carrier?: string | null;
  carrierUrl?: string | null;
  courierPhone?: string | null;
  carrierLogoUrl?: string | null;
  paymentDetails?: {
    provider?: string | null;
    transactionId?: string | null;
    razorpay_order_id?: string | null;
    paymentDate?: string | null;
    paymentAmount?: number;
    paymentStatus?: string;
  };
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviewProductId, setSelectedReviewProductId] = useState<string | null>(null);
  const { user } = useAuthContext();
  const [addingAll, setAddingAll] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/clients/user/orders/${id}`), { credentials: 'include', headers: { ...getAuthHeaders() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.msg || 'Failed to fetch order');
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch (e: any) {
      setError('Network error. Please try again.');
      setOrder(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    const onFocus = () => fetchOrder();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(fetchOrder, 20000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setRating = (pid: string, value: number) => setRatings((m) => ({ ...m, [pid]: value }));

  const displayStatus = useMemo(() => {
    if (!order) return 'pending';
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'completed') return 'completed';
    if (order.deliveryStatus === 'delivered') return 'delivered';
    if (order.deliveryStatus === 'shipped') return 'shipped';
    if (order.isVerified) return 'verified';
    return order.status || 'pending';
  }, [order]);

  const timeline = useMemo(() => {
    // Flipkart-like stepper
    const steps = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'verified', label: 'Verified' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' },
    ] as const;

    const currentIndex = (() => {
      if (displayStatus === 'cancelled') return 1; // show as placed but cancelled
      switch (displayStatus) {
        case 'delivered': return 3;
        case 'shipped': return 2;
        case 'verified': return 1;
        case 'completed': return 3; // treat as delivered/completed
        default: return 0; // pending
      }
    })();

    return steps.map((s, i) => ({
      ...s,
      active: i <= currentIndex,
      cancelled: displayStatus === 'cancelled' && i >= 1,
    }));
  }, [displayStatus]);

  const totals = useMemo(() => {
    const items = order?.orderItems || [];
    const subtotal = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const discount = typeof order?.discountAmount === 'number' ? order!.discountAmount : 0;
    const shipping = typeof order?.shippingCost === 'number' ? order!.shippingCost : 0;
    const tax = typeof order?.taxAmount === 'number' ? order!.taxAmount : 0;
    const grand = typeof order?.totalAmount === 'number' ? order!.totalAmount : Math.max(0, subtotal - discount) + shipping + tax;
    return { subtotal, discount, shipping, tax, grand };
  }, [order]);

  const isDelivered = displayStatus === 'delivered' || displayStatus === 'completed';

  const stepStyle = {
    pending: { bubble: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100', connector: 'from-amber-300 to-amber-400', label: 'text-amber-700' },
    verified: { bubble: 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-100', connector: 'from-purple-300 to-purple-400', label: 'text-purple-700' },
    shipped: { bubble: 'bg-sky-50 text-sky-700 border-sky-200 ring-2 ring-sky-100', connector: 'from-sky-300 to-sky-400', label: 'text-sky-700' },
    delivered: { bubble: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-100', connector: 'from-emerald-300 to-emerald-400', label: 'text-emerald-700' },
    cancelled: { bubble: 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-100', connector: 'from-red-300 to-red-400', label: 'text-red-700' },
    inactive: { bubble: 'bg-gray-50 text-gray-500 border-gray-200', connector: '', label: 'text-gray-500' }
  } as const;

  const pendingHints: Record<'pending' | 'verified' | 'shipped' | 'delivered', string> = {
    pending: 'Order not placed yet',
    verified: 'Verification pending',
    shipped: 'Shipment pending',
    delivered: 'Delivery pending',
  };

  // Reorder helpers
  const ensureLoggedIn = () => {
    if (!user) {
      toast.error('You must be logged in.');
      navigate('/auth');
      return false;
    }
    return true;
  };

  const buildCartPayloadFromOrderItem = (item: OrderItem, qty?: number) => {
    const price = Number(item.price) || 0;
    const Qty = typeof qty === 'number' && qty > 0 ? qty : 1;
    const discount = 0;
    const size = 'Free';
    const color = 'Default';
    const imageSrc = (item.image && item.image.trim() !== '')
      ? item.image
      : (Array.isArray(item.images) && item.images[0]) ? (item.images[0] as string) : '/placeholder.svg';

    return {
      productId: item.productId,
      title: item.productName || 'Product',
      description: item.description || 'No description available',
      brand: 'N/A',
      color,
      gender: 'Unisex',
      price, // Use price from order item (already final calculated price)
      basePrice: (item as any).basePrice || price,
      tax: (item as any).tax,
      shippingCost: (item as any).shippingCost,
      discount: (item as any).discount || { type: 'percentage', value: 0 },
      rating: '0',
      category: '',
      theme: '',
      size,
      image: [imageSrc],
      Qty,
      afterQtyprice: price * Qty, // Price is already final
      variation: { size, color, quantity: Qty },
      total: price * Qty,
    };
  };

  const addItemToCart = async (item: OrderItem, qty?: number) => {
    if (!ensureLoggedIn()) return;
    try {
      setAddingId(item.productId);
      const res = await fetch(apiUrl('/clients/user/addtocart'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(buildCartPayloadFromOrderItem(item, qty)),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Added "${item.productName || item.productId}" to cart`);
      } else {
        toast.error(data?.msg || 'Failed to add to cart');
      }
    } catch (e) {
      toast.error('Could not add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const addAllToCart = async () => {
    if (!ensureLoggedIn() || !order) return;
    const items = order.orderItems || [];
    if (items.length === 0) return;
    setAddingAll(true);
    let success = 0;
    for (const it of items) {
      try {
        const res = await fetch(apiUrl('/clients/user/addtocart'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(buildCartPayloadFromOrderItem(it, it.quantity || 1)),
        });
        if (res.ok) success += 1;
      } catch { /* ignore per-item error */ }
    }
    if (success > 0) toast.success(`Added ${success}/${items.length} items to cart`);
    if (success < items.length) toast.message('Some items could not be added');
    setAddingAll(false);
  };

  // Small util: copy text
  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Order Details</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono bg-white/70 border border-gray-200 rounded px-2 py-0.5">
                <span className="font-semibold">#</span>{order?._id?.slice(-8) || '--------'}
              </span>
              {order && (
                <Badge className={`capitalize text-[11px] font-medium px-3 py-0.5 rounded-full border ${
                  displayStatus === 'completed' ? 'bg-green-100 text-green-800 border-green-200'
                  : displayStatus === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200'
                  : displayStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200'
                  : displayStatus === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : displayStatus === 'verified' ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}>
                  {displayStatus}
                </Badge>
              )}
              {order?.paymentStatus && (
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 shadow-sm"
            >
              Back to Orders
            </button>
            {order && (
              <button
                onClick={() => window.print()}
                className="hidden sm:inline-flex text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 shadow-sm"
              >
                Print
              </button>
            )}
          </div>
        </div>

        {/* Content states */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2 animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </Card>
            <Card className="p-6 animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          </div>
        ) : error ? (
          <Card className="p-6 text-center text-red-600 font-medium">{error}</Card>
        ) : !order ? (
          <Card className="p-6 text-center text-gray-600">No order found.</Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order meta */}
              <Card className="p-5 sm:p-6 border-gray-200 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-50 border flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">Order ID</div>
                      <div className="text-sm font-mono truncate" title={order._id}>{order._id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-50 border flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Placed on</div>
                      <div className="text-sm font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-50 border flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm">
                        <span className={`capitalize text-[11px] font-medium px-2.5 py-0.5 rounded-full border inline-block ${
                          displayStatus === 'completed' ? 'bg-green-100 text-green-800 border-green-200'
                          : displayStatus === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200'
                          : displayStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200'
                          : displayStatus === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : displayStatus === 'verified' ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>{displayStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-50 border flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Payment</div>
                      <div className="text-sm font-medium capitalize">{order.paymentStatus || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Tracking No: <span className="font-mono">{order.trackingNumber}</span></div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.trackingNumber)}>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                      </Button>
                      {(order.carrierUrl || order.trackingNumber) && (
                        <Button variant="outline" size="sm" onClick={() => window.open(order.carrierUrl || `https://www.google.com/search?q=${encodeURIComponent(order.trackingNumber!)}`, '_blank')}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Track
                        </Button>
                      )}
                      {order.courierPhone && (
                        <Button variant="outline" size="sm" onClick={() => window.open(`tel:${order.courierPhone}`, '_self')}>
                          <Phone className="w-3.5 h-3.5 mr-1" /> Call
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Tracking timeline */}
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-700" /> Tracking Status
                </h2>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {timeline.map((step, idx) => {
                      const Icon = step.cancelled ? XCircle : (step.key === 'pending' ? Clock : step.key === 'verified' ? ShieldCheck : step.key === 'shipped' ? Truck : CheckCircle2);
                      const activeStyle = step.cancelled ? stepStyle.cancelled : step.active ? stepStyle[step.key] : stepStyle.inactive;
                      const next = timeline[idx + 1];
                      const connectorClass = !next ? '' : next.cancelled ? 'bg-red-200' : next.active ? `bg-gradient-to-r ${stepStyle[next.key].connector}` : 'bg-gray-200';
                      const dateText = step.key === 'pending'
                        ? (order.createdAt || order.orderDate)
                        : step.key === 'verified'
                        ? order.verifiedAt || undefined
                        : step.key === 'delivered'
                        ? order.deliveryDate || undefined
                        : undefined;
                      return (
                        <div key={step.key} className="flex-1 flex items-center min-w-0">
                          <div className="flex flex-col items-center text-center w-full">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-colors duration-200 ${activeStyle.bubble}`}
                              title={step.label}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className={`mt-2 text-xs font-medium ${step.cancelled ? stepStyle.cancelled.label : step.active ? activeStyle.label : stepStyle.inactive.label}`}>{step.label}</div>
                            {dateText ? (
                              <div className="mt-0.5 text-[10px] text-gray-400">{new Date(dateText).toLocaleDateString()}</div>
                            ) : (!step.active && !step.cancelled) ? (
                              <div className="mt-0.5 text-[10px] text-amber-600">{pendingHints[step.key]}</div>
                            ) : null}
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className={`h-[2px] flex-1 mx-2 ${connectorClass}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {order.deliveryDate && (
                    <div className="mt-4 text-xs text-gray-600">Delivery Date: {new Date(order.deliveryDate).toLocaleString()}</div>
                  )}
                </div>
              </Card>

              {/* Items list */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-gray-700" /> Items</h2>
                  {isDelivered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addAllToCart}
                      disabled={addingAll || (order.orderItems || []).length === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> {addingAll ? 'Adding...' : 'Add all to cart'}
                    </Button>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {(order.orderItems || []).map((item, idx) => {
                    const imageSrc = (item.image && item.image.trim() !== '') ? item.image : (Array.isArray(item.images) && item.images[0]) ? (item.images[0] as string) : '/placeholder.svg';
                    const isThisAdding = addingId === item.productId;
                    return (
                      <div key={`${order._id}-${idx}`} className="py-4 grid grid-cols-[70px,1fr] sm:grid-cols-[100px,1fr] gap-4 hover:bg-gray-50/50 rounded-md px-1">
                        <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                          <img src={imageSrc} alt={item.productName || 'Product'} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/product/${item.productId}`)}
                              className="font-medium text-sm sm:text-base text-gray-900 hover:text-destructive truncate text-left"
                              title={item.productName || item.productId}
                            >
                              {item.productName || item.productId}
                            </button>
                            {item.description && <div className="text-xs text-gray-600 line-clamp-2">{item.description}</div>}
                            {/* Display variant information */}
                            {(item.variantDetails?.size || item.variantDetails?.color || item.sku) && (
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                {item.variantDetails?.size && <div>Size: <span className="font-medium">{item.variantDetails.size}</span></div>}
                                {item.variantDetails?.color && <div>Color: <span className="font-medium">{item.variantDetails.color}</span></div>}
                                {item.sku && <div>SKU: <span className="font-mono font-medium">{item.sku}</span></div>}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                              <span className="px-2 py-0.5 rounded-full font-medium bg-gray-50 border border-gray-200">Qty: {item.quantity}</span>
                              <span className="px-2 py-0.5 rounded-full font-medium bg-gray-50 border border-gray-200">₹{Number(item.price).toFixed(2)}</span>
                              <span className="px-2 py-0.5 rounded-full font-medium bg-gray-50 border border-gray-200">Total: ₹{Number(item.totalPrice).toFixed(2)}</span>
                            </div>
                            {isDelivered && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addItemToCart(item, item.quantity || 1)}
                                  disabled={isThisAdding}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-1" /> {isThisAdding ? 'Adding...' : 'Add to cart'}
                                </Button>
                                <Button size="sm" onClick={() => navigate(`/product/${item.productId}`)}>Buy again</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Post-delivery: Feedback */}
              {isDelivered && (
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-700" /> Share your feedback</h2>
                  <p className="text-sm text-gray-600 mb-4">Your experience helps us improve. Rate and review the products you received.</p>
                  <div className="space-y-3">
                    {(order.orderItems || []).map((item, idx) => {
                      const imageSrc = (item.image && item.image.trim() !== '') ? item.image : (Array.isArray(item.images) && item.images[0]) ? item.images[0] as string : '/placeholder.svg';
                      return (
                        <div key={`fb-${order._id}-${idx}`} className="flex items-center justify-between gap-3 border rounded-md p-3 bg-white">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                              <img src={imageSrc} alt={item.productName || 'Product'} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-sm text-gray-900 truncate max-w-[220px] sm:max-w-[360px]" title={item.productName || item.productId}>{item.productName || item.productId}</div>
                              <div className="text-[11px] text-gray-500">Qty: {item.quantity}</div>
                              <div className="mt-1 flex items-center gap-1">
                                {[1,2,3,4,5].map(n => (
                                  <button key={n} className="p-0.5" onClick={() => setRating(item.productId, n)} aria-label={`Rate ${n} star`}>
                                    <Star className={(ratings[item.productId] || 0) >= n ? 'w-4 h-4 text-amber-500' : 'w-4 h-4 text-gray-300'} fill={(ratings[item.productId] || 0) >= n ? 'currentColor' : 'none'} />
                                  </button>
                                ))}
                                <span className="ml-2 text-[11px] text-gray-500">{ratings[item.productId] ? `${ratings[item.productId]} / 5` : 'Tap to rate'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" className="text-xs" onClick={() => setSelectedReviewProductId(item.productId)}>
                              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Write review
                            </Button>
                            <Button className="text-xs" onClick={() => navigate(`/product/${item.productId}#reviews`)}>
                              Go to product
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedReviewProductId && (
                    <div className="mt-5">
                      <ReviewSection productId={selectedReviewProductId} />
                    </div>
                  )}
                </Card>
              )}

              {/* Buy Again now shown inline within Items when delivered */}
            </div>

            {/* Right column - sticky summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-700" /> Order Summary</h2>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="text-gray-500">Discount</span>
                        <span>-₹{totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.tax > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span>₹{totals.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span>{totals.shipping === 0 ? 'Free' : `₹${totals.shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{totals.grand.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-700" /> Payment Details</h2>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-gray-500">Status</span><span className="capitalize">{order.paymentStatus || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Provider</span><span>{order.paymentDetails?.provider || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Method</span><span className="capitalize">{order.paymentMethod || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Txn ID</span><span className="font-mono truncate max-w-[160px]" title={order.paymentDetails?.transactionId || undefined}>{order.paymentDetails?.transactionId || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Amount</span><span>{typeof order.paymentDetails?.paymentAmount === 'number' ? `₹${order.paymentDetails.paymentAmount.toFixed(2)}` : typeof order.totalAmount === 'number' ? `₹${order.totalAmount.toFixed(2)}` : 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Date</span><span>{order.paymentDetails?.paymentDate ? new Date(order.paymentDetails.paymentDate).toLocaleString() : 'N/A'}</span></div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-700" /> Shipping</h2>
                  <div className="text-sm text-gray-700 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                        <div>
                          <div className="text-gray-500">Address</div>
                          <div className="mt-0.5 max-w-[260px] text-foreground/90">{order.shippingAddress || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.shippingAddress)}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                        </Button>
                        {order.shippingAddress && (
                          <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(order.shippingAddress!)}`, '_blank')}>Directions</Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Delivery Status</span><span className="capitalize">{order.deliveryStatus || 'pending'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Order Status</span><span className="capitalize">{order.status || 'pending'}</span></div>
                  </div>
                </Card>

                {/* Return Policy */}
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-2">Return Policy</h2>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    <li>Returns accepted within 7 days of delivery.</li>
                    <li>Items must be unused, with tags and original packaging.</li>
                    <li>Refunds issued to original payment method after inspection.</li>
                  </ul>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/faq')}>Learn more</Button>
                    <Button size="sm" onClick={() => navigate('/contact')}>Need help?</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetails;
