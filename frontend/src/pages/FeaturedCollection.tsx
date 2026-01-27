import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import axios from 'axios';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { apiUrl } from '@/lib/api';


interface ProductItem {
  _id: string;
  title: string;
  price: number;
  discount: number;
  image?: string[];
}

const FeaturedCollection = () => {
  const [items, setItems] = useState<ProductItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(apiUrl(`/clients/products`), { withCredentials: true });
        const list: ProductItem[] = res.data?.data || [];
        // Simple heuristic: prefer those with discount or top of list
        const sorted = [...list].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        setItems(sorted.slice(0, 8));
      } catch (e) {
        console.error('Failed to load featured products', e);
        setItems([]);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        {useLocation().pathname.startsWith('/categories') && (
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/shop">Shop</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Featured</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Featured Collection</h1>
          <p className="text-gray-600 text-lg">Handpicked premium pieces from our latest collection</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <Link key={item._id} to={`/product/${item._id}`} className="group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img 
                      src={item.image?.[0] || 'https://via.placeholder.com/400x500?text=Product'} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  {/* Optional badge could be discount */}
                  {item.discount > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#D92030] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {item.discount}% OFF
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          className={`text-gray-300`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#D92030]">₹{item.price}</span>
                    {item.discount > 0 && (
                      <span className="text-sm text-gray-500 line-through">₹{(item.price / (1 - item.discount / 100)).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FeaturedCollection;
