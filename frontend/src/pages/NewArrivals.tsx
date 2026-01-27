import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { DynamicBanner } from '@/components/sections/DynamicBanner';
import { apiUrl } from '@/lib/api';

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
  image: string[];
  type?: string;
}

const NewArrivals = () => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/clients/products`), { credentials: 'include' });
        const result = await res.json();
        if (result.ok && Array.isArray(result.data)) {
          const filtered = result.data.filter((product: Product) =>
            (product.theme || '').toLowerCase().includes('new')
          );
          setNewArrivals(filtered);
        } else {
          setError(result.message || 'Failed to load products');
        }
      } catch (err: any) {
        console.error('Error fetching new arrivals:', err);
        setError(err?.message || 'Error fetching new arrivals');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <DynamicBanner
        page="new-arrivals"
        position="hero"
        fallback={{
          imageUrl: '/placeholder.svg',
          heading: 'New Arrivals',
          description: 'Discover the latest trends and styles in our new arrivals collection.',
          linkText: 'Shop Now',
          linkUrl: '/new-arrivals',
          align: 'middle-bottom',
        }}
        style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
      />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10"> 
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">New Arrivals</h1>
          <p className="text-xl text-gray-600 mb-8">Discover the latest trends and styles</p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <div className="text-gray-500">No new arrivals yet. Please check back later.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <Link key={product._id} to={`/product/${product._id}`}>
                  <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-square">
                      <img src={product.image[0]} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 text-left">
                      <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">{product.subcategory}</p>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-[#D92030]">₹{product.price}</div>
                        {product.discount > 0 && (
                          <div className="text-gray-500 line-through text-sm">
                            ₹{Math.round(product.price / (1 - product.discount / 100))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Reviews Section/ */}
          {/* <div className="mt-16">
            <ReviewSection productId={newArrivals[0]?._id || ''} />
          </div> */}
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default NewArrivals;
