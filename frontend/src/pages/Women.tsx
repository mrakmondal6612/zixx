import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Card } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { Link } from 'react-router-dom';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { DynamicBanner } from '@/components/sections/DynamicBanner';
import { apiUrl } from '@lib/api';

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
}

interface CategoryGroup {
  category: string;
  subcategory: string;
  image: string;
}

const Women = () => {
  const [groupedProducts, setGroupedProducts] = useState<{ [category: string]: { [subcategory: string]: Product[] } }>({});
  const [allData, setAllData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products/women'), { credentials: 'include' });
        const result = await res.json();
        if (!result.ok) throw new Error("API returned not ok");

        const grouped: { [category: string]: { [subcategory: string]: Product[] } } = {};
        result.data.forEach((product: Product) => {
          const cat = product.category || 'Others';
          const sub = product.subcategory || 'Others';
          if (!grouped[cat]) grouped[cat] = {};
          if (!grouped[cat][sub]) grouped[cat][sub] = [];
          grouped[cat][sub].push(product);
        });

        setGroupedProducts(grouped);
        setAllData(result.data);

        const imageMap: { [key: string]: string } = {
          tops: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/a3778de0b6fa7c76cfd3fcebbe3550413b4e6770?placeholderIfAbsent=true',
          bottoms: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/195176e2222a7c41d44bd7662e7402d74c61a9a0?placeholderIfAbsent=true',
          dresses: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/323635352eed4542ef83c5e9d41e0f884d43499e?placeholderIfAbsent=true',
          outerwear: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/f3a59d3c18ef931719e92290738cf5332a8d0bb8?placeholderIfAbsent=true',
        };

        const catList: CategoryGroup[] = [];
        result.data.forEach((product: Product) => {
          if (!catList.some(c => c.category === product.category && c.subcategory === product.subcategory)) {
            catList.push({
              category: product.category,
              subcategory: product.subcategory,
              image: imageMap[product.category.toLowerCase()] || product.image[0],
            });
          }
        });

        setCategories(catList);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const bestSellers = allData.filter(p => p.theme?.toLowerCase().includes('new'));
  const newArrivals = allData.filter(p => p.theme?.toLowerCase().includes('new'));

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <section className="relative mb-20">
          <DynamicBanner
            page="women"
            position="featured"
            fallback={{
              imageUrl: "",
              heading: "Featured Collection",
              description: "Explore our curated selection of the season's must-haves.",
              linkText: "Shop Collection",
              linkUrl: "/women",
            }}
            style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
          />
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-pink-200 dark:border-pink-800">
              <span className="text-pink-600 dark:text-pink-400 text-sm font-medium">👗 Fashion</span>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-purple-200 dark:border-purple-800">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">✨ Style</span>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="mb-20">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">DISCOVER</span>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-text-shine">Shop by Category</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <div key={index} className="group">
                <Link to={`/category/${category.category.toLowerCase()}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/10 relative overflow-hidden border border-pink-100 dark:border-pink-900">
                    <div className="aspect-square rounded-2xl overflow-hidden relative">
                      <img
                        src={category.image}
                        alt={category.category} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="text-white text-2xl font-black drop-shadow-lg">{category.category.toUpperCase()}</h3>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-medium text-pink-600 dark:text-pink-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Explore →
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="mt-4 px-2">
                  <ul className="text-sm space-y-2">
                    <li className="transition-colors hover:text-pink-600 dark:hover:text-pink-400">
                      <Link 
                        to={`/category/${category.category.toLowerCase()}/${category.subcategory.toLowerCase()}`}
                        className="flex items-center gap-2 group"
                      >
                        <span className="h-1 w-1 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span>{category.subcategory}</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Women's Products */}
        {/*{allData.length > 0 && (
          <section className="mb-20">
            <div className="flex flex-col items-center mb-12 text-center">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">EXPLORE</span>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-text-shine">All Women's Products</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {allData.map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  image={p.image?.[0]}
                  price={p.price}
                  discount={p.discount}
                  badge={p.theme?.toLowerCase().includes('best') ? 'Best Seller' : p.theme?.toLowerCase().includes('new') ? 'New Arrival' : undefined}
                />
              ))}
            </div>
          </section>
        )}*/}

        {/* Product Grid by Category */}
{/*{loading && (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse flex gap-2">
              <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center py-10">
            <p className="text-pink-600 dark:text-pink-400 font-medium">{error}</p>
          </div>
        )}
        {!loading && !error && Object.keys(groupedProducts).map((category, i) => (
          <section key={i} className="mb-20">
            <div className="flex flex-col items-center mb-12 text-center">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">{category.toUpperCase()}</span>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-text-shine">{category} Collection</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </div>

            {Object.keys(groupedProducts[category]).map((subcategory, j) => (
              <div key={j} className="mb-12">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">{subcategory}</h3>
                  <div className="h-px flex-grow bg-gradient-to-r from-pink-500/20 to-purple-500/20 dark:from-pink-500/10 dark:to-purple-500/10"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
                  {groupedProducts[category][subcategory].slice(0, 4).map((p, index) => (
                    <ProductCard
                      key={index}
                      id={p._id}
                      title={p.title}
                      image={p.image?.[0]}
                      price={p.price}
                      discount={p.discount}
                      badge={p.theme?.toLowerCase().includes('best') ? 'Best Seller' : p.theme?.toLowerCase().includes('new') ? 'New Arrival' : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}


        {/* Best Sellers Section */}
{/*{bestSellers.length > 0 && (
          <section className="mb-20">
            <div className="relative mb-12">
              <DynamicBanner
                page="women"
                position="summer"
                fallback={{
                  imageUrl: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/4aced3c27c234d70267aacc0142add1478e2c868?placeholderIfAbsent=true',
                  heading: "Best Sellers",
                  description: "Explore our curated selection of the season's must-haves.",
                  linkText: "Shop Collection",
                  linkUrl: "/women",
                }}
                style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
              />
              <div className="absolute -bottom-6 left-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-pink-200 dark:border-pink-800">
                <span className="text-xl font-black bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">Most Loved ✨</span>
              </div>
            </div>

            <div className="flex flex-col items-center mb-12 text-center">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">CUSTOMER FAVORITES</span>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-text-shine">Best Sellers</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {bestSellers.slice(0, 8).map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  image={p.image?.[0]}
                  price={p.price}
                  discount={p.discount}
                  badge={'Best Seller'}
                />
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals Section */}
       {/* {newArrivals.length > 0 && (
          <section className="mb-20">
            <div className="relative mb-12">
              <DynamicBanner
                page="women"
                position="new"
                fallback={{
                  imageUrl: "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/d5b391a024519f0a274f617aaa8e815af74b7883?placeholderIfAbsent=true",
                  heading: "New Arrivals",
                  description: "Fresh styles for the fashion-forward. Be the first to wear what's next.",
                  linkText: "Shop Collection",
                  linkUrl: "/women",
                }}
                style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
              />
              <div className="absolute -bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-purple-200 dark:border-purple-800">
                <span className="text-xl font-black bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">Fresh Drops 🔥</span>
              </div>
            </div>

            <div className="flex flex-col items-center mb-12 text-center">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">JUST LANDED</span>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 bg-clip-text text-transparent animate-text-shine">New Arrivals</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {newArrivals.map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  title={p.title}
                  image={p.image?.[0]}
                  price={p.price}
                  discount={p.discount}
                  badge={'New Arrival'}
                />
              ))}
            </div>
          </section>
        )}
    */}
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Women;
