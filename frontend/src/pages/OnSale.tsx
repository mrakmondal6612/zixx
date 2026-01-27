 
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { DynamicBanner } from '@/components/sections/DynamicBanner';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { apiUrl } from '@/lib/api';

interface Product {
  _id: string;
  title: string;
  price: number;
  discount: number; 
  rating?: string;
  category?: string;
  subcategory?: string;
  gender?: string; 
  theme?: string;
  size?: string;
  image: string[];
  createdAt?: string;
}

const OnSale = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialized = useRef(false);
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<'all' | 'men' | 'women' | 'kids'>('all');
  const [sort, setSort] = useState<'featured' | 'discount-desc' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [serverTotal, setServerTotal] = useState<number>(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const g = (searchParams.get('g') || 'all').toLowerCase();
    const s = (searchParams.get('s') || 'featured').toLowerCase();
    const p = Number(searchParams.get('p') || '1');
    const ps = Number(searchParams.get('ps') || '12');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const v = (searchParams.get('v') || 'grid').toLowerCase();

    const hasQuery = Array.from(searchParams.keys()).length > 0;
    if (!hasQuery) {
      try {
        const saved = localStorage.getItem('saleFiltersV1');
        if (saved) {
          const obj = JSON.parse(saved);
          if (obj.gender) setGender(obj.gender);
          if (obj.sort) setSort(obj.sort);
          if (typeof obj.page === 'number') setPage(obj.page);
          if (typeof obj.pageSize === 'number') setPageSize(obj.pageSize);
          if (obj.priceMin === '' || typeof obj.priceMin === 'number') setPriceMin(obj.priceMin);
          if (obj.priceMax === '' || typeof obj.priceMax === 'number') setPriceMax(obj.priceMax);
          if (obj.view === 'grid' || obj.view === 'list') setView(obj.view);
        }
      } catch {}
    }

    if (g === 'men' || g === 'women' || g === 'kids' || g === 'all') setGender(g as any);
    if (['featured','discount-desc','price-asc','price-desc','newest'].includes(s)) setSort(s as any);
    if (!Number.isNaN(p) && p > 0) setPage(p);
    if (!Number.isNaN(ps) && ps > 0) setPageSize(ps);
    if (min !== null) setPriceMin(min === '' ? '' : Math.max(0, Number(min)) || 0);
    if (max !== null) setPriceMax(max === '' ? '' : Math.max(0, Number(max)) || 0);
    if (v === 'grid' || v === 'list') setView(v as any);
  }, [searchParams]);

  useEffect(() => {
    if (!initialized.current) return; 
    const sp = new URLSearchParams();
    if (gender !== 'all') sp.set('g', gender);
    sp.set('s', sort);
    sp.set('p', String(page));
    sp.set('ps', String(pageSize));
    if (priceMin !== '' && typeof priceMin === 'number') sp.set('min', String(priceMin));
    if (priceMax !== '' && typeof priceMax === 'number') sp.set('max', String(priceMax));
    sp.set('v', view);
    setSearchParams(sp, { replace: true });
  }, [gender, sort, page, pageSize, priceMin, priceMax, view, setSearchParams]);

  useEffect(() => {
    if (!initialized.current) return;
    const payload = { gender, sort, page, pageSize, priceMin, priceMax, view };
    try { localStorage.setItem('saleFiltersV1', JSON.stringify(payload)); } catch {}
  }, [gender, sort, page, pageSize, priceMin, priceMax, view]);

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = apiUrl(`/clients/products`);

        const sortMap: Record<string, string | undefined> = {
          'featured': 'newest',
          'discount-desc': 'discount_desc',
          'price-asc': 'price_asc',
          'price-desc': 'price_desc',
          'newest': 'newest',
        };

        const params = new URLSearchParams();
        params.set('saleOnly', 'true');
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        const mappedSort = sortMap[sort];
        if (mappedSort) params.set('sort', mappedSort);
        if (gender !== 'all') params.set('gender', gender);
        if (priceMin !== '' && typeof priceMin === 'number') params.set('priceMin', String(priceMin));
        if (priceMax !== '' && typeof priceMax === 'number') params.set('priceMax', String(priceMax));

        const url = `${api}?${params.toString()}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch products');
        const result = await res.json();
        if (result?.ok && Array.isArray(result.data)) {
          setAll(result.data as Product[]);
          setServerTotal(typeof result.total === 'number' ? result.total : (result.data?.length || 0));
        } else {
          setAll([]);
          setServerTotal(0);
        }
      } catch (e: any) {
        setError(e.message || 'Something went wrong');
        setAll([]);
        setServerTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [page, pageSize, gender, sort, priceMin, priceMax]);

  // Server-side mode: backend returns already-filtered & sorted page slice
  const products = all;

  // Pagination derived values
  const total = serverTotal || products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + products.length, total);
  const pageItems = products; // already a page slice from server

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [gender, sort, priceMin, priceMax, pageSize]);

  const skeletons = Array.from({ length: 12 });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero Banner - dynamic from CMS with safe fallback */}
      <DynamicBanner
        page="sale"
        position="hero"
        fallback={{
          imageUrl: '/placeholder.svg',
          heading: 'Mega Sale Week',
          description: 'Up to 60% OFF across Men • Women • Kids',
          linkText: 'Shop Sale',
          linkUrl: '/sale',
          align: 'middle-bottom',
        }}
        style={{ variant: 'pro', overlay: 'dark', cta: 'brand', radius: '2xl', hover: 'zoom' }}
      />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        {/* Sale highlights */}
        <section className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[#D92030]">On Sale</h1>
          <p className="text-base md:text-lg text-gray-600">Grab limited-time deals before they are gone</p>
        </section>

        {/* Category sale cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { title: "Women's", colorFrom: 'from-rose-50', colorTo: 'to-rose-100', off: '50%' , link: '/women' },
            { title: "Men's", colorFrom: 'from-blue-50', colorTo: 'to-blue-100', off: '40%' , link: '/men' },
            { title: 'Kids', colorFrom: 'from-emerald-50', colorTo: 'to-emerald-100', off: '60%', link: '/kids' },
          ].map((c) => (
            <Link key={c.title} to={c.link} className="group">
              <div className={`bg-gradient-to-br ${c.colorFrom} ${c.colorTo} p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow`}>
                <div className="text-2xl font-bold text-gray-900 mb-2">{c.title} Sale</div>
                <p className="text-gray-600">Up to <span className="font-semibold text-[#D92030]">{c.off} OFF</span></p>
              </div>
            </Link>
          ))}
        </section>

        {/* Utility links */}
        <section className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'All Sale', to: '/sale' },
            { label: 'New to Sale', to: '/new-arrivals' },
            { label: 'Top Rated', to: '/category/top-rated' },
            { label: 'Accessories', to: '/categories/accessories' },
          ].map((l) => (
            <Link key={l.label} to={l.to} className="px-3 py-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-center">
              {l.label}
            </Link>
          ))}
        </section>

        {/* Mid-page promotional banner */}
        <div className="mt-12">
          <DynamicBanner
            page="sale"
            position="mid"
            fallback={{
              imageUrl: '/placeholder.svg',
              heading: 'Extra 10% off on orders over ₹1999',
              description: 'Auto-applied at checkout. Limited time.',
              linkText: 'Shop Offers',
              linkUrl: '/sale',
              align: 'middle-up',
            }}
            style={{ variant: 'pro', overlay: 'dark', cta: 'neutral', radius: '2xl', hover: 'zoom' }}
          />
        </div>

        {/* Controls */}
        <section className="mt-2 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:items-end">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Gender:</span>
            <select value={gender} onChange={e => setGender(e.target.value as any)} className="border border-gray-300 rounded-md px-2 py-1">
              <option value="all">All</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="kids">Kids</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Price:</span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              className="w-24 border border-gray-300 rounded-md px-2 py-1"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              className="w-24 border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2 text-sm justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Sort by:</span>
              <select value={sort} onChange={e => setSort(e.target.value as any)} className="border border-gray-300 rounded-md px-2 py-1">
                <option value="featured">Featured</option>
                <option value="discount-desc">Discount: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Show:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1">
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
              </select>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-gray-600">View:</span>
              <div className="flex rounded border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setView('grid')}
                  className={`px-2 py-1 text-sm ${view==='grid' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                >Grid</button>
                <button
                  onClick={() => setView('list')}
                  className={`px-2 py-1 text-sm border-l border-gray-300 ${view==='list' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                >List</button>
              </div>
            </div>
            <button
              onClick={() => { setGender('all'); setSort('featured'); setPriceMin(''); setPriceMax(''); setPage(1); setPageSize(12); setView('grid'); setSearchParams(new URLSearchParams(), { replace: true }); }}
              className="ml-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {skeletons.map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No discounted products found.</div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : 'space-y-3'}>
            {pageItems.map((product) => (
              <Link key={product._id} to={`/product/${product._id}`}>
                <Card className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${view==='list' ? 'flex' : ''}`}>
                  {view === 'grid' ? (
                    <>
                      <div className="aspect-square">
                        <img src={product.image?.[0]} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 text-left">
                        <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-1">{product.subcategory || product.category}</p>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-[#D92030]">₹{product.price}</div>
                          {product.discount > 0 && (
                            <>
                              <div className="text-gray-400 line-through">₹{Math.round(product.price / (1 - product.discount / 100))}</div>
                              <div className="text-xs font-medium text-green-600">Save {product.discount}%</div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-32 h-32 flex-shrink-0">
                        <img src={product.image?.[0]} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                        <div>
                          <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{product.subcategory || product.category}</p>
                        </div>
                        <div className="text-sm text-gray-500">{product.gender?.toUpperCase()}</div>
                        <div className="flex items-center gap-2 justify-start md:justify-end">
                          <div className="font-bold text-[#D92030]">₹{product.price}</div>
                          {product.discount > 0 && (
                            <>
                              <div className="text-gray-400 line-through">₹{Math.round(product.price / (1 - product.discount / 100))}</div>
                              <div className="text-xs font-medium text-green-600">Save {product.discount}%</div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{endIndex} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>
              {/* Simple page numbers (up to 5 around current) */}
              {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((_, idx, arr) => {
                const start = Math.max(0, currentPage - 3);
                const pageNum = start + idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 border rounded ${pageNum === currentPage ? 'bg-black text-white border-black' : 'border-gray-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OnSale;
