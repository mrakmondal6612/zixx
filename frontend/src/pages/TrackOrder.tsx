
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle2, Truck, MapPin, PackageCheck, XCircle, RotateCcw, ExternalLink, Package, Phone, Clock } from 'lucide-react';
import { apiUrl, getAuthHeaders } from '@/lib/api';

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  image?: string;
}

interface Order {
  _id: string;
  createdAt?: string;
  orderDate?: string;
  status?: string;
  deliveryStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
  trackingNumber?: string;
  carrier?: string | null;
  carrierUrl?: string | null;
  courierPhone?: string | null;
  courierLogoUrl?: string | null;
  deliveryDate?: string;
  confirmedAt?: string | null;
  verifiedAt?: string | null;
  packedAt?: string | null;
  shippedAt?: string | null;
  outForDeliveryAt?: string | null;
  cancelledAt?: string | null;
  returnedAt?: string | null;
  totalAmount?: number;
  shippingAddress?: string;
  paymentStatus?: string;
  orderItems: OrderItem[];
  shipments?: Array<{
    id?: string | null;
    carrier?: string | null;
    carrierUrl?: string | null;
    trackingNumber?: string | null;
    status?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    items?: Array<{ productId: string; productName?: string; quantity: number; image?: string }>;
  }>;
}

// Helpers to render a marketplace-style tracker
function formatDate(d?: string) {
  if (!d) return undefined;
  try { return new Date(d).toLocaleString(); } catch { return undefined; }
}

function maskPhone(p?: string | null) {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (digits.length < 4) return p;
  return `****${digits.slice(-4)}`;
}

type Step = { key: string; label: string; at?: string; done: boolean; active: boolean; icon: React.ReactNode };

function computeSteps(order: Order): Step[] {
  const createdAt = order.createdAt || order.orderDate;
  const deliveredAt = order.deliveryDate;
  const status = (order.status || '').toLowerCase();
  const dstatus = (order.deliveryStatus || '').toLowerCase();
  const confirmedAtLocal = order.confirmedAt || order.verifiedAt || undefined;

  // Cancelled or Returned flow overrides
  const isCancelled = status.includes('cancel');
  const isReturned = status.includes('return') || dstatus === 'returned';

  // Determine current stage index primarily from timestamps
  // 0: Placed, 1: Confirmed, 2: Packed, 3: Shipped, 4: Out for Delivery, 5: Delivered
  let stage = 0;
  if (confirmedAtLocal) stage = 1;
  if (order.packedAt) stage = 2;
  if (order.shippedAt || dstatus === 'shipped') stage = 3;
  if (order.outForDeliveryAt) stage = 4;
  if (dstatus === 'delivered' || !!order.deliveryDate) stage = 5;

  const labels = {
    placed: 'Order Placed',
    confirmed: 'Order Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    out: 'Out for Delivery',
    delivered: 'Delivered',
  } as const;

  const steps: Step[] = [
    { key: 'placed', label: labels.placed, at: formatDate(createdAt), done: stage >= 0, active: stage === 0, icon: <ShoppingCart className="w-5 h-5" /> },
    { key: 'confirmed', label: labels.confirmed, at: formatDate(confirmedAtLocal), done: stage >= 1, active: stage === 1, icon: <CheckCircle2 className="w-5 h-5" /> },
    { key: 'packed', label: labels.packed, at: formatDate(order.packedAt || undefined), done: stage >= 2, active: stage === 2, icon: <Package className="w-5 h-5" /> },
    { key: 'shipped', label: labels.shipped, at: formatDate(order.shippedAt || undefined), done: stage >= 3, active: stage === 3, icon: <Truck className="w-5 h-5" /> },
    { key: 'out', label: labels.out, at: formatDate(order.outForDeliveryAt || undefined), done: stage >= 4, active: stage === 4, icon: <MapPin className="w-5 h-5" /> },
    { key: 'delivered', label: labels.delivered, at: formatDate(deliveredAt), done: stage >= 5, active: stage === 5, icon: <PackageCheck className="w-5 h-5" /> },
  ];

  // If explicitly out for delivery via status text (fallback)
  if (dstatus === 'out for delivery' || status.includes('out for delivery')) {
    steps.forEach(s => (s.active = false));
    steps[4].done = true; steps[4].active = true;
  }

  // If delivered, mark all previous as done
  if (stage === 5) {
    steps.forEach((s, i) => { s.done = i <= 5; s.active = i === 5; });
  }

  // Cancelled or Returned display tweaks
  if (isCancelled) {
    steps.forEach(s => { s.active = false; });
    // Indicate cancellation after current stage
    steps.push({ key: 'cancelled', label: 'Cancelled', at: formatDate(order.cancelledAt || undefined), done: true, active: true, icon: <XCircle className="w-4 h-4" /> });
  } else if (isReturned) {
    steps.forEach(s => { s.active = false; });
    steps.push({ key: 'returned', label: 'Returned', at: formatDate(order.returnedAt || undefined), done: true, active: true, icon: <RotateCcw className="w-4 h-4" /> });
  }

  return steps;
}

