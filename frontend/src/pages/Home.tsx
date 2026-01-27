import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import ProductCard from '@/components/ProductCard';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { DynamicBanner } from '@/components/sections/DynamicBanner';
import { apiUrl, getAuthHeaders } from '@lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthContext } from '@/hooks/AuthProvider';

interface Product {
  _id: string;
  title: string;
  price: number;
  discount: number;
  rating: string;
  category: string;
  subcategory: string;
  gender: string;
  theme: string;
  size: string;
  description: string;
  brand: string;
  image: string[];
  type?: string;
  stat?: any;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  supply?: number;
  stock?: number;
  color?: string;
}

interface Category {
  name: string;
  image: string;
  subcategories: string[];
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products'), { credentials: 'include' } );
        if (!res.ok) throw new Error("Failed to fetch products");
        const result = await res.json();
        if (result.ok) setProducts(result.data);
      } catch (err) {
        console.error('Error fetching all products:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products'), { credentials: 'include' } );
        if (!res.ok) throw new Error("Failed to fetch products for categories");
        const result = await res.json();
        if (result.ok) {
          const allProducts: Product[] = result.data;
          const categoriesMap: { [key: string]: { name: string; image: string; subcategories: Set<string> } } = {};
          allProducts.forEach((product: Product) => {
            const { category, subcategory, image } = product;
            if (!categoriesMap[category]) {
              categoriesMap[category] = {
                name: category,
                image: image?.[0] || '',
                subcategories: new Set<string>(),
              };
            }
            if (subcategory) categoriesMap[category].subcategories.add(subcategory);
          });

          const formatted: Category[] = Object.values(categoriesMap).map(cat => ({
            name: cat.name,
            image: cat.image,
            subcategories: Array.from(cat.subcategories),
          }));

          setCategories(formatted);
        }
      } catch (err) {
        console.error('Error generating categories:', err);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await axios.get(apiUrl('/clients/user/wishlist'), {
          withCredentials: true,
          headers: { ...getAuthHeaders() },
        });
        const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setWishlistIds(new Set(list.map((p) => String(p?._id)).filter(Boolean)));
      } catch (err: any) {
        if (err?.response?.status === 401) return;
        console.error('Failed to fetch wishlist', err);
      }
    };

    fetchWishlist();
  }, [user]);

  const ensureLoggedIn = () => {
    if (!user) {
      toast.error('You must be logged in.');
      navigate('/auth');
      return false;
    }
    return true;
  };

  const toggleWishlist = async (productId: string) => {
    if (!ensureLoggedIn()) return;

    const isIn = wishlistIds.has(productId);
    try {
      if (isIn) {
        const res = await axios.post(
          apiUrl('/clients/user/wishlist/remove'),
          { productId },
          { withCredentials: true, headers: { ...getAuthHeaders() } }
        );
        if (res.data?.ok || res.data?.success) {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          toast.success('Removed from wishlist');
        } else {
          toast.error(res.data?.msg || res.data?.message || 'Failed to remove from wishlist');
        }
      } else {
        const res = await axios.post(
          apiUrl('/clients/user/wishlist/add'),
          { productId },
          { withCredentials: true, headers: { ...getAuthHeaders() } }
        );
        if (res.data?.ok || res.data?.success) {
          setWishlistIds((prev) => new Set(prev).add(productId));
          toast.success('Added to wishlist');
        } else {
          toast.error(res.data?.msg || res.data?.message || 'Failed to add to wishlist');
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/auth');
      else toast.error(err?.response?.data?.msg || err?.response?.data?.message || 'Wishlist operation failed');
    }
  };

  const quickAddToCart = async (p: Product) => {
    if (!ensureLoggedIn()) return;

    // If this is a parent product with variants, try selecting the first active variant.
    const variants: any[] = Array.isArray((p as any).variants) ? (p as any).variants : [];
    const activeVariant = variants.find((v) => v && v.isActive) || variants[0] || null;
    const isParentProduct = Boolean((p as any).isParentProduct) && variants.length > 0;

    // If it needs selection and we cannot infer a usable variant, send user to product page.
    if (isParentProduct && !activeVariant) {
      toast.message('Please select options');
      navigate(`/product/${p._id}`);
      return;
    }

    const sizeRaw: any = activeVariant?.size ?? (p as any).size;
    const colorRaw: any = activeVariant?.color ?? (p as any).color;
    const size = String(Array.isArray(sizeRaw) ? (sizeRaw[0] || 'Free') : (sizeRaw || 'Free'));
    const color = String(Array.isArray(colorRaw) ? (colorRaw[0] || 'Default Color') : (colorRaw || 'Default Color'));

    const price = Number(activeVariant?.price ?? p.price ?? 0);
    const basePrice = Number(activeVariant?.basePrice ?? (p as any).basePrice ?? p.price ?? 0);

    const imageFromVariant = Array.isArray(activeVariant?.images)
      ? activeVariant.images.map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
      : [];
    const imageFromProduct = Array.isArray((p as any).image) ? (p as any).image : ((p as any).image ? [(p as any).image] : []);
    const imageArr: string[] = (imageFromVariant.length > 0 ? imageFromVariant : imageFromProduct);
    const safeImages = imageArr.length > 0 ? imageArr : ['https://via.placeholder.com/400x500?text=Product'];

    // Required fields by backend cart schema
    const Qty = 1;
    const cartData: any = {
      productId: p._id,
      title: p.title,
      description: (p as any).description || 'N/A',
      brand: (p as any).brand || 'N/A',
      gender: (p as any).gender || 'Unisex',
      category: (p as any).category || 'N/A',
      theme: (p as any).theme || 'N/A',
      rating: String((p as any).rating ?? '0'),

      price,
      basePrice,
      discount: activeVariant?.discount ?? (p as any).discount,
      tax: activeVariant?.tax ?? (p as any).tax,
      shippingCost: activeVariant?.shippingCost ?? (p as any).shippingCost,

      size,
      color,
      image: safeImages,

      Qty,
      afterQtyprice: price * Qty,
      total: price * Qty,
      variation: { size, color, quantity: Qty },
    };

    if (activeVariant?._id) {
      cartData.variantId = activeVariant._id;
      if (activeVariant?.sku) cartData.sku = activeVariant.sku;
    }

    try {
      const res = await axios.post(apiUrl('/clients/user/addtocart'), cartData, {
        withCredentials: true,
        headers: { ...getAuthHeaders() },
      });
      if (res.data?.ok || res.data?.success) {
        toast.success('Added to cart');
      } else {
        toast.error(res.data?.msg || res.data?.message || 'Failed to add to cart');
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.message('Already in cart');
        return;
      }
      if (err?.response?.status === 401) navigate('/auth');
      else toast.error(err?.response?.data?.msg || err?.response?.data?.message || 'Add to cart failed');
    }
  };
 
  const newArrivals = products.filter(p => p.theme?.toLowerCase().includes('new'));
  const bestSellers = products.filter(p => p.theme?.toLowerCase().includes('best'));

  const wishlistLookup = useMemo(() => wishlistIds, [wishlistIds]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <section className="relative mb-20">
          <DynamicBanner
            page="home"
            position="hero"
            fallback={{
              imageUrl: "",
              heading: "Summer Collection",
              description: "Light fabrics and vibrant colors for the perfect summer look.",
              linkText: "Shop Now",
              linkUrl: "/women",
            }}
            style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
          />
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-purple-200 dark:border-purple-800">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">🔥 Hot Deals</span>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-pink-200 dark:border-pink-800">
              <span className="text-pink-600 dark:text-pink-400 text-sm font-medium">✨ New Arrivals</span>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-20">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">DISCOVER</span>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine">Shop by Category</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <div key={index} className="group">
                <Link to={`/category/${category.name.toLowerCase()}`} className="block">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 relative overflow-hidden border border-purple-100 dark:border-purple-900">
                    <div className="aspect-square rounded-2xl overflow-hidden relative">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="text-white text-2xl font-black drop-shadow-lg">{category.name}</h3>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Explore →
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 px-2">
                  <ul className="text-sm space-y-2">
                    {Array.isArray(category.subcategories)
                      ? category.subcategories.map((sub, idx) => (
                          <li key={idx} className="transition-colors hover:text-purple-600 dark:hover:text-purple-400">
                            <Link to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase()}`}
                              className="flex items-center gap-2 group">
                              <span className="h-1 w-1 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-opacity"></span>
                              <span>{sub}</span>
                            </Link>
                          </li>
                        ))
                      : Array.from(category.subcategories as Set<string>).map((sub, idx) => (
                          <li key={idx} className="transition-colors hover:text-purple-600 dark:hover:text-purple-400">
                            <Link to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase()}`}
                              className="flex items-center gap-2 group">
                              <span className="h-1 w-1 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-opacity"></span>
                              <span>{sub}</span>
                            </Link>
                          </li>
                        ))
                    }
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
        <section className="mb-20">
          <div className="relative mb-12">
            <DynamicBanner
              page="home"
              position="new-arrivals"
              fallback={{
                imageUrl: "",
                heading: "Summer Collection",
                description: "Light fabrics and vibrant colors for the perfect summer look.",
                linkText: "Shop Now",
                linkUrl: "/women",
              }}
              style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
            />
            <div className="absolute -bottom-6 left-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-purple-200 dark:border-purple-800">
              <span className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">New Drops 🔥</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
            {newArrivals.map(p => (
              <ProductCard
                key={p._id}
                id={p._id}
                title={p.title}
                image={p.image?.[0]}
                price={p.price}
                discount={p.discount}
                badge={'New Arrival'}
                variant="home"
                isWishlisted={wishlistLookup.has(p._id)}
                onToggleWishlist={() => toggleWishlist(p._id)}
                onAddToCart={() => quickAddToCart(p)}
              />
            ))}
          </div>
        </section>
        )}

        {/* Featured Collection Banner */}
       {/* <section className="mb-20">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">TRENDING NOW</span>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine">Featured Collection</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>

          <DynamicBanner
            page="home"
            position="featured"
            fallback={{
              imageUrl: "https://res.cloudinary.com/dxtle1heo/image/upload/v1756038296/profile_pics/gatpp49d6jwhb9q2l6yv.png",
              heading: "Featured Collection",
              description: "Explore our curated selection of the season's must-haves.",
              linkText: "Shop Collection",
              linkUrl: "/men",
            }}
            style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
          />
        </section>
        )*/}

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
        <section className="mb-20">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">TOP PICKS</span>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine">Best Sellers</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
            {bestSellers.map(p => (
              <ProductCard
                key={p._id}
                id={p._id}
                title={p.title}
                image={p.image?.[0]}
                price={p.price}
                discount={p.discount}
                badge={'Best Seller'}
                variant="home"
                isWishlisted={wishlistLookup.has(p._id)}
                onToggleWishlist={() => toggleWishlist(p._id)}
                onAddToCart={() => quickAddToCart(p)}
              />
            ))}
          </div>
        </section>
        )}

        {/* Men's Collection Promo */}
       {/* <section className="mb-20">
          <div className="relative">
            <DynamicBanner
              page="home"
              position="men-promo"
              fallback={{
                imageUrl: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/d5b391a024519f0a274f617aaa8e815af74b7883?placeholderIfAbsent=true',
                heading: "Men's Collection",
                description: "Elevate your style with our versatile men's collection.",
                linkText: "Shop Now",
                linkUrl: "/men",
              }}
              style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
            />
            <div className="absolute -bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-purple-200 dark:border-purple-800">
              <span className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Men's Collection 👔</span>
            </div>
          </div>
        </section>
        )*/}

        {/* All Collection */}
        {products.length > 0 && (
          <section className="mb-20">
            <div className="flex flex-col items-center mb-12 text-center">
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">EXPLORE</span>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine">All Collection</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {products.map(p => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  image={p.image?.[0]}
                  price={p.price}
                  discount={p.discount}
                  badge={p.theme?.toLowerCase().includes('best') ? 'Best Seller' : p.theme?.toLowerCase().includes('new') ? 'New Arrival' : undefined}
                  variant="home"
                  isWishlisted={wishlistLookup.has(p._id)}
                  onToggleWishlist={() => toggleWishlist(p._id)}
                  onAddToCart={() => quickAddToCart(p)}
                />
              ))}
            </div>
          </section>
        )}


      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Home;
