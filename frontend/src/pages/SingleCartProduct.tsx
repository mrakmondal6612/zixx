import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import { uuidv4 } from '@/lib/uuid';

type AddressObjectType = {
  personal_address?: string;
  shoping_address?: string;
  billing_address?: string;
  address_village?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
};

const formatAddress = (addressObj: AddressObjectType): string => {
  const parts = [
    addressObj.personal_address,
    addressObj.address_village,
    addressObj.landmark,
    addressObj.city,
    addressObj.state,
    addressObj.country,
    addressObj.zip
  ].filter(Boolean);
  return parts.join(', ') || 'No address provided';
};

interface CartProduct {
  id: string;
  productId: string;
  name: string;
  gender: string;
  category: string;
  theme: string;
  description: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  brand: string;
}

const SingleCartProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<CartProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  // Extract the necessary items
  const { user } = useAuthContext();

  // Type guard function to check if an object is an address
  const isAddressObject = (obj: any): obj is AddressObjectType => {
    return obj && typeof obj === 'object' && (
      'personal_address' in obj ||
      'address_village' in obj ||
      'landmark' in obj ||
      'city' in obj ||
      'state' in obj ||
      'country' in obj ||
      'zip' in obj
    );
  };
  const { t } = useLanguage();

  // translation helper that falls back to a safe English string when key is missing
  const tr = (key: string, fallback: string) => {
    try {
      const v = t(key);
      // if translation returns the same key (missing) or falsy, use fallback
      if (!v || v === key) return fallback;
      return v;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/clients/user/getcart/${id}`), {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });
        if (res.status === 401) {
          toast.error(t('auth.pleaseLogin'));
          navigate('/auth');
          return;
        }
        const data = await res.json();
        if (data.data) {
          setProduct({
            id: data.data._id,
            productId: data.data.productId,
            name: data.data.title,
            gender: data.data.gender,
            category: data.data.category,
            theme: data.data.theme,
            description: data.data.description || '',
            color: data.data.color || '',
            size: data.data.size || '',
            price: data.data.price,
            quantity: data.data.Qty,
            image: Array.isArray(data.data.image) ? data.data.image[0] : data.data.image,
            brand: data.data.brand || '',
          });
        } else {
          toast.error(t('messages.productNotFound'));
          navigate('/cart');
        }
      } catch (err) {
        toast.error(t('messages.failedToLoadProduct'));
        navigate('/cart');
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, navigate]);

  const handleBuyCOD = async () => {
    if (!product) return;
    if (!user) {
      toast.error(t('auth.pleaseLoginToContinue'));
      navigate('/auth');
      return;
    }

    // First check if we have a valid shipping address
    const addr = user?.address;
    if (!addr) {
      toast.error(t('orders.noShippingAddress') || 'Please add a shipping address before placing order');
      return;
    }

    try {
      setPaying(true);
    const placeRes = await fetch(apiUrl(`/clients/order/buy-selected`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          cartIds: [product.id],
      batchId: uuidv4(),
          paymentDetails: { 
            provider: 'cod',
            paymentStatus: 'pending',
            paymentAmount: product.price * product.quantity
          },
          shippingAddress: (() => {
            if (typeof addr === 'string') {
              if (!addr.trim()) return 'No address provided';
              try {
                const parsed = JSON.parse(addr);
                if (isAddressObject(parsed)) {
                  return formatAddress(parsed);
                }
                return addr;
              } catch {
                return addr;
              }
            }
            if (isAddressObject(addr)) {
              return formatAddress(addr);
            }
            return 'No address provided';
          })()
        })
      });
      const placeData = await placeRes.json().catch(() => ({}));
      if (!placeRes.ok || placeData?.ok === false) {
        toast.error(placeData?.msg || t('orders.orderFailed'));
        setPaying(false);
        return;
      }
      toast.success(t('orders.orderPlaced') || 'Order placed successfully! You will pay on delivery.');
      navigate('/orders');
    } catch (_) {
      toast.error(t('messages.somethingWentWrong') || 'Failed to place order');
    }
    setPaying(false);
  };

  const handleBuy = async () => {
    if (!product) return;
    if (!user) {
      toast.error(t('auth.pleaseLoginToContinue'));
      navigate('/auth');
      return;
    }

    // COD flow
    if (paymentMethod === 'cod') {
      return handleBuyCOD();
    }

    const loadRazorpay = () => new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    try {
      setPaying(true);
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error(t('payment.razorpayFailed'));
        setPaying(false);
        return;
      }

      const amountInPaise = Math.round((product.price * product.quantity) * 100);
      if (amountInPaise <= 0) {
        toast.error(t('payment.invalidAmount'));
        setPaying(false);
        return;
      }

      // 1) Get key
      const keyRes = await fetch(apiUrl('/clients/payments/razorpay/key'), { credentials: 'include', headers: { ...getAuthHeaders() } });
      const keyData = await keyRes.json().catch(() => ({}));
      if (!keyRes.ok || !keyData?.key) {
        toast.error(keyData?.msg || t('payment.failedToGetKey'));
        setPaying(false);
        return;
      }

      // 2) Create order
      const orderRes = await fetch(apiUrl('/clients/payments/razorpay/order'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ amountInPaise, currency: 'INR', notes: { single: true, cartId: product.id } })
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData?.order?.id) {
        toast.error(orderData?.msg || t('payment.failedToInitiate'));
        setPaying(false);
        return;
      }

      const options: any = {
        key: keyData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency || 'INR',
        name: 'Zixx',
        description: 'Order Payment',
        order_id: orderData.order.id,
        prefill: { name: user?.name || '', email: user?.email || '', contact: '' },
        theme: { color: '#D92030' },
        handler: async (response: any) => {
          try {
            // 3) Verify signature
            const verifyRes = await fetch(apiUrl('/clients/payments/razorpay/verify'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || verifyData?.ok !== true) {
              toast.error(verifyData?.msg || t('payment.verificationFailed'));
              setPaying(false);
              return;
            }

            // 4) Place order
            const placeRes = await fetch(apiUrl(`/clients/order/buy-selected`), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ 
                cartIds: [product.id], 
                batchId: uuidv4(),
                paymentDetails: { 
                  provider: 'razorpay', 
                  razorpay_order_id: response.razorpay_order_id, 
                  razorpay_payment_id: response.razorpay_payment_id 
                },
                shippingAddress: (() => {
                  const addr = user?.address;
                  if (!addr) return 'No address provided';

                  if (typeof addr === 'string') {
                    if (!addr.trim()) return 'No address provided';
                    
                    try {
                      const parsed = JSON.parse(addr);
                      if (parsed && typeof parsed === 'object') {
                        return formatAddress(parsed as AddressObjectType);
                      }
                      return addr;
                    } catch {
                      return addr;
                    }
                  }
                  
                  if (isAddressObject(addr)) {
                    return formatAddress(addr);
                  }
                  
                  return 'No address provided';
                })()
              }),
            });
            const placeData = await placeRes.json().catch(() => ({}));
            if (!placeRes.ok || placeData?.ok === false) {
              toast.error(placeData?.msg || t('orders.orderFailed'));
              setPaying(false);
              return;
            }

            toast.success(t('payment.paymentSuccessful'));
            navigate('/orders');
          } catch (err) {
            toast.error(t('payment.unexpectedError'));
          }
          setPaying(false);
        },
        modal: { ondismiss: () => { setPaying(false); toast.info(t('payment.paymentCancelled')); } }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error(t('payment.initializationFailed'));
      setPaying(false);
    }
  };

  // Update cart item quantity (PATCH /clients/user/updatecart/:id)
  const [updatingQty, setUpdatingQty] = useState(false);
  const updateQuantity = async (newQty: number) => {
    if (!product) return;
    if (newQty < 1) return;
    try {
      setUpdatingQty(true);
      // Client-side stock validation before updating
      try {
        const prodRes = await fetch(apiUrl('/clients/products'), { credentials: 'include' });
        const prodJson = await prodRes.json().catch(() => ({}));
        const list = prodJson?.data || prodJson || [];
        const prod = Array.isArray(list) ? list.find((p: any) => String(p._id) === String(product.productId)) : null;
        let available = 0;
        if (prod) {
          // Try to match variant by size+color if available
          const variants = prod.variants || [];
          const match = variants.find((v: any) => v.size === product.size && v.color === product.color);
          if (match && typeof match.stock === 'number') available = Math.max(0, match.stock);
          if (!available && typeof prod.supply === 'number') available = Math.max(0, prod.supply);
          if (!available && prod.inStock === true) available = 1;
        }
        if (available > 0 && newQty > available) {
          toast.error(`Only ${available} in stock`);
          setUpdatingQty(false);
          return;
        }
      } catch (err) {
        console.warn('Stock check failed', err);
      }

      const res = await fetch(apiUrl(`/clients/user/updatecart/${product.id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ Qty: newQty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.msg || t('messages.failedToUpdate'));
        setUpdatingQty(false);
        return;
      }
      // keep UI in sync
      setProduct((prev) => prev ? { ...prev, quantity: newQty } : prev);
      toast.success(tr('cart.qtyUpdated', 'Quantity updated'));
    } catch (err) {
      console.error(err);
      toast.error(t('messages.somethingWentWrong'));
    }
    setUpdatingQty(false);
  };

  const [removing, setRemoving] = useState(false);
  const handleRemove = async () => {
    if (!product) return;
    try {
      // Use translation helper `tr` which falls back to the provided English string when key is missing
      if (!confirm(tr('cart.confirmRemove', 'Remove this item from cart?'))) return;
      setRemoving(true);
      const res = await fetch(apiUrl(`/clients/user/remove/${product.id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.msg || t('messages.failedToRemove'));
        setRemoving(false);
        return;
      }
      toast.success(t('cart.removed') || 'Item removed');
      navigate('/cart');
    } catch (err) {
      console.error(err);
      toast.error(t('messages.somethingWentWrong'));
    }
    setRemoving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-40 text-lg font-semibold text-gray-600 animate-pulse">{tr('common.loading','Loading...')}</div>;
  if (!product) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-50 via-pink-50 to-purple-100">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-12">
        <Card className="p-0 rounded-3xl shadow-2xl border border-purple-200 bg-white/70 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start p-4 md:p-6">
            {/* Image column */}
            <div onClick={() => navigate(`/product/${product.productId}`)} className="cursor-pointer md:col-span-1 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-lg">
              <img
                src={product.image || '/public/placeholder.svg'}
                alt={product.name}
                className="w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 object-contain rounded-lg shadow-md border border-gray-200 bg-white"
              />
            </div>

            {/* Details column */}
            <div className="md:col-span-1 flex flex-col justify-start p-2 md:p-0">
              <h2 onClick={() => navigate(`/product/${product.productId}`)} className="text-2xl md:text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent break-words cursor-pointer">{product.name}</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">{t('cart.brand')}: {product.brand}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{t('cart.color')}: {product.color}</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">{t('cart.size')}: {product.size}</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">{t('product.category')}: {product.category}</span>
              </div>
              <div className="text-gray-800 font-semibold text-lg md:text-2xl mb-2">{t('product.price')}: <span className="text-purple-700">₹{product.price.toFixed(2)}</span></div>
              <div className="text-gray-700 text-sm md:text-base mb-4 whitespace-pre-line break-words">{product.description}</div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center bg-gray-50 rounded-md border overflow-hidden">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(Math.max(1, product.quantity - 1))}
                    className="px-3 py-2 text-lg font-semibold disabled:opacity-50"
                    disabled={updatingQty}
                  >-
                  </button>
                  <div className="px-4 py-2 text-sm font-medium">{product.quantity}</div>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(product.quantity + 1)}
                    className="px-3 py-2 text-lg font-semibold disabled:opacity-50"
                    disabled={updatingQty}
                  >+
                  </button>
                </div>
              </div>

              {/* Mobile action bar (sticky) with payment method */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-white border-t border-gray-200 shadow-xl">
                  {/* Payment methods - Horizontal layout */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 flex-1 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                          className="w-4 h-4 text-[#D92030] focus:ring-[#D92030]"
                        />
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium text-sm whitespace-nowrap">{tr('payment.onlinePayment', 'Online Payment')}</span>
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">Razorpay</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 flex-1 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium text-sm whitespace-nowrap">{tr('payment.cod', 'Cash on Delivery')}</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">COD</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  {/* Buy button */}
                  <div className="p-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 text-white font-semibold transform hover:scale-[1.02] transition shadow-lg py-6 rounded-xl text-lg" 
                      onClick={handleBuy} 
                      disabled={loading || paying}
                    >
                      {paying ? tr('cart.processing','Processing...') : (paymentMethod === 'cod' ? tr('orders.placeOrderCOD','Place Order (COD)') : tr('product.buyNow','Buy Now'))}
                    </Button>
                  </div>
                </div>
                {/* Safe area spacing for iOS */}
                <div className="h-[env(safe-area-inset-bottom)] bg-white" />
              </div>
            </div>

            {/* Summary column (desktop) */}
            <aside className="hidden md:block md:col-span-1">
              <div className="p-4">
                <div className="bg-white border rounded-xl shadow p-4 sticky top-24">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500">{tr('cart.unitPrice','Unit price')}</div>
                    <div className="text-xl font-semibold">₹{product.price.toFixed(2)}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500">{tr('cart.quantity','Quantity')}</div>
                    <div className="text-lg font-medium">{product.quantity}</div>
                  </div>
                  <div className="mb-4 border-t pt-3">
                    <div className="text-sm text-gray-500">{tr('cart.subtotal','Subtotal')}</div>
                    <div className="text-2xl font-bold">₹{(product.price * product.quantity).toFixed(2)}</div>
                  </div>
                  <div className="mb-3 text-xs text-gray-500">{tr('cart.shippingNote','Shipping calculated at checkout')}</div>
                  
                  {/* Payment methods in desktop summary */}
                  <div className="mb-2 bg-gray-50 rounded-lg p-3">
                    <h3 className="font-semibold mb-2 text-gray-800">{tr('cart.paymentMethod', 'Payment Method')}</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod-desktop"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                          className="w-4 h-4 text-[#D92030] focus:ring-[#D92030]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tr('payment.onlinePayment', 'Online Payment')}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Razorpay</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod-desktop"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tr('payment.cod', 'Cash on Delivery')}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">COD</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 text-white font-semibold hover:scale-[1.02] transition" onClick={handleBuy} disabled={loading || paying}>
                      {paying ? tr('cart.processing','Processing...') : (paymentMethod === 'cod' ? tr('orders.placeOrderCOD','Place Order (COD)') : tr('product.buyNow','Buy Now'))}
                    </Button>
                    <Button variant="ghost" className="w-full text-red-600 border" onClick={handleRemove} disabled={removing}>{removing ? tr('common.removing','Removing...') : tr('cart.remove','Remove')}</Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SingleCartProduct;
