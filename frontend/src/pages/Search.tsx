
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Search as SearchIcon, Filter, ShoppingCart, Heart } from 'lucide-react';
import { apiUrl, getAuthHeaders } from '@/lib/api';


// Types for API results
interface Product {
  _id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  image: string[];
  description?: string;
  color?: string[];
  size?: string[];
  gender?: string;
  discount?: number;
  rating?: number;
  theme?: string;
}
interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}
interface Order {
  _id: string;
  orderItems: { productName: string }[];
  totalAmount: number;
}
interface Review {
  _id: string;
  comment: string;
  rating: number;
}

const Search = () => {

  const [searchQuery, setSearchQuery] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') || '';
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ products: Product[] }>({ products: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/clients/search?q=${encodeURIComponent(searchQuery)}`), { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `Failed to fetch search results (${res.status})`);
      }
      const products = data?.data?.products;
      if (Array.isArray(products)) {
        setResults({ products });
      } else {
        setResults({ products: [] });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch search results');
    } finally {
      setLoading(false);
    }
    };
    fetchSearch();    
  }, [searchQuery]);

  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Results</h1>
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base h-12"
              placeholder="Search for anything..."
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-16">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            {results.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.products.map((product) => (
                  <Card
                    key={product._id}
                    className="overflow-hidden hover-shadow cursor-pointer"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={product.image?.[0] || ''}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                            onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await axios.post(
                                apiUrl('/clients/user/wishlist/add'),
                              { productId: product._id },
                              {
                                withCredentials: true,
                                headers: { ...getAuthHeaders() },
                              }
                            );
                            if (res.status === 401) {
                              toast.error('You must be logged in to add to wishlist.');
                              navigate('/auth');
                              return;
                            }
                            if (res.status === 200) {
                              toast.success(`Added ${product.title} to wishlist!`);
                            } else {
                              toast.error('Failed to add to wishlist');
                            }
                          } catch (err) {
                            toast.error('Add to wishlist failed');
                          }
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2">
                        {product.brand}
                      </Badge>
                      <h3 className="font-semibold mb-1">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-destructive">₹{product.price}</span>
                      </div>
                      <Button
                        className="w-full bg-destructive hover:bg-destructive/90"
        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await axios.post(
                              apiUrl('/clients/user/addtocart'),
                              {
                                productId: product._id,
                                title: product.title,
                                description: product.description || '',
                                brand: product.brand || '',
                                color: (product.color && product.color[0]) || 'Default Color',
                                gender: product.gender || 'Unisex',
                                price: product.price, // Final calculated price
                                basePrice: (product as any).basePrice || product.price,
                                tax: (product as any).tax,
                                shippingCost: (product as any).shippingCost,
                                discount: product.discount,
                                rating: product.rating?.toString() || '0',
                                category: product.category || '',
                                theme: product.theme || '',
                                size: (product.size && product.size[0]) || 'Free',
                                image: product.image || [],
                                Qty: 1,
                                afterQtyprice: product.price, // Price is already final
                                total: product.price,
                                variation: {
                                  size: (product.size && product.size[0]) || 'Free',
                                  color: (product.color && product.color[0]) || 'Default Color',
                                  quantity: 1,
                                },
                              },
                              {
                                withCredentials: true,
                                headers: { ...getAuthHeaders() },
                              }
                            );
                            if (res.status === 401) {
                              toast.error('You must be logged in to add to cart.');
                              navigate('/auth');
                              return;
                            }
                            if (res.status === 200 || res.status === 201) {
                              toast.success(`Added ${product.title} to cart!`);
                            } else {
                              toast.error('Failed to add to cart');
                            }
                          } catch (err) {
                            toast.error('Add to cart failed');
                          }
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No products found.</div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Search;
