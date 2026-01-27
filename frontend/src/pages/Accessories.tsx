
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import CategoryFilters from '@/components/sections/CategoryFilters';
import { fetchProducts, type Product, type ProductQuery } from '@/lib/api';

const Accessories = () => {
  const accessories = [
    { name: 'Watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&h=400', count: '45+ items' },
    { name: 'Bags', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=400', count: '60+ items' },
    { name: 'Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&h=400', count: '80+ items' },
    { name: 'Sunglasses', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&h=400', count: '35+ items' },
    { name: 'Belts', image: 'https://images.unsplash.com/photo-1553721994-1ab990d09b51?auto=format&fit=crop&w=400&h=400', count: '25+ items' },
    { name: 'Hats', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&h=400', count: '40+ items' }
  ];
  const location = useLocation();
  const underCategories = location.pathname.startsWith('/categories');

  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<{ sizes: string[]; colors: string[]; priceMin?: number; priceMax?: number; sort?: string }>({ sizes: [], colors: [], sort: 'relevance' });
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [limit, setLimit] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sizes = (searchParams.get('sizes') || '').split(',').filter(Boolean);
    const colors = (searchParams.get('colors') || '').split(',').filter(Boolean);
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const sort = searchParams.get('sort') || 'relevance';
    const p = Number(searchParams.get('page') || '1');
    const lim = Number(searchParams.get('limit') || '24');
    setFilters({
      sizes,
      colors,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
    });
    setPage(isNaN(p) || p < 1 ? 1 : p);
    setLimit(isNaN(lim) || lim < 1 ? 24 : lim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const query: ProductQuery = useMemo(() => ({
    category: 'Accessories',
    sizes: filters.sizes.map((s) => s.toLowerCase()),
    colors: filters.colors.map((c) => c.toLowerCase()),
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    sort: filters.sort as any,
    page,
    limit,
  }), [filters, page, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(query);
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
      setLimit(res.limit);
    } catch (e: any) {
      setError(e?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.sizes.length) params.sizes = filters.sizes.join(',');
    if (filters.colors.length) params.colors = filters.colors.join(',');
    if (filters.priceMin !== undefined) params.priceMin = String(filters.priceMin);
    if (filters.priceMax !== undefined) params.priceMax = String(filters.priceMax);
    if (filters.sort) params.sort = filters.sort;
    params.page = String(page);
    params.limit = String(limit);
    setSearchParams(params);
  }, [filters, page, limit, setSearchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        {underCategories && (
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
                  <BreadcrumbPage>Accessories</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <CategoryFilters
            value={filters}
            onChange={(f) => { setFilters(f); setPage(1); }}
            availableSizes={Array.from(new Set(items.flatMap((p) => p.size || []).filter(Boolean).map((s) => String(s))))}
            availableColors={Array.from(new Set(items.flatMap((p) => p.color || []).filter(Boolean).map((c) => String(c))))}
          />

          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Accessories Collection</h1>
              <p className="text-gray-600 text-base md:text-lg">Complete your look with our premium accessories</p>
            </div>

            {loading && <div className="text-gray-600">Loading products...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((p) => (
                  <div key={p._id} className="group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                    <Link to={`/product/${p._id}`} className="block">
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={p.image && p.image[0] ? p.image[0] : `https://source.unsplash.com/featured/600x600/${(p.subcategory || p.category || 'accessories').replace(/\s+/g, '+')}`}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-4">
                        <div className="font-semibold line-clamp-1">{p.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{p.description}</div>
                        <div className="mt-2 font-bold">{`₹${p.price.toFixed(2)}`}</div>
                      </div>
                    </Link>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-gray-600">No products found.</div>
                )}
              </div>
            )}

            {!loading && !error && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {total > 0 ? (
                    <>Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}</>
                  ) : (
                    <>No results</>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 border rounded disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-2 border rounded disabled:opacity-50"
                    disabled={page * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
;

export default Accessories;
