import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { ReviewSection } from '@/components/ReviewSection';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Heart, ShoppingCart, Star, Plus, Minus, Truck, RotateCcw, Share2, X, ChevronLeft, ChevronRight, Maximize2, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthContext } from '@/hooks/AuthProvider';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import Thumbnail from '@/components/ui/Thumbnail';

// Setup axios
axios.defaults.withCredentials = true;

interface VariantType {
  _id: string;
  sku: string;
  size?: string;
  color?: string;
  variantAttributes?: Record<string, string>;
  basePrice: number;
  price: number;
  stock: number;
  images?: Array<{ url: string; caption?: string; alt?: string; order?: number }>;
  isActive: boolean;
  tax?: {
    type: 'free' | 'percentage';
    value: number;
  };
  shippingCost?: {
    type: 'free' | 'fixed';
    value: number;
  };
  discount?: {
    type: 'percentage' | 'fixed' | 'coupon';
    value: number;
  } | number;
}

interface ProductType {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  basePrice?: number; // Original product price
  price: number; // Final calculated price
  tax?: {
    type: 'free' | 'percentage';
    value: number;
  };
  shippingCost?: {
    type: 'free' | 'fixed';
    value: number;
  };
  discount?: {
    type: 'percentage' | 'fixed' | 'coupon';
    value: number;
  } | number; // Can be object (new schema) or number (legacy)
  oldPrice?: number;
  image?: string[];
  size?: string[];
  color?: string[];
  subcategory?: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  gender?: string;
  category?: string;
  theme?: string;
  isWishlisted?: boolean;
  afterQtyprice?: number;
  features?: string[];
  variation?: {
    size: string;
    color: string;
    quantity: number;
  };
  // backend field for stock quantity
  supply?: number;
  // Variant support
  isParentProduct?: boolean;
  variants?: VariantType[];
  parentProductId?: string;
}

// Helper function to render formatted text
const formatDescription = (text: string) => {
  if (!text) return null;
  
  return text.split('\n').map((line, index) => {
    // Replace **text** with bold
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace *text* with italic
    formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Replace • or - at start with bullet point
    formattedLine = formattedLine.replace(/^[•\-]\s*/, '• ');
    
    return (
      <span key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} className="block" />
    );
  });
};

// Helper function to find matching variant based on size and color
const findMatchingVariant = (
  product: ProductType,
  size?: string,
  color?: string,
  prefer?: 'size' | 'color'
): VariantType | null => {
  if (!product.variants || product.variants.length === 0) return null;
  
  const activeVariants = product.variants.filter(v => v.isActive);
  
  // If both size and color are selected, find exact match
  if (size && color) {
    const exact = activeVariants.find(v => v.size === size && v.color === color);
    if (exact) return exact;
    // Fallback: if combination doesn't exist, prefer the attribute user changed last.
    if (prefer === 'color') {
      const byColor = activeVariants.find(v => v.color === color);
      if (byColor) return byColor;
      const bySize = activeVariants.find(v => v.size === size);
      if (bySize) return bySize;
    } else {
      const bySize = activeVariants.find(v => v.size === size);
      if (bySize) return bySize;
      const byColor = activeVariants.find(v => v.color === color);
      if (byColor) return byColor;
    }
    return null;
  }
  
  // If only size selected, find first variant with that size
  if (size && !color) {
    return activeVariants.find(v => v.size === size) || null;
  }
  
  // If only color selected, find first variant with that color
  if (color && !size) {
    return activeVariants.find(v => v.color === color) || null;
  }
  
  // If neither selected, return first active variant
  return activeVariants[0] || null;
};

// Helper function to get available sizes for current color selection
const getAvailableSizes = (product: ProductType, selectedColor?: string): string[] => {
  if (!product.isParentProduct || !product.variants) {
    return product.size || [];
  }
  
  const variants = product.variants.filter(v => v.isActive);
  // Show all available sizes from active variants regardless of selected color
  return [...new Set(variants.map(v => v.size).filter(Boolean) as string[])];
};

