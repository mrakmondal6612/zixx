import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { useAuthContext } from '@/hooks/AuthProvider';
import { apiUrl } from '@/lib/api';
import { uuidv4 } from '@/lib/uuid';

interface CartItem {
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

const Buy: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const {user} = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
          const res = await fetch(apiUrl('/clients/user/getcart'), {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (res.status === 401) {
          toast.error('Please log in to buy products');
          navigate('/auth');
          return;
        }
        const data = await res.json();
        if (data.data) {
          const items = data.data.map((item: any) => ({
            id: item._id,
            productId: item.productId,
            name: item.title,
            gender: item.gender,
            category: item.category,
            theme: item.theme,
            description: item.description || '',
            color: item.color || '',
            size: item.size || '',
            price: item.price,
            quantity: item.Qty,
            image: Array.isArray(item.image) ? item.image[0] : item.image,
            brand: item.brand || '',
          }));
          setCartItems(items);
          setSelected(items.map((i: CartItem) => i.id)); // All selected by default
        } else {
          setCartItems([]);
        }
      } catch (err) {
        toast.error('Failed to load cart');
      }
      setLoading(false);
    };
    fetchCart();
  }, []);

  const ensureLoggedIn = () => {
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/auth');
        return false;
      }
      return true;
    };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handlePlaceOrderCOD = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one product to buy.');
      return;
    }
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/auth');
      return;
    }

    try {
      setPaying(true);
      
      // Place order with COD payment method
      const selectedItems = cartItems.filter((item) => selected.includes(item.id));
      const cartIds = selectedItems.map((it) => it.id);
      const placeRes = await fetch(apiUrl('/clients/order/buy-selected'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartIds,
          batchId: uuidv4(),
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

      toast.success('Order placed successfully! You will pay on delivery.');
      navigate('/orders');
    } catch (err) {
      toast.error('Failed to place order');
    }
    setPaying(false);
  };

  const handlePlaceOrder = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one product to buy.');
      return;
    }
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/auth');
      return;
    }

    // Handle COD payment
    if (paymentMethod === 'cod') {
      return handlePlaceOrderCOD();
    }

    // Razorpay flow for selected items
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
        toast.error('Razorpay SDK failed to load.');
        setPaying(false);
        return;
      }

      // Compute amount for selected items (sum of price * quantity)
      const selectedItems = cartItems.filter((item) => selected.includes(item.id));
      const amountInPaise = Math.round(selectedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0) * 100);
      if (amountInPaise <= 0) {
        toast.error('Invalid amount');
        setPaying(false);
        return;
      }

      // 1) Get key
      const keyRes = await fetch(apiUrl('/clients/payments/razorpay/key'), { credentials: 'include' });
      const keyData = await keyRes.json().catch(() => ({}));
      if (!keyRes.ok || !keyData?.key) {
        toast.error(keyData?.msg || 'Failed to get payment key');
        setPaying(false);
        return;
      }

      // 2) Create Razorpay order
      const orderRes = await fetch(apiUrl('/clients/payments/razorpay/order'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountInPaise, currency: 'INR', notes: { selectedCount: selectedItems.length } })
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
        prefill: { name: user?.name || '', email: user?.email || '', contact: '' },
        theme: { color: '#D92030' },
        handler: async (response: any) => {
          try {
            // 3) Verify signature
            const verifyRes = await fetch(apiUrl('/clients/payments/razorpay/verify'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
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

            // 4) Place one consolidated order for selected cart items
            const cartIds = selectedItems.map((it) => it.id);
            const placeRes = await fetch(apiUrl('/clients/order/buy-selected'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
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
              toast.error(placeData?.msg || 'Failed to place consolidated order');
              setPaying(false);
              return;
            }

            toast.success('Payment successful! Order placed.');
            navigate('/orders');
          } catch (err) {
            toast.error('Unexpected error after payment');
          }
          setPaying(false);
        },
        modal: { ondismiss: () => { setPaying(false); toast.info('Payment cancelled'); } }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error('Payment initialization failed');
      setPaying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow page-container pt-4 sm:pt-6 pb-8 sm:pb-16">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Select Products to Buy</h1>
        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
            <Button onClick={() => navigate('/')}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-white rounded-lg shadow-sm p-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => handleSelect(item.id)}
                    className="w-5 h-5 accent-[#D92030]"
                  />
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded-lg bg-gray-100" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-base truncate">{item.name}</h3>
                    <div className="text-xs text-gray-600">{item.brand} | {item.color} | {item.size}</div>
                  </div>
                  <div className="font-bold text-lg text-[#D92030]">₹{item.price.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">x{item.quantity}</div>
                </div>
              ))}
            </div>
            
            {/* Payment Method Selection */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border">
              <h3 className="font-semibold mb-3 text-gray-800">Payment Method</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                    className="w-4 h-4 text-[#D92030] focus:ring-[#D92030]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Online Payment</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Razorpay</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Cash on Delivery</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">COD</span>
                  </div>
                </label>
              </div>
            </div>

            <Button
              className="w-full bg-[#D92030] hover:bg-[#BC1C2A] py-3 text-base font-semibold rounded-lg"
              onClick={handlePlaceOrder}
              disabled={loading || paying}
            >
              {paying ? 'Processing...' : (loading ? 'Placing Order...' : (paymentMethod === 'cod' ? 'Place Order (COD)' : 'Place Order'))}
            </Button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Buy;
