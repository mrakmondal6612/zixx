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

const Men = () => {
  const [groupedProducts, setGroupedProducts] = useState<{ [subcategory: string]: Product[] }>({});
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products/men'), { credentials: 'include' });
        const result = await res.json();
        if (!result.ok) throw new Error("API returned not ok");

        const grouped: { [key: string]: Product[] } = {};
        result.data.forEach((product: Product) => {
          const sub = product.subcategory || 'Others';
          if (!grouped[sub]) grouped[sub] = [];
          grouped[sub].push(product);
        });

        setGroupedProducts(grouped);
        setAllData(result.data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const allProducts = Object.values(groupedProducts).flat();
  const bestSellers = allProducts.filter(p => p.theme?.toLowerCase().includes('best')).slice(0, 8);
  const newArrivals = allProducts.filter(p => p.theme?.toLowerCase().includes('new')).slice(0, 8);

  // Build proper category -> subcategories mapping from products
  const categoriesMap: Record<string, { image: string; subcategories: Set<string> }> = {};
  allProducts.forEach((p) => {
    const cat = p.category || 'Others';
    const sub = p.subcategory || 'Others';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { image: p.image?.[0] || '', subcategories: new Set<string>() };
    }
    categoriesMap[cat].subcategories.add(sub);
  });
  const categoriesList = Object.entries(categoriesMap).map(([name, data]) => ({
    name,
    image: data.image,
    subcategories: Array.from(data.subcategories),
  }));

  return (
    <div>
      <Header />
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
          <section className="relative mb-20">
            <DynamicBanner
              page="men"
              position="featured"
              fallback={{
                imageUrl: '',
                heading: "Men's Collection",
                description: "Elevate your style with our versatile men's collection.",
                linkText: "Shop Now",
                linkUrl: "/categories/clothes?gender=men",
              }}
              style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
            />
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-blue-200 dark:border-blue-800">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">👔 Formal</span>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg flex gap-3 items-center border border-purple-200 dark:border-purple-800">
                <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">🎮 Casual</span>
              </div>
            </div>
          </section>

          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <>

              {/* Shop by Category */}
              {categoriesList.length > 0 && (
                <section className="mb-20">
                  <div className="flex flex-col items-center mb-12 text-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">DISCOVER</span>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-text-shine">Shop by Category</h2>
                    <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                    {categoriesList.map((category, index) => (
                      <div key={index} className="group">
                        <Link 
                          to={`/category/${encodeURIComponent(category.name.toLowerCase())}`} 
                          className="block"
                          onClick={() => { sessionStorage.setItem('menContext', 'true'); sessionStorage.removeItem('kidsContext'); }}
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden border border-blue-100 dark:border-blue-900">
                            <div className="aspect-square rounded-2xl overflow-hidden relative">
                              <img
                                src={category.image || '/placeholder.svg'}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                              <div className="absolute inset-0 flex flex-col justify-end p-6">
                                <h3 className="text-white text-2xl font-black drop-shadow-lg">{category.name}</h3>
                              </div>
                              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                Explore →
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className="mt-4 px-2">
                          <ul className="text-sm space-y-2">
                            {category.subcategories.map((sub, idx) => (
                              <li key={idx} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                                <Link 
                                  to={`/category/${encodeURIComponent(category.name.toLowerCase())}/${encodeURIComponent(sub.toLowerCase())}`}
                                  onClick={() => { sessionStorage.setItem('menContext', 'true'); sessionStorage.removeItem('kidsContext'); }}
                                  className="flex items-center gap-2 group"
                                >
                                  <span className="h-1 w-1 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                  <span>{sub}</span>
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

              
              {/* All Men's Products
              {allData.length > 0 && (
                <section className="mb-20">
                  <div className="flex flex-col items-center mb-12 text-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">EXPLORE</span>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-text-shine">All Men's Products</h2>
                    <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
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
              )} */}

              {/* Shop by Category */}
              {/* {Object.entries(groupedProducts).map(([subcategory, products]) => ( */}
                {/* <section key={subcategory} className="mb-16"> */}
                  {/* <DynamicBanner
                    page="men"
                    position="hero"
                    fallback={{
                      imageUrl: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7087fa7cadbd89e8fc148d4f01d42317d99eaccb?placeholderIfAbsent=true',
                      heading: "Men's Collection",
                      description: "Elevate your style with our versatile men's collection.",
                      linkText: "Shop Now",
                      linkUrl: "/categories/clothes?gender=men",
                    }}
                    style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
                  /> */}
                  {/* <h3 className="text-xl font-semibold mb-4">{subcategory}</h3> */}
                  {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {products.map((p) => (
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
                  </div> */}
                {/* </section> */}
              {/* ))} */}

              {/* Best Seller */}
              {/* {bestSellers.length > 0 && (
              <div>
                <section className="mb-20">
                  <div className="relative mb-12">
                    <DynamicBanner
                      page="men"
                      position="best"
                      fallback={{
                        imageUrl: "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/d5b391a024519f0a274f617aaa8e815af74b7883?placeholderIfAbsent=true",
                        heading: "Best Sellers",
                        description: "Discover our most popular styles loved by our customers.",
                        linkText: "Shop Best Sellers",
                        linkUrl: "/categories",
                      }}
                      style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
                    />
                    <div className="absolute -bottom-6 left-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-blue-200 dark:border-blue-800">
                      <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">Top Picks 🏆</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-12 text-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">MOST POPULAR</span>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-text-shine">Best Sellers</h2>
                    <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
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
                      />
                    ))}
                  </div>
                </section>
              </div>
              )} */}

              {/* New Arrivals */}
              {/* {newArrivals.length > 0 && (
                <section className="mb-20">
                  <div className="relative mb-12">
                    <DynamicBanner
                      page="men"
                      position="new"
                      fallback={{
                        imageUrl: 'https://res.cloudinary.com/dxtle1heo/image/upload/v1756038296/profile_pics/gatpp49d6jwhb9q2l6yv.png',
                        heading: "New Arrivals",
                        description: "Fresh styles just dropped! Check out our latest collection.",
                        linkText: "Shop New Arrivals",
                        linkUrl: "/categories",
                      }}
                      style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
                    />
                    <div className="absolute -bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-purple-200 dark:border-purple-800">
                      <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">Fresh Drops 🔥</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-12 text-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">JUST LANDED</span>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-text-shine">New Arrivals</h2>
                    <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
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
                      />
                    ))}
                  </div>
                </section>
              )} */}
            </>
          )}
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
};

export default Men;
