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

const Kids = () => {
  const [groupedProducts, setGroupedProducts] = useState<{ [category: string]: { [subcategory: string]: Product[] } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products/kids'), { credentials: 'include' });
        const result = await res.json();
        if (!result.ok) throw new Error("API returned not ok");
        // Strictly keep only kids items (defensive in case API returns mixed data)
        const isKidsProduct = (p: any) => {
          const g = (p?.gender || '').toString().toLowerCase();
          const c = (p?.category || '').toString().toLowerCase();
          const sc = (p?.subcategory || '').toString().toLowerCase();
          const isKid = /(kid|boy|girl)/.test(g) || /kids?/.test(c) || /kids?/.test(sc);
          const isAdult = /(women|woman|men|man|adult)/.test(g) || /(women|men|adult)/.test(c);
          return isKid && !isAdult;
        };
        const kidsOnly: Product[] = (result.data || [])
          // filter by kids predicate
          .filter((p: any) => isKidsProduct(p))
          // exclude any known misclassified IDs (safety net)
          .filter((p: any) => p?._id !== '687ddfb9331086b5654f73ac')
          // exclude products with problematic categories
          .filter((p: any) => {
            const cat = (p?.category || '').toString();
            const problematicCategories = ['Flowers', 'flowers', 'ethnic', 'Ethnic'];
            return !problematicCategories.includes(cat);
          });

        const grouped: { [category: string]: { [subcategory: string]: Product[] } } = {};
        kidsOnly.forEach((product: Product) => {
          const cat = product.category || 'Others';
          const sub = product.subcategory || 'Others';
          if (!grouped[cat]) grouped[cat] = {};
          if (!grouped[cat][sub]) grouped[cat][sub] = [];
          grouped[cat][sub].push(product);
        });

        setGroupedProducts(grouped);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const allProducts = Object.values(groupedProducts).flatMap(subcategories => Object.values(subcategories).flat());
  const bestSellers = allProducts.filter(p => p.theme?.toLowerCase().includes('best')).slice(0, 8);
  const newArrivals = allProducts.filter(p => p.theme?.toLowerCase().includes('new')).slice(0, 8);
  const categoriesList = Object.keys(groupedProducts)
    .filter(cat => {
      // Remove problematic categories that don't work properly
      const problematicCategories = ['Flowers', 'flowers', 'ethnic', 'Ethnic'];
      return !problematicCategories.includes(cat);
    })
    .map((cat) => {
      const allSubs = Object.keys(groupedProducts[cat] || {});
      // keep only subcategories that actually have products
      const subcats = allSubs.filter((s) => (groupedProducts[cat][s] || []).length > 0);
      // find first product with an image across all subcategories
      let img = '';
      for (const s of subcats) {
        const arr = groupedProducts[cat][s] || [];
        const withImg = arr.find(p => Array.isArray(p.image) && p.image[0]);
        if (withImg?.image?.[0]) { img = withImg.image[0]; break; }
      }
      
      // Double-check that this category will have products when filtered on Category page
      const totalProducts = subcats.reduce((sum, s) => sum + (groupedProducts[cat][s] || []).length, 0);
      
      return {
        name: cat,
        image: img,
        subcategories: subcats,
        productCount: totalProducts,
      };
    }).filter(c => (c.subcategories && c.subcategories.length > 0 && c.productCount > 0));
  

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-pink-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-gray-800">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        {/* Hero Banner (dynamic) */}
        <section className="relative mb-20">
          <DynamicBanner
            page="kids"
            position="featured"
            fallback={{
              imageUrl: '',
              heading: 'Playful Picks',
              description: 'Fun and vibrant styles for your little ones.',
              linkText: 'Shop Now',
              linkUrl: '/new-arrivals',
            }}
            style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
          />
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">🌈 Fun & Play</span>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-orange-200 dark:border-orange-800">
              <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">🎨 Creative</span>
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse flex gap-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center py-10">
            <p className="text-orange-600 dark:text-orange-400 font-medium">{error}</p>
          </div>
        )}

        {/* Shop by Category (Kids) - shown first */}
        {categoriesList.length > 0 && (
          <section className="mb-20">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                Shop by Category
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Discover perfect styles for your little adventurers</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {categoriesList.map((category, index) => (
                <div key={index} className="group">
                  <Link 
                    to={`/category/${encodeURIComponent(category.name.toLowerCase())}`} 
                    className="block"
                    onClick={() => { sessionStorage.setItem('kidsContext', 'true'); sessionStorage.removeItem('menContext'); }}
                  >
                    <div className="relative rounded-3xl bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-1 overflow-hidden shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                      <div className="aspect-square relative rounded-[22px] overflow-hidden">
                        <img
                          src={category.image || `https://source.unsplash.com/featured/400x400?kid,children,${encodeURIComponent(category.name)}`}
                          alt={category.name}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6 opacity-90 group-hover:opacity-100 transition-opacity">
                          <div className="transform transition-transform duration-300 group-hover:translate-y-0 translate-y-4">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-300">{category.name}</h3>
                            <div className="flex items-center text-yellow-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Explore Collection
                              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-4 px-2">
                    <ul className="flex flex-wrap gap-2 text-sm">
                      {category.subcategories.map((sub, idx) => (
                        <li key={idx}>
                          <Link 
                            to={`/category/${encodeURIComponent(category.name.toLowerCase())}/${encodeURIComponent(sub.toLowerCase())}`}
                            onClick={() => { sessionStorage.setItem('kidsContext', 'true'); sessionStorage.removeItem('menContext'); }}
                            className="inline-block px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Kids Products */}
        {/*  
        {!loading && !error && (
          <section className="mb-20">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                All Kids Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Explore our complete collection of children's fashion</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
              {allProducts.map((p) => (
                <div key={p._id} className="group transform transition-all duration-300 hover:-translate-y-1">
                  <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-[1px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <ProductCard
                      id={p._id}
                      title={p.title}
                      image={p.image?.[0]}
                      price={p.price}
                      discount={p.discount}
                      badge={p.theme?.toLowerCase().includes('best') ? 'Best Seller' : p.theme?.toLowerCase().includes('new') ? 'New Arrival' : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      */}

        {/* Special Sections */}
        
        {/* <section className="mb-16"> */}
          {/* Best Sellers Banner always visible */}
        {/* </section> */}
        {/* <section className="mb-20">
          {bestSellers.length > 0 && (
            <>
              <div className="relative mb-12">
                <DynamicBanner
                  page="kids"
                  position="best"
                  fallback={{
                    imageUrl: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/4aced3c27c234d70267aacc0142add1478e2c868?placeholderIfAbsent=true',
                    heading: 'Kids Summer Collection',
                    description: 'Light fabrics and vibrant colors for the perfect summer look.',
                    linkText: 'Shop Now',
                    linkUrl: '/categories',
                  }}
                  style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-lg border border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">✨ Most Loved by Kids</span>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Best Sellers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Top picks loved by kids and parents alike</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
                {bestSellers.map(p => (
                  <div key={p._id} className="group transform transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-[1px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <ProductCard
                        id={p._id}
                        title={p.title}
                        image={p.image?.[0]}
                        price={p.price}
                        discount={p.discount}
                        badge={'Best Seller'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>         */}
        {/* <section className="mb-20">
          {newArrivals.length > 0 && (
            <>
              <div className="relative mb-12">
                <DynamicBanner
                  page="kids"
                  position="new"
                  fallback={{
                    imageUrl: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/4aced3c27c234d70267aacc0142add1478e2c868?placeholderIfAbsent=true',
                    heading: 'New Arrivals',
                    description: 'Fresh styles for kids just in.',
                    linkText: 'Shop New',
                    linkUrl: '/new-arrivals',
                  }}
                  style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-lg border border-pink-200 dark:border-pink-800">
                    <span className="text-pink-600 dark:text-pink-400 font-semibold">🎉 Just Arrived</span>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                  New Arrivals
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Fresh and exciting styles just for your kids</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
                {newArrivals.map(p => (
                  <div key={p._id} className="group transform transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-[1px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <ProductCard
                        key={p._id}
                        id={p._id}
                        title={p.title}
                        image={p.image?.[0]}
                        price={p.price}
                        discount={p.discount}
                        badge={'New Arrival'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section> */}
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Kids;