// Translations (English only)
const dict = {
  en: {
    trackYourOrder: 'Track Your Order',
    enterPrompt: 'Enter your Order Number, Short Code, or Tracking ID',
    inputLabel: 'Order Number / Short Code / Tracking ID',
    emailPublic: 'Email Address (for public tracking)',
    trackBtn: 'Track Order',
    tracking: 'Tracking…',
    orderId: 'Order ID',
    placedOn: 'Placed on',
    trackingNo: 'Tracking #',
    etaDelivered: 'ETA/Delivered',
    total: 'Total',
    courier: 'Courier',
    liveTracking: 'Live Tracking',
    trackingProgress: 'Tracking Progress',
    shipTo: 'Ship to',
    items: 'Items',
    needHelp: 'Need Help?',
    helpText: 'If you have any questions about your order, please contact our customer service team.',
    cancelledText: 'This order was cancelled',
    returnedText: 'This order was returned',
    eta: 'ETA',
    deliveredOn: 'Delivered on',
    shipments: 'Shipments',
    track: 'Track',
  },
} as const;

type Lang = 'en';


// Title-case helper for status chips
function titleCase(s?: string | null) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .split(/\s|_/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function translateChip(value?: string | null, lang: Lang = 'en') {
  const v = String(value || '').toLowerCase();
  return titleCase(v);
}

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const lang: Lang = 'en';
  const t = (k: keyof typeof dict['en']) => dict.en[k];

  // Core tracking logic extracted so we can call it directly from effects
  const doTrack = async (rawInput: string, emailOverride?: string) => {
    const input = (rawInput || '').trim();
    setError(null);
    setOrder(null);
    if (!input) {
      setError('Please enter your order number.');
      return;
    }
    setLoading(true);
    try {
      const emailUse = (emailOverride ?? email)?.trim();
      // If email is provided, use public endpoint (no auth)
      if (emailUse) {
        const emailNorm = emailUse.toLowerCase();
        const res = await fetch(apiUrl('/clients/order/track'), {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: input, email: emailNorm })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.msg || 'Failed to track order.');
        }
        setOrder(data.order as Order);
        return;
      }

      // Else require auth: resolve short code if needed, then fetch details
      let targetId: string | null = null;
      if (/^[a-f0-9]{24}$/i.test(input)) {
        targetId = input;
      } else {
        const listRes = await fetch(apiUrl('/clients/user/orders'), {
          credentials: 'include',
          headers: { ...getAuthHeaders() },
        });
        if (listRes.status === 401) {
          throw new Error('Please log in to track your order or provide your email to use public tracking.');
        }
        if (!listRes.ok) {
          throw new Error('Failed to fetch your orders.');
        }
        const listData = await listRes.json();
        const needle = input.toLowerCase();
        const found = Array.isArray(listData.orders)
          ? listData.orders.find((o: Order) => {
              const idMatch = (o._id || '').toLowerCase().endsWith(needle);
              const trMatch = (o.trackingNumber || '').toLowerCase() === needle;
              return idMatch || trMatch;
            })
          : null;
        if (found) targetId = found._id;
        else throw new Error('No matching order found for the provided code.');
      }

      const res = await fetch(apiUrl(`/clients/user/orders/${targetId}`), {
        credentials: 'include',
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.msg || 'Failed to fetch order.');
      setOrder(data.order as Order);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await doTrack(orderNumber);
  };

  // Prefill and auto-track from query params (?code=, ?id=, ?tracking=, optional ?email=)
  useEffect(() => {
    const qpCode = searchParams.get('code') || searchParams.get('id') || searchParams.get('tracking');
    const qpEmail = searchParams.get('email') || undefined;
    if (qpCode) {
      setOrderNumber(qpCode);
      // trigger tracking immediately with the query param value to avoid state timing issues
      if (!loading) {
        doTrack(qpCode, qpEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="max-w-md mx-auto text-center justify-center max-w-4xl md:max-w-4xl lg:max-w-6xl xl:max-w-8xl">
          <h1 className="text-4xl font-bold mb-8">{t('trackYourOrder')}</h1>
          <p className="text-gray-600 mb-8">{t('enterPrompt')}</p>
          {/* Language toggle removed: English only */}
          
          <form onSubmit={handleTrack} className="space-y-6">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                {t('inputLabel')}
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D92030] focus:outline-none"
                placeholder="e.g. 64ff... (Order ID), ab12cd34 (short), or TRK12345678"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailPublic')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D92030] focus:outline-none"
                placeholder="Enter your email to track without logging in (optional)"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D92030] hover:bg-[#BC1C2A] py-3 disabled:opacity-60"
            >
              {loading ? t('tracking') : t('trackBtn')}
            </Button>
          </form>

          {/* Feedback */}
          {loading && <div className="mt-6 text-gray-600">Tracking your order...</div>}
          {error && !loading && <div className="mt-6 text-red-600">{error}</div>}
          {order && !loading && !error && (
            <div className="mt-10 text-left w-full mx-auto max-w-6xl px-2 sm:px-4 lg:px-0">
              <div className="p-6 md:p-7 border border-gray-200 rounded-xl bg-white shadow-md space-y-5">
                <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-between">
                  <div className="text-sm text-gray-600">{t('orderId')}: <span className="font-mono">{order._id}</span></div>
                  <div className="text-[11px] sm:text-sm flex flex-wrap items-center gap-2 max-w-full w-full sm:w-auto">
                    <span className="px-3 py-1.5 rounded-full border mr-1 whitespace-normal break-words shadow-sm font-medium" style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: '#111827' }}>{translateChip(order.status, lang) || 'Pending'}</span>
                    {order.deliveryStatus && (
                      <span className={`px-3 py-1.5 rounded-full border mr-1 whitespace-normal break-words inline-flex items-center gap-1.5 shadow-sm font-medium ${String(order.deliveryStatus).toLowerCase()==='out for delivery' ? 'text-emerald-800' : 'text-blue-800'}`} style={{ backgroundColor: String(order.deliveryStatus).toLowerCase()==='out for delivery' ? '#D1FAE5' : '#DBEAFE', borderColor: String(order.deliveryStatus).toLowerCase()==='out for delivery' ? '#A7F3D0' : '#BFDBFE' }}>
                        <Truck className="w-4 h-4" /> {translateChip(order.deliveryStatus, lang)}
                      </span>
                    )}
                    {order.paymentStatus && (
                      <span className="px-3 py-1.5 rounded-full border whitespace-normal break-words shadow-sm font-medium" style={{ backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#065F46' }}>{translateChip(order.paymentStatus, lang)}</span>
                    )}
                    {/* Delivered on pill */}
                    {(String(order.deliveryStatus).toLowerCase()==='delivered' || !!order.deliveryDate) && (
                      <span className="px-3 py-1.5 rounded-full border bg-emerald-600 text-white border-emerald-600 inline-flex items-center gap-1.5 whitespace-normal break-words shadow-sm font-medium">
                        <PackageCheck className="w-4 h-4" /> {t('deliveredOn')}: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>{t('placedOn')}: <span className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleString() : order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</span></div>
                  <div>{t('trackingNo')}: <span className="font-medium">{order.trackingNumber || 'N/A'}</span></div>
                  <div>{t('etaDelivered')}: <span className="font-medium">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</span></div>
                  <div>{t('total')}: <span className="font-medium">₹{Number(order.totalAmount || 0).toFixed(2)}</span></div>
                </div>

                {/* Courier info */}
                {(order.carrier || order.carrierUrl || order.courierPhone || order.courierLogoUrl) && (
                  <div className="mt-3 text-sm text-gray-700 flex flex-wrap items-center gap-3"> 
                    {order.courierLogoUrl && (
                      <img src={order.courierLogoUrl} alt="Courier Logo" className="h-6 w-auto object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {order.carrier && (
                      <div>
                        <span className="text-gray-600">{t('courier')}:</span>{' '}
                        <span className="font-medium">{order.carrier}</span>
                      </div>
                    )}
                    {order.courierPhone && (
                      <div className="inline-flex items-center gap-1 text-gray-700">
                        <Phone className="w-3.5 h-3.5" /> {maskPhone(order.courierPhone)}
                      </div>
                    )}
                    {order.carrierUrl && (
                      <a href={order.carrierUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        {t('liveTracking')} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Progress Tracker */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">{t('trackingProgress')}</h3>
                  {(() => {
                    const steps = computeSteps(order);
                    return (
                      <div>
                        {/* Horizontal stepper on md+, vertical on mobile */}
                        <div className="hidden md:flex items-center">
                          {steps.map((s, idx) => (
                            <div key={s.key} className="flex items-center flex-1">
                              <div className={`flex flex-col items-center text-center ${idx === 0 ? 'ml-0' : 'ml-2'} ${idx === steps.length - 1 ? 'mr-0' : 'mr-2'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold border shadow-sm ${s.done || s.active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                  {s.icon}
                                </div>
                                <div className="mt-2 text-[11px] font-medium text-gray-800 whitespace-nowrap">{s.label}</div>
                                {s.at && <div className="mt-1 text-[10px] text-gray-500">{s.at}</div>}
                              </div>
                              {idx < steps.length - 1 && (
                                <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                                  <div className={`h-1.5 rounded-full transition-colors ${steps[idx + 1].done || steps[idx].done || s.active ? 'bg-emerald-600' : 'bg-gray-300'}`} style={{ width: '100%' }} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="md:hidden">
                          <ol className="relative border-s border-gray-200 pl-4">
                            {steps.map((s, idx) => (
                              <li key={s.key} className="mb-6 ml-2">
                                <span className={`absolute -left-1.5 flex h-3 w-3 rounded-full border ${s.done || s.active ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-300 border-gray-300'}`}> </span>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1">{s.icon}{s.label}</h4>
                                {s.at && <time className="block text-xs text-gray-500">{s.at}</time>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Cancelled/Returned banner */}
                {((order.status || '').toLowerCase().includes('cancel')) && (
                  <div className="mt-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> {t('cancelledText')} {order.cancelledAt ? `${new Date(order.cancelledAt).toLocaleString()}` : ''}
                  </div>
                )}
                {(((order.status || '').toLowerCase().includes('return')) || (order.deliveryStatus === 'returned')) && (
                  <div className="mt-4 p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> {t('returnedText')} {order.returnedAt ? `${new Date(order.returnedAt).toLocaleString()}` : ''}
                  </div>
                )}

                {order.shippingAddress && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-semibold">{t('shipTo')}:</span>{' '}
                    <span className="font-semibold underline decoration-gray-300">{order.shippingAddress}</span>
                  </div>
                )}
              </div>

              {/* Shipments (per-parcel split) */}
              {Array.isArray(order.shipments) && order.shipments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">{t('shipments')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.shipments.map((sh, idx) => (
                      <div key={sh.id || idx} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm h-full">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-sm font-medium">{sh.carrier || order.carrier || 'Shipment'}</div>
                          {sh.trackingNumber && (
                            <div className="text-xs text-gray-600">#{sh.trackingNumber}</div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-600 flex flex-wrap items-center gap-2">
                          {sh.status && <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 capitalize">{translateChip(sh.status, 'en')}</span>}
                          {sh.shippedAt && <span>Shipped: {new Date(sh.shippedAt).toLocaleDateString()}</span>}
                          {sh.deliveredAt && <span>Delivered: {new Date(sh.deliveredAt).toLocaleDateString()}</span>}
                          {sh.carrierUrl && (
                            <a href={sh.carrierUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-auto">
                              {t('track')} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {Array.isArray(sh.items) && sh.items.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {sh.items.map((it, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                                  <img src={it.image || '/placeholder.svg'} alt={it.productName || it.productId} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{it.productName || it.productId}</div>
                                  <div className="text-xs text-gray-600">Qty: {it.quantity}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-3">{t('items')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 items-stretch">
                  {(order.orderItems || []).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-5 p-6 border border-gray-200 rounded-2xl bg-white h-full">
                      <div className="w-28 h-28 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <img src={it.image || '/placeholder.svg'} alt={it.productName || it.productId} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xl font-semibold truncate">{it.productName || it.productId}</div>
                        <div className="text-base text-gray-600">Qty: {it.quantity}</div>
                      </div>
                      <div className="text-xl md:text-2xl font-semibold">₹{Number(it.totalPrice || (it.price||0) * (it.quantity||1)).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Need Help?</h3>
            <p className="text-gray-600 text-sm">
              If you have any questions about your order, please contact our customer service team.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackOrder;