// Helper function to get available colors for current size selection
const getAvailableColors = (product: ProductType, selectedSize?: string): string[] => {
  if (!product.isParentProduct || !product.variants) {
    return product.color || [];
  }
  
  const variants = product.variants.filter(v => v.isActive);
  // Show all available colors from active variants regardless of selected size
  return [...new Set(variants.map(v => v.color).filter(Boolean) as string[])];
};

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [parentProduct, setParentProduct] = useState<ProductType | null>(null);
  const [childProductsList, setChildProductsList] = useState<ProductType[]>([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);
  const [lastVariantAxis, setLastVariantAxis] = useState<'size' | 'color'>('size');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullFeatures, setShowFullFeatures] = useState(false);
  // Image zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: string; y: string }>({ x: '50%', y: '50%' });
  const ZOOM_FACTOR = 1.8;
  const imageWrapRef = useRef<HTMLDivElement | null>(null);
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);
  // Helper to get current images array (variant images preferred)
  const getImagesArray = () => {
    if (selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
      return selectedVariant.images.map(img => (typeof img === 'string' ? img : img.url));
    }
    if (product?.image) {
      return Array.isArray(product.image) ? product.image : [product.image];
    }
    return [`https://source.unsplash.com/featured/1000x1000/${(product?.subcategory || product?.category || 'fashion').replace(/\s+/g, '+')}`];
  };

  // Memoize images to avoid recomputing on every render
  const images = useMemo(() => getImagesArray(), [selectedVariant?._id, selectedVariant?.images?.length, product?._id, product?.image?.length]);

  // Ensure currentImageIndex stays valid when images change
  useEffect(() => {
    if (currentImageIndex >= images.length) setCurrentImageIndex(0);
  }, [images, currentImageIndex]);

  // helper to activate an image
  const activateImage = (idx: number) => setCurrentImageIndex(idx);

  const showPrev = () => setCurrentImageIndex((i) => {
    const total = Math.max(1, images.length);
    return (i - 1 + total) % total;
  });
  const showNext = () => setCurrentImageIndex((i) => {
    const total = Math.max(1, images.length);
    return (i + 1) % total;
  });

  const applyVariantSelection = (v: VariantType | null) => {
    if (!v) return;
    setSelectedVariant(v);
    setSelectedSize(v.size || '');
    setSelectedColor(v.color || '');
    setCurrentImageIndex(0);
    setQuantity(1);
  };

  // keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { showPrev(); }
      else if (e.key === 'ArrowRight') { showNext(); }
      else if (e.key === 'Escape') { closeLightbox(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  // Debug: log product & selection state for troubleshooting
  useEffect(() => {
    console.debug('DEBUG Product state:', {
      productId: product?._id,
      productTitle: product?.title,
      selectedVariantId: selectedVariant?._id,
      selectedSize,
      selectedColor,
      currentImageIndex,
    });
  }, [product, selectedVariant, selectedSize, selectedColor, currentImageIndex]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let url = '';
        if (id) url = apiUrl(`/clients/products/singleproduct/${id}`);
        else {
          const name = new URLSearchParams(location.search).get('name');
          if (name) url = apiUrl(`/clients/products/byname/${encodeURIComponent(name)}`);
        }
        if (!url) return;

        const res = await axios.get(url, { withCredentials: true });

        if (res.data?.ok || res.data?.success) {
          const data = res.data.data;
          const prod = Array.isArray(data) ? data[0] : data;
          if (!prod) {
            toast.error('Product not found');
            return;
          }
          if (prod.image && !Array.isArray(prod.image)) prod.image = [prod.image];
          setProduct(prod);

          if (prod.isParentProduct && prod.variants && prod.variants.length > 0) {
            const firstVariant = prod.variants.find((v) => v.isActive);
            if (firstVariant) {
              setSelectedVariant(firstVariant);
              setSelectedSize(firstVariant.size || '');
              setSelectedColor(firstVariant.color || '');
              setCurrentImageIndex(0);
            }
          } else {
            setSelectedSize(prod.size?.[0] || '');
            setSelectedColor(prod.color?.[0] || '');
            setCurrentImageIndex(0);
          }

          setIsWishlisted(prod.isWishlisted || false);
        } else {
          toast.error(res.data?.message || 'Failed to load product');
        }
      } catch (err: any) {
        console.error('Error loading product:', err, 'URL:', (err?.config && err.config.url) || 'n/a');
        const nameParam = new URLSearchParams(location.search).get('name');
        if (!id && nameParam && err?.response?.status === 404) {
          try {
            const allRes = await axios.get(apiUrl('/clients/products'), { withCredentials: true });
            const list = allRes.data?.data || [];
            const target = nameParam.toLowerCase();
            let best: any = null;
            let bestScore = -1;
            const tokens = target.split(/\s+/).filter(Boolean);
            for (const p of list) {
              const title = (p.title || '').toLowerCase();
              let score = 0;
              if (title === target) score = 1000;
              else if (title.startsWith(target)) score = 900;
              else if (title.includes(target)) score = 800;
              score += tokens.reduce((acc: number, t: string) => acc + (title.includes(t) ? 1 : 0), 0);
              if (score > bestScore) {
                bestScore = score;
                best = p;
              }
            }
            if (best) {
              setProduct(best);
              setSelectedSize(best.size?.[0] || 'N/A');
              setSelectedColor(best.color?.[0] || 'N/A');
              setIsWishlisted(best.isWishlisted || false);
              toast.message('Showing closest match');
              return;
            }
            toast.error('Product not found');
          } catch (e) {
            toast.error('Failed to fetch product');
          }
        } else {
          if (err?.response?.status === 404) toast.error('Product not found');
          else toast.error('Failed to fetch product');
        }
      }
    };
    fetchProduct();
  }, [id, location.search]);

  // Check if product is in wishlist
  useEffect(() => {
    if (!product || !user) return;
    
    const checkWishlistStatus = async () => {
      try {
        const res = await axios.get(
          apiUrl('/clients/user/wishlist'),
          { withCredentials: true, headers: { ...getAuthHeaders() } }
        );
        
        if (res.data?.data && Array.isArray(res.data.data)) {
          const isInWishlist = res.data.data.some((item: any) => item._id === product._id);
          setIsWishlisted(isInWishlist);
        }
      } catch (err) {
        console.error('Error checking wishlist status:', err);
      }
    };
    
    checkWishlistStatus();
  }, [product?._id, user]);

  // Handle variant selection - update images, price, and stock when variant changes
  useEffect(() => {
    if (!product) return;
    
    // If this is a parent product with variants
    if (product.isParentProduct && product.variants && product.variants.length > 0) {
      // If no variant is selected yet, auto-select first active variant
      if (!selectedVariant) {
        const firstActiveVariant = product.variants.find(v => v.isActive);
        if (firstActiveVariant) {
          setSelectedVariant(firstActiveVariant);
          setSelectedSize(firstActiveVariant.size || '');
          setSelectedColor(firstActiveVariant.color || '');
          setCurrentImageIndex(0);
        }
      } else {
        // Match selected size/color to variant
        const matchedVariant = findMatchingVariant(
          product, 
          selectedSize && selectedSize !== 'N/A' ? selectedSize : undefined, 
          selectedColor && selectedColor !== 'N/A' ? selectedColor : undefined,
          lastVariantAxis
        );
        if (matchedVariant) {
          setSelectedVariant(matchedVariant);
          // Keep selectors in sync with the actual selected variant.
          // This is critical when user changes only size or only color.
          if ((matchedVariant.size || '') !== (selectedSize || '')) {
            setSelectedSize(matchedVariant.size || '');
          }
          if ((matchedVariant.color || '') !== (selectedColor || '')) {
            setSelectedColor(matchedVariant.color || '');
          }
          setCurrentImageIndex(0); // Reset to first image of variant
        }
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, product]);

  // Fetch related products based on current product
  useEffect(() => {
    if (!product) return;
    
    const fetchRelatedProducts = async () => {
      try {
        const res = await axios.get(apiUrl('/clients/products'), {
          withCredentials: true,
        });
        
        if (res.data?.data && Array.isArray(res.data.data)) {
          const allProducts = res.data.data;
          
          // Filter related products based on category, theme, brand, or gender
          const related = allProducts.filter((p: ProductType) => 
            p._id !== product._id && (
              p.category === product.category ||
              p.theme === product.theme ||
              p.brand === product.brand ||
              p.gender === product.gender
            )
          );
          
          // Shuffle and take first 4-8 products
          const shuffled = related.sort(() => 0.5 - Math.random());
          setRelatedProducts(shuffled.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  // Fetch parent product if this product is a child
  useEffect(() => {
    if (!product) {
      setParentProduct(null);
      setChildProductsList([]);
      return;
    }

    const fetchParent = async () => {
      if (!product.parentProductId) {
        setParentProduct(null);
        return;
      }
      try {
        const res = await axios.get(apiUrl(`/clients/products/singleproduct/${product.parentProductId}`), { withCredentials: true });
        const data = res.data?.data;
        const prod = Array.isArray(data) ? data[0] : data;
        if (prod) setParentProduct(prod);
      } catch (err) {
        console.warn('Failed to fetch parent product', err);
        setParentProduct(null);
      }
    };

    // Fetch children products (other products whose parentProductId === current product._id)
    const fetchChildren = async () => {
      if (!product.isParentProduct) {
        setChildProductsList([]);
        return;
      }
      try {
        const res = await axios.get(apiUrl('/clients/products'), { withCredentials: true });
        const list = res.data?.data || [];
        const children = list.filter((p: ProductType) => p.parentProductId === product._id && p._id !== product._id);
        setChildProductsList(children);
      } catch (err) {
        console.warn('Failed to fetch child products', err);
        setChildProductsList([]);
      }
    };

    fetchParent();
    fetchChildren();
  }, [product]);
  const ensureLoggedIn = () => {
    if (!user) {
      toast.error('You must be logged in.');
      navigate('/auth');
      return false;
    }
    return true;
  };
  const outOfStock = !!product && (
    selectedVariant ? selectedVariant.stock <= 0 : 
    (typeof (product as any).supply === 'number' ? (product as any).supply <= 0 : product.inStock === false)
  );
  const availableStock: number = selectedVariant ? selectedVariant.stock :
    (product && typeof (product as any).supply === 'number'
    ? Math.max(0, (product as any).supply as number)
    : (product?.inStock ? 1 : 0));

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    setQuantity((prev) => {
      if (action === 'increase') {
        const next = prev + 1;
        if (availableStock > 0 && next > availableStock) {
          toast.error(`Only ${availableStock} in stock`);
          return prev;
        }
        return next;
      }
      return prev > 1 ? prev - 1 : prev;
    });
  };

  const handleAddToCart = async () => {
    if (!ensureLoggedIn() || !product) return;
    if ((product.size?.length > 0 && !selectedSize) || (product.color?.length > 0 && !selectedColor)) {
      toast.error('Please select required size and color');
      return;
    }

    try {
      // Determine which price and details to use (variant or product-level)
      const cartData: any = {
        productId: product._id,
        title: product.title,
        description: product.description || "N/A",  
        brand: product.brand || "N/A",
        color: selectedColor || 'Default Color',
        gender: product.gender || 'Unisex',
        price: selectedVariant?.price ?? product.price, // Use variant price if available
        basePrice: selectedVariant?.basePrice ?? product.basePrice ?? product.price,
        tax: selectedVariant?.tax ?? product.tax,
        shippingCost: selectedVariant?.shippingCost ?? product.shippingCost,
        discount: selectedVariant?.discount ?? product.discount,
        rating: product.rating?.toString() || '0',
        category: product.category || "N/A",
        theme: product.theme || "N/A",
        size: selectedSize || 'Free',
        image: selectedVariant?.images?.map(img => img.url) ?? product.image ?? [],
        Qty: quantity,
        afterQtyprice: (selectedVariant?.price ?? product.price) * quantity,
        total: (selectedVariant?.price ?? product.price) * quantity,
        variation: { size: selectedSize, color: selectedColor, quantity },
      };
      
      // Add variant-specific information
      if (selectedVariant) {
        cartData.variantId = selectedVariant._id;
        cartData.sku = selectedVariant.sku;
      }

      const res = await axios.post(apiUrl('/clients/user/addtocart'),
        cartData,
        {
          withCredentials: true,
          headers: { ...getAuthHeaders() },
        });

      if (res.data?.ok || res.data?.success) {
        toast.success(`Added ${product.title} to cart!`);
        navigate('/cart');
      } else toast.error(res.data?.message || 'Failed to add to cart');
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/auth');
      else toast.error(err?.response?.data?.message || 'Add to cart failed');
    }
  };

  const handleAddToWishlist = async () => {
    if (!ensureLoggedIn() || !product) return;
    try {
      if (isWishlisted) {
        // Remove from wishlist
        const res = await axios.post(
          apiUrl('/clients/user/wishlist/remove'),
          { productId: product._id },
          { withCredentials: true, headers: { ...getAuthHeaders() } }
        );

        if (res.data?.ok || res.data?.success) {
          toast.success(`Removed ${product.title} from wishlist!`);
          setIsWishlisted(false);
        } else toast.error(res.data?.message || 'Failed to remove from wishlist');
      } else {
        // Add to wishlist
        const res = await axios.post(
          apiUrl('/clients/user/wishlist/add'),
          { productId: product._id },
          { withCredentials: true, headers: { ...getAuthHeaders() } }
        );

        if (res.data?.ok || res.data?.success) {
          toast.success(`Added ${product.title} to wishlist!`);
          setIsWishlisted(true);
        } else toast.error(res.data?.message || 'Failed to add to wishlist');
      }
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/auth');
      else toast.error(err?.response?.data?.message || 'Wishlist operation failed');
    }
  };

  if (!product) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-[1490px] mx-auto px-8 md:px-2 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-purple-500 transition-colors">Home</Link>
          <span className="text-purple-300">→</span>
          <Link to={`/category/${product.category}`} className="hover:text-purple-500 transition-colors">{product.category || 'Category'}</Link>
          <span className="text-purple-300">→</span>
          <Link to={`/category/${product.category}/${product.subcategory}`} className="hover:text-purple-500 transition-colors">{product.subcategory || 'Subcategory'}</Link>
          <span className="text-purple-300">→</span>
          <span className="text-purple-600 font-medium truncate">{product.title}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mb-8 md:mb-10 items-start">
          {/* Product Card  */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row gap-3">
              
                {/* Horizontal thumbnails for small/medium screens */}
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 px-2 lg:hidden mt-2">
                  {images.map((image, index) => (
                    <Thumbnail key={`hthumb-${index}`} image={image} index={index} isActive={currentImageIndex===index} onActivate={activateImage} />
                  ))}
                </div>
                
              {/* Vertical thumbnails on large screens (left) */}
              <div className="hidden lg:flex flex-col gap-3 w-18 h-[600px] overflow-y-auto pr-1">
                {images.map((image, index) => (
                  <Thumbnail key={`vthumb-${index}`} image={image} index={index} isActive={currentImageIndex===index} onActivate={activateImage} />
                ))}
              </div>

              {/* Main image area */}
              <div className="flex-1">
                <div
                  ref={imageWrapRef}
                  className={`rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 backdrop-blur-xl shadow-xl border border-white/20 flex items-center justify-center h-[500px] sm:h-[600px] lg:h-[min(68vh,650px)] p-2 md:p-3 overflow-hidden relative group ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={(e) => {
                    if (!imageWrapRef.current) return;
                    const rect = imageWrapRef.current.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomOrigin({ x: `${x}%`, y: `${y}%` });
                  }}
                  onClick={() => setIsZoomed((z) => !z)}
                >
                  {/* Open lightbox button */}
                  <button
                    type="button"
                    aria-label="Open fullscreen"
                    onClick={(e) => { e.stopPropagation(); openLightbox(); }}
                    className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 hover:bg-white shadow-lg border border-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110"
                  >
                    <Maximize2 className="w-5 h-5 text-purple-600" />
                  </button>
                  {product.parentProductId && (
                    <button
                      type="button"
                      aria-label="View parent product"
                      onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.parentProductId}`); }}
                      className="absolute top-3 left-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 hover:bg-white shadow-lg border border-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110"
                    >
                      <ChevronLeft className="w-5 h-5 text-purple-600" />
                    </button>
                  )}
                  <img
                    src={images[currentImageIndex] || `https://source.unsplash.com/featured/1000x1000/${(product.subcategory || product.category || 'fashion').replace(/\s+/g, '+')}`}
                    alt={product.title}
                    className={`h-auto w-auto max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 ease-out pointer-events-none select-none`}
                    style={{
                      transform: isZoomed ? `scale(${ZOOM_FACTOR})` : 'scale(1)',
                      transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
                    }}
                  />
                </div>

              </div>
            </div>


            {/* Variants Gallery - Flipkart/Amazon Style */}
{/*             
            {product.isParentProduct && product.variants && product.variants.length > 0 && (
              <div className="w-full">
                <div className="mb-2">
                
                  <p className="text-xs text-gray-500 mt-0">Click to select a variant</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {product.variants
                    .filter((v) => v && v.isActive)
                    .map((variant) => {
                      const isSelected = selectedVariant?._id === variant._id;
                      const variantImage =
                        variant.images?.[0]?.url ||
                        product.image?.[0] ||
                        'https://via.placeholder.com/300x300?text=No+Image';
                      const isAvailable = variant.stock > 0;
                      const labelParts = [variant.size, variant.color].filter(Boolean);
                      const label = labelParts.length ? labelParts.join(' / ') : variant.sku;

                      return (
                        <button
                          key={variant._id}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setSelectedSize(variant.size || '');
                            setSelectedColor(variant.color || '');
                            setCurrentImageIndex(0);
                            setQuantity(1);
                          }}
                          className={`relative group rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                            isSelected
                              ? 'ring-3 ring-purple-500 shadow-lg'
                              : 'hover:shadow-lg'
                          } ${!isAvailable ? 'opacity-60' : ''}`}
                        >
                          <div className="aspect-square bg-gray-100 overflow-hidden">
                            <img
                              src={variantImage}
                              alt={label}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>

                          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-end transition-opacity duration-300 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="text-white">
                              <p className="text-xs font-extrabold truncate">{label}</p>
                              <p className="text-sm font-bold mt-1">₹{variant.price.toLocaleString('en-IN')}</p>
                              {variant.basePrice && variant.basePrice > variant.price && (
                                <p className="text-xs line-through text-gray-300">₹{variant.basePrice.toLocaleString('en-IN')}</p>
                              )}
                              <p className={`text-xs mt-1 font-medium ${isAvailable ? 'text-green-300' : 'text-red-300'}`}>
                                {isAvailable ? `${variant.stock} left` : 'Out of Stock'}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">
                              ✓
                            </div>
                          )}

                          {!isAvailable && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Out
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
 */}

            {/* Child products (other product entries with this as parent) */}
            {childProductsList && childProductsList.length > 0 && (
              <div className="w-full mt-6">
                <div className="mb-4">
                  <h3 className="text-sm md:text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    Other Products (Children)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Click to view other product entries under this parent</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {childProductsList.map((child) => (
                    <Link key={child._id} to={`/product/${child._id}`} className="group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105">
                      <div className="aspect-square bg-gray-100 overflow-hidden rounded-md">
                        <img src={child.image?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'} alt={child.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium truncate">{child.title}</div>
                        <div className="text-xs text-muted-foreground">₹{(child.price || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 self-start lg:max-h-[calc(100vh-180px)] lg:overflow-auto lg:pr-4">
            {parentProduct && (
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/10 dark:to-gray-900/8 rounded-2xl p-3 border border-white/10 mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground">Parent Product</h4>
                <Link to={`/product/${parentProduct._id}`} className="flex items-center gap-3 mt-2">
                  <img src={parentProduct.image?.[0] || 'https://via.placeholder.com/80x80?text=No+Image'} alt={parentProduct.title} className="w-16 h-16 object-cover rounded-md" />
                  <div>
                    <div className="font-medium truncate">{parentProduct.title}</div>
                    <div className="text-xs text-muted-foreground">View parent product details</div>
                  </div>
                </Link>
              </div>
            )}

            <Card className="rounded-3xl border border-border/60 bg-background/60 backdrop-blur-xl">
              <div className="p-5 md:p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    {product.brand && (
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {product.brand}
                      </Badge>
                    )}
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">{product.title}</h1>

                    {/* Reting section  */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-1 text-sm font-medium text-yellow-600 dark:text-yellow-400">{product.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        {product.reviewCount} reviews
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => navigator?.share?.({ title: product.title, url: window.location.href }).catch(() => {})}
                      className="text-muted-foreground"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl md:text-4xl font-semibold tracking-tight">₹{selectedVariant?.price ?? product.price}</span>
                      {(() => {
                        const currentPrice = selectedVariant?.price ?? product.price;
                        const basePrice = selectedVariant?.basePrice ?? product.basePrice ?? product.price;
                        const discount = selectedVariant?.discount ?? product.discount;
                        let showDiscount = false;
                        let discountPercent = 0;

                        if (discount && typeof discount === 'object' && discount.value > 0) {
                          if (discount.type === 'percentage') {
                            discountPercent = discount.value;
                            showDiscount = true;
                          } else if (discount.type === 'fixed' && basePrice > currentPrice) {
                            discountPercent = ((basePrice - currentPrice) / basePrice) * 100;
                            showDiscount = true;
                          }
                        } else if (typeof discount === 'number' && discount > 0) {
                          discountPercent = discount;
                          showDiscount = true;
                        } else if (basePrice > currentPrice) {
                          discountPercent = ((basePrice - currentPrice) / basePrice) * 100;
                          showDiscount = discountPercent > 0;
                        }

                        return showDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">₹{basePrice.toFixed(2)}</span>
                            <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white">{Math.round(discountPercent)}% OFF</Badge>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {outOfStock ? (
                      <Badge className="bg-red-500 text-white rounded-full">Out of Stock</Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-white rounded-full">In Stock</Badge>
                    )}
                  </div>

                  {!outOfStock && availableStock > 0 && (
                    <p className="text-sm text-muted-foreground">{availableStock} item{availableStock === 1 ? '' : 's'} left</p>
                  )}
                </div>

                <Separator />

                {/* Buy + size + colour section  */}
                {/* Size and Color Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Size</div>
                    {product.isParentProduct ? (
                      <div className="flex flex-wrap gap-2">
                        {getAvailableSizes(product, selectedColor).map((size) => (
                          <Button
                            key={size}
                            type="button"
                            variant={selectedSize === size ? 'default' : 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLastVariantAxis('size');
                              setSelectedSize(size);
                              const next = findMatchingVariant(
                                product,
                                size,
                                selectedColor || undefined,
                                'size'
                              );
                              if (next) applyVariantSelection(next);
                            }}
                            className={cn(
                              'rounded-full',
                              selectedSize === size ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95' : ''
                            )}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(product.size || []).map((size) => (
                          <Button
                            key={size}
                            type="button"
                            variant={selectedSize === size ? 'default' : 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSize(size);
                            }}
                            className={cn(
                              'rounded-full',
                              selectedSize === size ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95' : ''
                            )}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Color</div>
                    {product.isParentProduct ? (
                      <div className="flex flex-wrap gap-2">
                        {getAvailableColors(product, selectedSize).map((color) => (
                          <Button
                            key={color}
                            type="button"
                            variant={selectedColor === color ? 'default' : 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLastVariantAxis('color');
                              setSelectedColor(color);
                              const next = findMatchingVariant(
                                product,
                                selectedSize || undefined,
                                color,
                                'color'
                              );
                              if (next) applyVariantSelection(next);
                            }}
                            className={cn(
                              'rounded-full',
                              selectedColor === color ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95' : ''
                            )}
                          >
                            {color}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(product.color || []).map((color) => (
                          <Button
                            key={color}
                            type="button"
                            variant={selectedColor === color ? 'default' : 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedColor(color);
                            }}
                            className={cn(
                              'rounded-full',
                              selectedColor === color ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95' : ''
                            )}
                          >
                            {color}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variant / Child thumbnails below main images */}
                  {/* {product.isParentProduct && product.variants && product.variants.length > 0 && (
                    <div className="flex gap-3 mt-2 overflow-x-auto pb-2 px-1">
                      {product.variants.filter(v => v.isActive).map((v) => {
                        const thumb = v.images?.[0]?.url || (Array.isArray(product.image) ? product.image[0] : product.image) || `https://source.unsplash.com/featured/160x160/${(product.subcategory || product.category || 'fashion').replace(/\s+/g, '+')}`;
                        const isSelectedVar = selectedVariant?._id === v._id;
                        const isAvailable = (v.stock || 0) > 0;

                        return (
                          <button
                            key={v._id}
                            type="button"
                            onClick={() => {
                              setSelectedVariant(v);
                              setSelectedSize(v.size || '');
                              setSelectedColor(v.color || '');
                              setCurrentImageIndex(0);
                              setQuantity(1);
                            }}
                            className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                              isSelectedVar ? 'ring-2 ring-purple-500 shadow-lg scale-105' : 'border border-white/10 hover:ring-2 hover:ring-purple-400 hover:scale-[1.03]'
                            } ${!isAvailable ? 'opacity-60' : ''}`}
                            aria-pressed={isSelectedVar}
                          >
                            <img src={thumb} alt={`${v.color || ''} ${v.size || ''}`} className="w-full h-full object-cover bg-white" />
                            {v.size && (
                              <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 py-0.5 rounded">{v.size}</div>
                            )}
                            {v.color && (
                              <div className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1 py-0.5 rounded">{v.color}</div>
                            )}
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">Out</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )} */}
                </div>

                <Separator />

                {/* Quantity Selector */}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">Quantity</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1 || outOfStock}
                      className="rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="min-w-10 text-center font-medium">{quantity}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={outOfStock || (availableStock > 0 && quantity >= availableStock)}
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock || (availableStock > 0 && quantity > availableStock)}
                    className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:opacity-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddToWishlist}
                    className="rounded-2xl"
                  >
                    <Heart className={cn('w-4 h-4', isWishlisted ? 'fill-pink-600 text-pink-600' : '')} />
                    {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Fast delivery (3-5 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Easy returns (7 days)</span>
                  </div>
                </div>
              </div>
            </Card>

            
            {/* Product Description */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-3">
                <Card className="rounded-2xl border border-border/60 bg-background/60 backdrop-blur-xl">
                  <div className="p-4 md:p-5">
                    <div className={`text-sm text-muted-foreground space-y-1 whitespace-pre-wrap overflow-hidden transition-all duration-300 ${showFullDescription ? 'max-h-[1000px]' : 'max-h-32'}`}>
                      {product.description ? formatDescription(product.description) : 'No description available.'}
                    </div>
                    {!!product.description && product.description.split('\n').length > 3 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-3 text-sm font-medium text-primary hover:opacity-80 flex items-center gap-1 transition-opacity"
                      >
                        {showFullDescription ? (
                          <>
                            Show less
                            <ChevronLeft className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Read more
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-3">
                <Card className="rounded-2xl border border-border/60 bg-background/60 backdrop-blur-xl">
                  <div className="p-4 md:p-5">
                    <h3 className="font-semibold mb-3">Product Features</h3>
                    {product.features && Array.isArray(product.features) && product.features.length > 0 ? (
                      <>
                        <ul className={`text-sm space-y-2 overflow-hidden transition-all duration-300 ${showFullFeatures ? 'max-h-none' : 'max-h-40'}`}>
                          {product.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                              <div className="text-muted-foreground">{formatDescription(feature)}</div>
                            </li>
                          ))}
                        </ul>
                        {product.features.length > 5 && (
                          <button
                            onClick={() => setShowFullFeatures(!showFullFeatures)}
                            className="mt-3 text-sm font-medium text-primary hover:opacity-80 flex items-center gap-1 transition-opacity"
                          >
                            {showFullFeatures ? (
                              <>
                                Show less
                                <ChevronLeft className="w-4 h-4 rotate-90" />
                              </>
                            ) : (
                              <>
                                Read more
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <ul className="text-sm space-y-2">
                  {product.category === 'Shirt' || product.category === 'T-Shirt' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">100% Premium Cotton</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Comfortable Regular Fit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Machine Washable</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Breathable Fabric</span>
                      </li>
                    </>
                  ) : product.category === 'Jeans' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Durable Denim Material</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Perfect Fit Design</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Multiple Pockets</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Fade Resistant</span>
                      </li>
                    </>
                  ) : product.category === 'Shoes' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Comfortable Cushioning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Durable Sole</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Breathable Design</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Perfect for Daily Use</span>
                      </li>
                    </>
                  ) : product.category === 'Accessories' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Premium Quality Material</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Stylish Design</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Long Lasting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Perfect for Any Occasion</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Premium Quality Material</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Comfortable Fit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Durable Design</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                        <span className="text-gray-700 dark:text-gray-300">Easy Maintenance</span>
                      </li>
                    </>
                  )}
                      </ul>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
            {/* Display SKU if variant is selected */}
            {selectedVariant && selectedVariant.sku && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-4 backdrop-blur-xl border border-white/20">
                <p className="text-xs text-gray-600 dark:text-gray-400">SKU: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedVariant.sku}</span></p>
              </div>
            )}

            {/* Display Variant Specifications */}
            {selectedVariant && (selectedSize || selectedColor) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-4 backdrop-blur-xl border border-white/20">
                <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3">Selected Variant Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedSize && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Size</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{selectedSize}</p>
                    </div>
                  )}
                  {selectedColor && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Color</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{selectedColor}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Stock</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{selectedVariant.stock} available</p>
                  </div>
                  {product?.rating > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100">⭐ {product.rating}</p>
                    </div>
                  )}
                </div>
                {product?.features && product.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Features</p>
                    <ul className="text-xs space-y-1">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-300">• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Description
            <Card className="p-3 md:p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <details open className="text-sm text-muted-foreground leading-relaxed">
                <summary className="cursor-pointer text-foreground mb-2">Read more</summary>
                <p>{product.description || 'No description available for this product.'}</p>
              </details>
            </Card> */}
          </div>
        </div>

        <div className="border-t pt-16">
          <ReviewSection productId={product._id} />
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-24">
            <div className="flex items-center justify-center gap-3 mb-8 sm:mb-12">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-text-shine tracking-tight">Related Products</h2>
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <div key={relatedProduct._id || index} className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-3 md:p-4 hover:shadow-xl transition-all duration-300 backdrop-blur-xl border border-white/20 transform hover:scale-[1.02]">
                  <Link to={`/product/${relatedProduct._id}`} className="block">
                    <div className="aspect-square bg-white/50 dark:bg-black/20 mb-4 rounded-xl overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                      <img
                        src={Array.isArray(relatedProduct.image) ? relatedProduct.image[0] : relatedProduct.image || `https://source.unsplash.com/featured/400x400/${(relatedProduct.category || 'fashion').replace(/\s+/g, '+')}`}
                        alt={relatedProduct.title}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:to-purple-600">{relatedProduct.title}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">₹{relatedProduct.price}</span>
                      {relatedProduct.oldPrice && (
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 line-through text-xs">₹{relatedProduct.oldPrice}</span>
                          <span className="text-xs font-bold text-pink-500">
                            {Math.round((1 - relatedProduct.price / relatedProduct.oldPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                    {relatedProduct.brand && (
                      <div className="mt-2 inline-block px-2 py-1 rounded-lg bg-white/50 dark:bg-black/20 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {relatedProduct.brand}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <ScrollToTop />

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 text-white/90 hover:text-white"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
          >
            <X className="w-7 h-7" />
          </button>

          {(images.length || 0) > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                className="absolute left-4 md:left-6 text-white/90 hover:text-white"
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
              >
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="absolute right-4 md:right-6 text-white/90 hover:text-white"
                onClick={(e) => { e.stopPropagation(); showNext(); }}
              >
                <ChevronRight className="w-9 h-9" />
              </button>
            </>
          )}

          <img
            src={images[currentImageIndex] || `https://source.unsplash.com/featured/1400x1400/${(product.subcategory || product.category || 'fashion').replace(/\s+/g, '+')}`}
            alt={product.title}
            className="max-w-[95vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Product;
