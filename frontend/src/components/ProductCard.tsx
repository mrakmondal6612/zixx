import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductCardProps {
  id: string;
  title: string;
  image?: string;
  price: number; // Final calculated price
  basePrice?: number; // Original price
  discount?: {
    type: 'percentage' | 'fixed' | 'coupon';
    value: number;
  } | number; // Can be object (new) or number (legacy)
  oldPrice?: number; // optional explicit old price
  reviews?: number; // optional review count
  badge?: string; // e.g., 'Best Seller', 'New Arrival'
  variant?: 'default' | 'home';
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onAddToCart?: () => void;
  className?: string;
}

const formatOldPrice = (price: number, basePrice?: number, discount?: any, oldPrice?: number) => {
  if (oldPrice && oldPrice > price) return oldPrice.toFixed(2);
  if (basePrice && basePrice > price) return basePrice.toFixed(2);
  
  // Handle discount object or number
  if (discount) {
    if (typeof discount === 'object' && discount.type === 'percentage' && discount.value > 0 && discount.value < 100) {
      const base = price / (1 - discount.value / 100);
      return base.toFixed(2);
    } else if (typeof discount === 'number' && discount > 0 && discount < 100) {
      const base = price / (1 - discount / 100);
      return base.toFixed(2);
    }
  }
  return '';
};

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  image,
  price,
  basePrice,
  discount,
  oldPrice,
  reviews,
  badge,
  variant = 'default',
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  className = ''
}) => {
  const computedOld = formatOldPrice(price, basePrice, discount, oldPrice);
  const discountPercent = computedOld && !isNaN(Number(computedOld)) 
    ? Math.round(((Number(computedOld) - price) / Number(computedOld)) * 100)
    : 0;

  const isHome = variant === 'home';

  return (
    <div className={cn('group', className)}>
      <Link to={`/product/${id}`} className="block h-full">
        {isHome ? (
          <div className="h-full rounded-3xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-500/30 p-[1px] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
            <div className="h-full rounded-3xl overflow-hidden bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 flex flex-col">
              <div className="relative overflow-hidden bg-muted">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={image || 'https://via.placeholder.com/400x500?text=Product'}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {badge && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                  {discountPercent > 0 && (
                    <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      -{discountPercent}%
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleWishlist?.();
                    }}
                    className={cn(
                      'pointer-events-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/60 backdrop-blur border border-white/30 shadow-sm transition-transform hover:scale-105',
                      isWishlisted ? 'text-pink-600' : 'text-gray-700 dark:text-gray-100'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isWishlisted ? 'fill-pink-600' : '')} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart?.();
                  }}
                  className={cn(
                    'absolute bottom-3 left-3 right-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2',
                    'opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0'
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>

              <div className="p-4 md:p-5 flex flex-col flex-grow">
                <h3 className="text-sm md:text-base font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-50 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  {title}
                </h3>

                <div className="flex items-center gap-1 mb-3 text-sm">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  {typeof reviews === 'number' && (
                    <span className="text-xs text-muted-foreground ml-1">({reviews})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {computedOld && (
                    <span className="text-xs md:text-sm text-muted-foreground line-through">
                      ₹{Number(computedOld).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="relative overflow-hidden bg-gray-100">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={image || 'https://via.placeholder.com/400x500?text=Product'}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              {badge && (
                <div className="absolute top-3 left-3">
                  <span className="bg-[#D92030] text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                    {badge}
                  </span>
                </div>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                  -{discountPercent}%
                </div>
              )}
            </div>
            <div className="p-4 md:p-6 flex flex-col flex-grow">
              <h3 className="text-sm md:text-base font-bold mb-2 line-clamp-2 group-hover:text-[#D92030] transition-colors">{title}</h3>
              
              {/* Rating Section */}
              <div className="flex items-center gap-1 mb-3 text-sm">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                {typeof reviews === 'number' && (
                  <span className="text-xs text-gray-600 ml-1">({reviews})</span>
                )}
              </div>
              
              {/* Price Section */}
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-lg md:text-xl font-bold text-[#D92030]">₹{price.toLocaleString('en-IN')}</span>
                {computedOld && (
                  <span className="text-xs md:text-sm text-gray-500 line-through">₹{Number(computedOld).toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
};

export default ProductCard;
