import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/button';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { toast } from 'sonner';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import { uuidv4 } from '@/lib/uuid';
import { Minus, Plus, Trash2, ShoppingBag, ChevronDown } from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  sku?: string;
  name: string;
  price: number; // Final calculated price
  basePrice?: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  brand: string;
  category?: string;
  discount?: {
    type: 'percentage' | 'fixed' | 'coupon';
    value: number;
  } | number; // Can be object or number (legacy)
  tax?: {
    type: 'free' | 'percentage';
    value: number;
  };
  shippingCost?: {
    type: 'free' | 'fixed';
    value: number;
  };
  inStock?: boolean;
}

interface Product {
  _id: string;
  title: string;
  price: number; // Final calculated price
  basePrice?: number;
  image: string | string[];
  discount?: {
    type: 'percentage' | 'fixed' | 'coupon';
    value: number;
  } | number;
  category?: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [modalAutoTriggered, setModalAutoTriggered] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [addrForm, setAddrForm] = useState({
    personal_address: '',
    shoping_address: '',
    billing_address: '',
    address_village: '',
    landmark: '',
    city: '',
    state: '',
    country: '',
    zip: '',
  });

  // Refs for auto-focus
  const refPersonal = useRef<HTMLTextAreaElement | null>(null);
  const refVillage = useRef<HTMLInputElement | null>(null);
  const refCity = useRef<HTMLInputElement | null>(null);
  const refState = useRef<HTMLInputElement | null>(null);
  const refCountry = useRef<HTMLInputElement | null>(null);
  const refZip = useRef<HTMLInputElement | null>(null);
  const refLandmark = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchCart();
    fetchRecommendedProducts();
  }, []);

  // Fetch recommended products (top selling and new arrivals)
  const fetchRecommendedProducts = async () => {
    try {
      const res = await fetch(apiUrl('/clients/products'), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data?.data && Array.isArray(data.data)) {
        const products = data.data;
        // Get random products for recommendations
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        setTopSellingProducts(shuffled.slice(0, 4)); // First 4 for top selling
        setNewArrivals(shuffled.slice(4, 8)); // Next 4 for new arrivals
      }
    } catch (err) {
      console.error('Failed to fetch recommended products:', err);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/clients/user/getcart'), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      if (res.status === 401) {
        toast.error(t('auth.pleaseLoginToContinue'));
        navigate('/auth');
        return;
      }

      const data = await res.json();
      if (data?.data) {
        setCartItems(data.data.map((item: any) => ({
          id: item._id,
          productId: item.productId,
          variantId: item.variantId || null,
          sku: item.sku || null,
          name: item.title,
          price: item.price, // Final calculated price
          basePrice: item.basePrice || item.price,
          quantity: item.Qty,
          image: Array.isArray(item.image) ? item.image[0] : item.image,
          size: item.size || 'Standard',
          color: item.color || 'Default',
          brand: item.brand || 'Generic',
          category: item.category,
          discount: item.discount,
          tax: item.tax,
          shippingCost: item.shippingCost,
          inStock: item.inStock !== false
        })));
      }
    } catch (err) {
      toast.error(t('messages.failedToLoadCart'));
    }
    setLoading(false);
  };



  const ensureLoggedIn = () => {
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/auth');
      return false;
    }
    return true;
  };

  // safe confirmation that falls back to english text when translation key is missing
  const safeConfirm = (key: string, fallback: string) => {
    try {
      const val = t(key);
      const message = val && val !== key ? val : fallback;
      return confirm(message);
    } catch {
      return confirm(fallback);
    }
  };

  const isProfileComplete = (u: any): boolean => {
    if (!u) return false;
    const address = typeof u.address === 'string' ? (() => { try { return JSON.parse(u.address); } catch { return {}; } })() : (u.address || {});
    const required = [
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.gender,
      u.dob,
      address.city,
      address.state,
      address.country,
      address.zip,
      address.address_village,
    ];
    return required.every((v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).toLowerCase() !== 'n/a');
  };

  const profileComplete = isProfileComplete(user);
  const addressObj = (() => {
    if (!user) return {} as any;
    let a: any = user.address || {};
    if (typeof a === 'string') {
      try { a = JSON.parse(a); } catch { a = {}; }
    }
    return a || {};
  })();

  // Auto-open address modal if profile incomplete (only once per visit)
  useEffect(() => {
    if (!user) return;
    if (profileComplete) return;
    if (modalAutoTriggered) return;
    setShowAddrModal(true);
    setModalAutoTriggered(true);
  }, [user, profileComplete, modalAutoTriggered]);

  // Prefill address form when user or address changes
  useEffect(() => {
    setAddrForm({
      personal_address: addressObj.personal_address || '',
      shoping_address: addressObj.shoping_address || '',
      billing_address: addressObj.billing_address || '',
      address_village: addressObj.address_village || '',
      landmark: addressObj.landmark || '',
      city: addressObj.city || '',
      state: addressObj.state || '',
      country: addressObj.country || '',
      zip: addressObj.zip || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-focus the first missing field when modal opens
  useEffect(() => {
    if (!showAddrModal) return;
    // Delay to ensure modal inputs are mounted, then focus first empty field
    setTimeout(() => {
      const order: Array<{ key: keyof typeof addrForm; ref: React.RefObject<any> }> = [
        { key: 'personal_address', ref: refPersonal },
        { key: 'address_village', ref: refVillage },
        { key: 'city', ref: refCity },
        { key: 'state', ref: refState },
        { key: 'zip', ref: refZip },
        { key: 'country', ref: refCountry },
        { key: 'landmark', ref: refLandmark },
      ];
      const firstMissing = order.find(({ key }) => !String((addrForm as any)[key] || '').trim());
      const targetRef = firstMissing?.ref || refPersonal;
      if (targetRef.current) {
        targetRef.current.focus();
      }
    }, 100);
  }, [showAddrModal]);

  const onAddrChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAddrForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureLoggedIn()) return;
    setAddrSaving(true);
    try {
      const form = new FormData();
      if (addrForm.personal_address) form.append('personal_address', addrForm.personal_address);
      if (addrForm.shoping_address) form.append('shoping_address', addrForm.shoping_address);
      if (addrForm.billing_address) form.append('billing_address', addrForm.billing_address);
      if (addrForm.address_village) form.append('address_village', addrForm.address_village);
      if (addrForm.landmark) form.append('landmark', addrForm.landmark);
      if (addrForm.city) form.append('city', addrForm.city);
      if (addrForm.state) form.append('state', addrForm.state);
      if (addrForm.country) form.append('country', addrForm.country);
      if (addrForm.zip) form.append('zip', addrForm.zip);

      const res = await fetch(apiUrl('/clients/user/me'), { 
        method: 'PATCH', 
        body: form, 
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) {
        if (res.status === 401) {
          toast.error('Session expired, please log in again');
          navigate('/auth');
          return;
        }
        toast.error(data?.msg || 'Failed to update address');
        setAddrSaving(false);
        return;
      }
      setUser(data.user);
      toast.success('Address updated successfully');
      setShowAddrModal(false);
    } catch (err) {
      console.error('Address update error:', err);
      toast.error('Address update failed');
    }
    setAddrSaving(false);
  };

  const removeItem = async (id: string) => {
    if (!ensureLoggedIn()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/clients/user/remove/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.msg === 'Product Removed') {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
        toast.success('Item removed from cart');
      } else {
        toast.error(data?.msg || 'Failed to remove item');
      }
    } catch {
      toast.error('Error removing item');
    }
    setLoading(false);
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (!ensureLoggedIn()) return;
    if (newQuantity < 1) return;
    setLoading(true);
    try {
      // Client-side stock validation: fetch product list and determine available stock
      const currentItem = cartItems.find(c => c.id === id);
      if (currentItem && newQuantity > currentItem.quantity) {
        try {
          const prodRes = await fetch(apiUrl('/clients/products'), { credentials: 'include' });
          const prodJson = await prodRes.json().catch(() => ({}));
          const list = prodJson?.data || prodJson || [];
          const prod = Array.isArray(list) ? list.find((p: any) => String(p._id) === String(currentItem.productId)) : null;
          let available = 0;
          if (prod) {
            // prefer variantId or sku or size+color
            if (currentItem.variantId || currentItem.sku || (currentItem.size && currentItem.color)) {
              const variants = prod.variants || [];
              const match = variants.find((v: any) => (
                (currentItem.variantId && String(v._id) === String(currentItem.variantId)) ||
                (currentItem.sku && v.sku === currentItem.sku) ||
                (v.size === currentItem.size && v.color === currentItem.color)
              ));
              if (match && typeof match.stock === 'number') available = Math.max(0, match.stock);
            }
            // fallback to product-level supply
            if (!available && typeof prod.supply === 'number') available = Math.max(0, prod.supply);
            if (!available && prod.inStock === true) available = 1;
          }

          if (available > 0 && newQuantity > available) {
            toast.error(`Only ${available} in stock`);
            setLoading(false);
            return;
          }
        } catch (err) {
          // fail open: if product check fails, allow server to validate
          console.warn('Stock check failed', err);
        }
      }

      const res = await fetch(apiUrl(`/clients/user/updatecart/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ Qty: newQuantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.msg === 'Cart updated') {
        setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)));
        toast.success('Quantity updated');
      } else {
        toast.error(data?.msg || 'Failed to update quantity');
      }
    } catch {
      toast.error('Error updating quantity');
    }
    setLoading(false);
  };

  const buyProductsCOD = async () => {
    if (!ensureLoggedIn()) return;
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // Enforce profile completion before checkout
    if (!isProfileComplete(user)) {
      setShowAddrModal(true);
      toast.info('Add your shipping address to continue.');
      return;
    }

    try {
      setPaying(true);
      
      // Place order with COD payment method
      const cartIds = cartItems.map((it) => it.id);
    const placeRes = await fetch(apiUrl('/clients/order/buy-selected'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
      cartIds,
      batchId: uuidv4(),
          shippingAddress: (() => {
            const addr = user?.address || {};
            if (typeof addr === 'string') {
              try { return JSON.parse(addr); }
              catch { return {}; }
            }
            return addr;
          })(),
          paymentDetails: {
            provider: 'cod',
            paymentStatus: 'pending'
          }
        })
      });
      const placeData = await placeRes.json().catch(() => ({}));
      if (!placeRes.ok || placeData?.ok !== true) {
        toast.error(placeData?.msg || 'Failed to place order');
        setPaying(false);
        return;
      }

      setCartItems([]);
      toast.success('Order placed successfully! You will pay on delivery.');
      navigate('/orders');
    } catch (err) {
      toast.error('Failed to place order');
    }
    setPaying(false);
  };

  const buyProducts = async () => {
    if (!ensureLoggedIn()) return;
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // Enforce profile completion before checkout
    if (!isProfileComplete(user)) {
      setShowAddrModal(true);
      toast.info('Add your shipping address to continue.');
      return;
    }

    // Handle COD payment
    if (paymentMethod === 'cod') {
      return buyProductsCOD();
    }

    // Razorpay flow
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
        toast.error('Razorpay SDK failed to load. Check your network.');
        setPaying(false);
        return;
      }

      // 1) Get key
      const keyRes = await fetch(apiUrl('/clients/payments/razorpay/key'), { credentials: 'include', headers: { ...getAuthHeaders() } });
      const keyData = await keyRes.json().catch(() => ({}));
      if (!keyRes.ok || !keyData?.key) {
        toast.error(keyData?.msg || 'Failed to get payment key');
        setPaying(false);
        return;
      }

      // 2) Create order in backend (amount in paise)
      const amountInPaise = Math.round((subtotal + shipping + tax) * 100);
      const orderRes = await fetch(apiUrl('/clients/payments/razorpay/order'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ amountInPaise, currency: 'INR', notes: { cartCount: cartItems.length } })
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData?.order?.id) {
        toast.error(orderData?.msg || 'Failed to initiate payment');
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
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
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
              toast.error(verifyData?.msg || 'Payment verification failed');
              setPaying(false);
              return;
            }

            // 4) Place one consolidated order for all cart items
            const cartIds = cartItems.map((it) => it.id);
            const placeRes = await fetch(apiUrl('/clients/order/buy-selected'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({
                cartIds,
                batchId: uuidv4(),
                paymentDetails: {
                  provider: 'razorpay',
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id
                }
              })
            });
            const placeData = await placeRes.json().catch(() => ({}));
            if (!placeRes.ok || placeData?.ok !== true) {
              toast.error(placeData?.msg || 'Failed to place order after payment');
              setPaying(false);
              return;
            }

            setCartItems([]);
            toast.success('Payment successful! Order placed.');
            navigate('/orders');
          } catch (err) {
            toast.error('Unexpected error after payment');
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      console.error(e);
      toast.error('Payment initialization failed');
      setPaying(false);
    }
  };

  const applyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    if (promoCode.toLowerCase() === 'save10') {
      toast.success('Promo code applied! 10% discount');
    } else {
      toast.error('Invalid promo code');
    }
  };


  // Calculate pricing breakdown from cart items
  const baseSubtotal = cartItems.reduce((sum, item) => {
    const basePrice = item.basePrice || item.price;
    return sum + (basePrice * item.quantity);
  }, 0);

  const totalTax = cartItems.reduce((sum, item) => {
    if (item.tax && item.tax.type === 'percentage' && item.tax.value > 0) {
      const basePrice = item.basePrice || item.price;
      return sum + ((basePrice * item.quantity * item.tax.value) / 100);
    }
    return sum;
  }, 0);

  const totalShipping = cartItems.reduce((sum, item) => {
    if (item.shippingCost && item.shippingCost.type === 'fixed' && item.shippingCost.value > 0) {
      return sum + (item.shippingCost.value * item.quantity);
    }
    return sum;
  }, 0);

  const totalDiscount = cartItems.reduce((sum, item) => {
    const basePrice = item.basePrice || item.price;
    const itemBaseTotal = basePrice * item.quantity;
    
    if (item.discount && typeof item.discount === 'object') {
      if (item.discount.type === 'percentage' && item.discount.value > 0) {
        const priceWithTax = itemBaseTotal + ((itemBaseTotal * (item.tax?.value || 0)) / 100);
        return sum + ((priceWithTax * item.discount.value) / 100);
      } else if (item.discount.type === 'fixed' && item.discount.value > 0) {
        return sum + (item.discount.value * item.quantity);
      }
    } else if (typeof item.discount === 'number' && item.discount > 0) {
      // Legacy discount format
      const priceWithTax = itemBaseTotal + ((itemBaseTotal * (item.tax?.value || 0)) / 100);
      return sum + ((priceWithTax * item.discount) / 100);
    }
    return sum;
  }, 0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = totalShipping;
  const tax = totalTax;
  const discount = totalDiscount;
  const total = subtotal;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-[#121212]">
      <Header />
      
      <main className="flex-grow page-container pt-4 sm:pt-6 pb-8 sm:pb-16">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent animate-text-shine mb-4 sm:mb-6 tracking-tight">{t('cart.title')}</h1>
        {user && !profileComplete && !bannerDismissed && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{t('header.completeProfile')}</p>
              <p className="text-xs sm:text-sm">{t('header.completeProfileDesc')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/account?completeProfile=1" className="px-3 py-2 rounded-md bg-[#D92030] text-white hover:bg-[#BC1C2A] text-xs sm:text-sm">{t('header.updateNow')}</Link>
              <button onClick={() => setBannerDismissed(true)} className="px-3 py-2 rounded-md border border-yellow-300 text-yellow-800 hover:bg-yellow-100 text-xs sm:text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Cart Items */}
          <div className="flex-grow">
            {cartItems.length > 0 ? (
              <>
                <div className="bg-white/80 dark:bg-[#1E1E1E] backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden border border-white/20">
                  <div className="space-y-0">
                    {cartItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex flex-row gap-2 p-2 sm:p-3 cursor-pointer hover:bg-white/40 dark:hover:bg-[#2A2A2A] transition-all duration-300 ease-out ${index < cartItems.length - 1 ? 'border-b border-gray-200/50 dark:border-gray-700/50' : ''}`}
                        onClick={() => navigate(`/cart/product/${item.id}`)}
                      >
                        {/* Product Image */}
                        <div className="relative group w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex-shrink-0 overflow-hidden image-container transform transition-transform duration-300 hover:scale-105">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain product-image group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-col gap-1">
                            {/* Title and Price */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm sm:text-base line-clamp-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="font-bold text-base sm:text-lg text-purple-600">₹{item.price.toFixed(2)}</span>
                                {(() => {
                                  const discount = item.discount;
                                  if (discount && typeof discount === 'object' && discount.value > 0) {
                                    if (discount.type === 'percentage') {
                                      return <span className="text-xs font-medium text-green-600">-{discount.value}%</span>;
                                    } else if (discount.type === 'fixed') {
                                      return <span className="text-xs font-medium text-green-600">-₹{discount.value}</span>;
                                    }
                                  } else if (typeof discount === 'number' && discount > 0) {
                                    return <span className="text-xs font-medium text-green-600">-{discount}%</span>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>

                            {/* Specs and Tags */}
                            <div className="flex flex-wrap items-center gap-1 text-xs">
                              <span className="px-1.5 py-0.5 rounded bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{item.brand}</span>
                              <span className="px-1.5 py-0.5 rounded bg-pink-100/50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">{item.color}</span>
                              <span className="px-1.5 py-0.5 rounded bg-orange-100/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{item.size}</span>
                              {item.sku && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono text-[10px]" title="SKU">SKU: {item.sku}</span>
                              )}
                              {item.inStock && (
                                <span className="px-1.5 py-0.5 rounded bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300">In Stock</span>
                              )}
                            </div>

                            {/* Delivery Info */}
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] sm:text-xs font-medium text-green-500 dark:text-green-400 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                                Delivery by {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <span className="text-[10px] text-gray-500">Fulfilled by Zixx</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-0.5 rounded-lg overflow-hidden shadow-sm backdrop-blur-lg" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-md transition-all duration-300 text-gray-800 dark:text-gray-200"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} className="transform hover:scale-110 transition-transform" />
                              </button>
                              <span className="px-3 py-1.5 font-bold bg-white/50 dark:bg-black/20 text-xs mx-0.5 rounded-md">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-md transition-all duration-300 text-gray-800 dark:text-gray-200"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} className="transform hover:scale-110 transition-transform" />
                              </button>
                            </div>
                            <button 
                              onClick={e => { e.stopPropagation(); if (safeConfirm('cart.confirmRemove', 'Remove this item from cart?')) removeItem(item.id); }}
                              className="flex items-center gap-1.5 text-red-500 hover:text-red-600 bg-red-100/50 dark:bg-red-900/20 px-2 py-1.5 rounded-lg transition-all duration-300 w-fit transform hover:scale-105"
                              disabled={loading}
                            >
                              <Trash2 size={12} />
                              <span className="text-xs font-bold">{t('common.remove')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center sm:text-right font-extrabold text-lg sm:text-2xl my-4 sm:my-6 bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 rounded-2xl shadow-lg p-4 border-2 border-white/60 animate-gradient-x">
                  <span className="uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow">{t('cart.subtotal')}</span>
                  <span className="ml-2 text-pink-600 animate-pulse">({cartItems.length} {t('cart.items')}): ₹{subtotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm spacing-md">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">{t('cart.empty')}</h2>
                <p className="mb-6 sm:mb-8 text-gray-600 text-sm sm:text-base">{t('cart.emptyDesc')}</p>
                <Link to="/">
                  <Button className="bg-[#D92030] hover:bg-[#BC1C2A] px-6 py-3">{t('cart.continueShopping')}</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="w-full lg:w-[400px] flex-shrink-0 mt-4 lg:mt-0">
              <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-3xl shadow-xl p-4 lg:sticky lg:top-28 border-2 border-white/60">
                <h2 className="font-black text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow">{t('cart.orderSummary')}</h2>
                
                {/* Detailed Price Breakdown */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-600">Base Subtotal ({cartItems.length} items)</span>
                    <span className="font-bold">₹{baseSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm font-medium text-green-700">
                      <span className="flex items-center gap-1">
                        <span>+ Tax (GST)</span>
                      </span>
                      <span className="font-bold">₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totalShipping > 0 && (
                    <div className="flex justify-between text-sm font-medium text-blue-700">
                      <span className="flex items-center gap-1">
                        <span>+ {t('cart.shipping')}</span>
                      </span>
                      <span className="font-bold">₹{totalShipping.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm font-medium text-red-600">
                      <span className="flex items-center gap-1">
                        <span>- Discount</span>
                      </span>
                      <span className="font-bold">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totalShipping === 0 && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">{t('cart.shipping')}</span>
                      <span className="font-bold text-green-600">FREE</span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-dashed border-pink-300 pt-2 flex justify-between font-black text-lg">
                    <span className="uppercase tracking-wide text-indigo-700">{t('cart.total')}</span>
                    <span className="text-pink-600 animate-pulse">₹{total.toFixed(2)}</span>
                  </div>
                  
                  {/* Savings Display */}
                  {totalDiscount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-700 font-medium">🎉 You're saving</span>
                        <span className="text-green-700 font-bold">₹{totalDiscount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Address Summary */}
                {user && profileComplete ? (
                  <div className="mb-3 bg-white/60 rounded-xl p-3 border border-white/80">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-gray-700">{t('cart.shippingAddress')}</div>
                      <button onClick={() => setShowAddrModal(true)} className="text-xs text-[#D92030] hover:underline">{t('cart.editAddress')}</button>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ')}, 
                      {addressObj.personal_address ? ` ${addressObj.personal_address}, ` : ' '}
                      {[addressObj.city, addressObj.state, addressObj.zip].filter(Boolean).join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-2 text-xs">
                    {t('cart.addShippingAddress')} <button onClick={() => setShowAddrModal(true)} className="underline font-medium">{t('cart.title')}</button>
                  </div>
                )}

                {/* Compact Promo Code */}
                <form onSubmit={applyPromoCode} className="mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('cart.promoCode')}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-3 py-2 bg-white/60 border border-transparent rounded-xl focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
                    >
                      {t('cart.apply')}
                    </button>
                  </div>
                </form>

                {/* Payment Method Selection - Compact */}
                <div className="mb-3 bg-white/60 rounded-xl p-3 border border-white/80">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-white/50 p-2 rounded-lg hover:bg-white/80 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                        className="w-3 h-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Online Payment</span>
                        <span className="text-[10px] text-purple-700">Razorpay</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white/50 p-2 rounded-lg hover:bg-white/80 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                        className="w-3 h-3 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Cash on Delivery</span>
                        <span className="text-[10px] text-green-700">COD</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#FF0080] py-3 text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 border border-white/10 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  onClick={buyProducts}
                  disabled={cartItems.length === 0 || paying}
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag size={16} className="animate-bounce" />
                    <span>
                      {paying ? t('cart.processing') : (profileComplete ? (paymentMethod === 'cod' ? 'Place Order (COD)' : t('cart.buyProducts')) : t('cart.completeProfileToCheckout'))}
                    </span>
                  </span>
                </Button>
                {!profileComplete && (
                  <div className="text-xs text-yellow-900 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
                    {t('messages.addShippingAddressToContinue')}
                  </div>
                )}
                
                {/* Categories Section with Separate Images */}
                <div className="border-t-2 pt-4 sm:pt-6">
                  
                  {/* Service Features */}
                  <div className="responsive-grid-3 gap-3 text-center">
                    <div>
                      <div className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-xs font-medium">{t('cart.freeDelivery')}</p>
                    </div>
                    <div>
                      <div className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 9.35v5.3a.5.5 0 00.78.42l4.5-2.65a.5.5 0 000-.84l-4.5-2.65a.5.5 0 00-.78.42z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-xs font-medium">{t('cart.customerService')}</p>
                    </div>
                    <div>
                      <div className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-xs font-medium">{t('cart.moneyBack')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Top Selling Products Section */}
        <section className="mt-12 sm:mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-pink-100/20 to-purple-100/20 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-purple-900/10 rounded-3xl backdrop-blur-3xl -z-10" />
          <h2 className="text-2xl sm:text-4xl font-black text-center mb-8 sm:mb-12 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine tracking-tight">{t('product.topSelling')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {topSellingProducts.map((product, index) => (
              <div key={product._id || index} className="group bg-white/80 dark:bg-[#1E1E1E]/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden transform hover:scale-[1.02]">
                <Link to={`/product/${product._id}`} className="block p-3">
                  <div className="aspect-square bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 mb-4 rounded-xl overflow-hidden relative">
                    <img 
                      src={Array.isArray(product.image) ? product.image[0] : product.image || `https://source.unsplash.com/400x400/${(product.category || 'fashion').replace(/\s+/g, '+')}`} 
                      alt={product.title} 
                      className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:to-purple-600 transition-all duration-300">{product.title}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-base sm:text-xl bg-gradient-to-br from-purple-600 to-pink-500 bg-clip-text text-transparent">₹{product.price}</div>
                    {(() => {
                      const discount = product.discount;
                      if (discount && typeof discount === 'object' && discount.value > 0 && discount.type === 'percentage') {
                        return (
                          <div className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <span className="text-xs font-bold text-pink-600 dark:text-pink-400">-{discount.value}%</span>
                          </div>
                        );
                      } else if (typeof discount === 'number' && discount > 0) {
                        return (
                          <div className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <span className="text-xs font-bold text-pink-600 dark:text-pink-400">-{discount}%</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* NEW ARRIVALS Section */}
        <section className="mt-16 sm:mt-24 relative pb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-pink-100/20 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-3xl backdrop-blur-3xl -z-10" />
          <div className="flex items-center justify-center gap-3 mb-8 sm:mb-12">
            <span className="inline-block w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <h2 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-text-shine tracking-tight">{t('product.newArrivals')}</h2>
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map((product, index) => (
              <div key={product._id || index} className="group bg-white/80 dark:bg-[#1E1E1E]/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden transform hover:scale-[1.02]">
                <Link to={`/product/${product._id}`} className="block p-3">
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-pink-100/50 to-purple-100/50 dark:from-pink-900/20 dark:to-purple-900/20 mb-4 rounded-xl overflow-hidden">
                      <img 
                        src={Array.isArray(product.image) ? product.image[0] : product.image || `https://source.unsplash.com/400x400/${(product.category || 'fashion').replace(/\s+/g, '+')}`} 
                        alt={product.title} 
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-3 animate-pulse">
                      NEW
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">{product.title}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-base sm:text-xl bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent">₹{product.price}</div>
                    {(() => {
                      const discount = product.discount;
                      if (discount && typeof discount === 'object' && discount.value > 0 && discount.type === 'percentage') {
                        return (
                          <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">-{discount.value}%</span>
                          </div>
                        );
                      } else if (typeof discount === 'number' && discount > 0) {
                        return (
                          <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">-{discount}%</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      {/* Address Edit Modal */}
      {showAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{t('address.editShippingAddress')}</h3>
              <button onClick={() => setShowAddrModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <form onSubmit={saveAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.personalAddress')} *</label>
                <textarea 
                  ref={refPersonal} 
                  name="personal_address" 
                  rows={4} 
                  placeholder={t('address.personalAddressPlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                  value={addrForm.personal_address} 
                  onChange={onAddrChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.village')} *</label>
                  <input 
                    ref={refVillage} 
                    name="address_village" 
                    type="text"
                    placeholder={t('address.villagePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.address_village} 
                    onChange={onAddrChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.landmark')}</label>
                  <input 
                    ref={refLandmark} 
                    name="landmark" 
                    type="text"
                    placeholder={t('address.landmarkPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.landmark} 
                    onChange={onAddrChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.city')} *</label>
                  <input 
                    ref={refCity} 
                    name="city" 
                    type="text"
                    placeholder={t('address.cityPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.city} 
                    onChange={onAddrChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.state')} *</label>
                  <input 
                    ref={refState} 
                    name="state" 
                    type="text"
                    placeholder={t('address.statePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.state} 
                    onChange={onAddrChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.country')} *</label>
                  <input 
                    ref={refCountry} 
                    name="country" 
                    type="text"
                    placeholder={t('address.countryPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.country} 
                    onChange={onAddrChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.zipCode')} *</label>
                  <input 
                    ref={refZip} 
                    name="zip" 
                    type="text"
                    placeholder={t('address.zipPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all" 
                    value={addrForm.zip} 
                    onChange={onAddrChange}
                    required
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{t('common.note')}:</span> {t('address.requiredNote')}
                </p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddrModal(false)} 
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  disabled={addrSaving}
                >
                  {t('common.cancel')}
                </button>
                <Button 
                  type="submit" 
                  className="bg-[#D92030] hover:bg-[#BC1C2A] px-6 py-2" 
                  disabled={addrSaving}
                >
                  {addrSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('address.saving')}
                    </>
                  ) : (
                    t('address.saveAddress')
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Cart;
