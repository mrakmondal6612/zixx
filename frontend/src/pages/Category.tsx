import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Card } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@lib/api';

interface Product {
  _id: string;
  title: string;
  price: number;
  discount: number;
  rating?: string | number;
  category: string;
  subcategory?: string;
  gender?: string;
  theme?: string;
  size?: string | string[];
  image: string[];
  brand?: string;
}

const CategoryPage: React.FC = () => {
  const { category = '', subcategory = '' } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(apiUrl('/clients/products'), { credentials: 'include' } );
        const result = await res.json();
        // Accept multiple common shapes
        let list: any = null;
        if (Array.isArray(result)) list = result;
        else if (Array.isArray(result?.data)) list = result.data;
        else if (Array.isArray(result?.products)) list = result.products;
        else if (Array.isArray(result?.data?.products)) list = result.data.products;
        if (!list) throw new Error(result.message || 'Failed to fetch');
        setProducts(list as Product[]);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Error fetching products');
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // SEO title
  useEffect(() => {
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    document.title = subcategory
      ? `${cap(subcategory)} | ${cap(category)} — Shop`
      : `${cap(category)} — Shop`;
  }, [category, subcategory]);

  // Reconcile navigation context so only one of kids/men can be active at a time.
  // Prefer referrer when available; otherwise fall back to session flags.
  useEffect(() => {
    if (!location.pathname.includes('/category/')) return;
    const refFromKids = document.referrer.includes('/kids');
    const refFromMen = document.referrer.includes('/men');
    let ctx: 'kids' | 'men' | '' = '';
    if (refFromKids) ctx = 'kids';
    else if (refFromMen) ctx = 'men';
    else {
      const k = sessionStorage.getItem('kidsContext') === 'true';
      const m = sessionStorage.getItem('menContext') === 'true';
      if (k && !m) ctx = 'kids';
      else if (m && !k) ctx = 'men';
      else if (k && m) ctx = 'kids'; // default to kids when ambiguous
    }
    if (ctx === 'kids') {
      sessionStorage.setItem('kidsContext', 'true');
      sessionStorage.removeItem('menContext');
    } else if (ctx === 'men') {
      sessionStorage.setItem('menContext', 'true');
      sessionStorage.removeItem('kidsContext');
    } else {
      sessionStorage.removeItem('kidsContext');
      sessionStorage.removeItem('menContext');
    }
  }, [location.pathname]);

  // Helper: normalize tokens to improve matching across minor naming differences
  const normalize = (v?: string) => {
    if (!v) return '';
    const base = v
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ');
    // alias map for common variants
    const aliases: Record<string, string> = {
      clothing: 'clothes',
      apparel: 'clothes',
      accessory: 'accessories',
      'featured collection': 'featured',
      toprated: 'top-rated',
      'top rated': 'top-rated',
    };
    if (aliases[base]) return aliases[base];
    // plural trim (keep words like 'clothes' intact)
    if (base.endsWith('s') && base !== 'clothes' && base !== 'flowers' && base !== 'accessories') return base.slice(0, -1);
    return base;
  };

  const normalizedCategory = normalize(category);
  const normalizedSub = normalize(subcategory);
  // Compact versions remove spaces for robust matching (e.g., "top wear" vs "topwear")
  const compact = (s: string) => s.replace(/\s+/g, '');
  const normalizedCategoryC = compact(normalizedCategory);
  const normalizedSubC = compact(normalizedSub);

  const filteredByCategory = useMemo(() => {
    // Special collection for pseudo-category routes
    if (normalizedCategory === 'top-rated') {
      const withRatings = products
        .map(p => ({ p, r: Number((p as any).rating || 0) }))
        .filter(item => !Number.isNaN(item.r) && item.r > 0);
      // Threshold can be tuned; show best first
      return withRatings
        .filter(item => item.r >= 4)
        .sort((a, b) => b.r - a.r)
        .map(item => item.p);
    }
    // Pseudo-category: new arrivals -> theme/title contains 'new'
    if (normalizedCategory === 'new arrival' || normalizedCategory === 'new') {
      return products.filter(p => {
        const t = (normalize(p.theme) || '');
        const title = (normalize(p.title) || '');
        return t.includes('new') || title.includes('new');
      });
    }
    // Pseudo-category: kids -> include items with gender kid/boy/girl OR category containing 'kid'
    if (normalizedCategory === 'kids') {
      return products.filter(p => {
        const g = (normalize(p.gender) || '');
        const c = (normalize(p.category) || '');
        return /(kid|boy|girl)/.test(g) || /kid/.test(c);
      });
    }
    // Default: strict category match first
    let categoryProducts = products.filter(p => {
      const productCat = compact(normalize(p.category));
      return productCat === normalizedCategoryC;
    });

    // If too few or zero, try subcategory-first categories (e.g., saree, kurta, shirt, topwear)
    if (categoryProducts.length === 0) {
      const bySubExact = products.filter(p => compact(normalize(p.subcategory)) === normalizedCategoryC);
      if (bySubExact.length > 0) {
        categoryProducts = bySubExact;
      }
    }

    // If still empty, try alias keyword groups for common umbrella categories
    if (categoryProducts.length === 0) {
      const kw: Record<string, string[]> = {
        ethnic: ['ethnic', 'ethnic wear', 'kurta', 'kurti', 'saree', 'sari', 'lehenga', 'sherwani', 'anarkali', 'ethnic set', 'ethnic coord', 'ethnic co-ord'],
        topwear: ['topwear', 'top wear', 'tshirt', 't-shirt', 'tee', 'shirt', 'shirts', 'polo', 'polos', 'hoodie', 'sweatshirt', 'sweater'],
        bottoms: ['bottoms', 'bottom wear', 'trouser', 'trousers', 'pant', 'pants', 'jean', 'jeans', 'chinos', 'short', 'shorts', 'skirt', 'palazzo', 'legging', 'leggings'],
        saree: ['saree', 'sari'],
        kurta: ['kurta', 'kurti'],
        accessories: ['accessory', 'accessories', 'belt', 'cap', 'hat', 'bag', 'bags', 'wallet', 'watch', 'jewellery', 'jewelry', 'scarf'],
        shirt: ['shirt', 'shirts'],
        collections: ['collection', 'collections'],
      };
      const key = normalizedCategoryC;
      const entries = Object.entries(kw);
      const matchEntry = entries.find(([k]) => k === key);
      if (matchEntry) {
        const words = matchEntry[1].map(w => compact(normalize(w)));
        categoryProducts = products.filter(p => {
          const fields = [p.category, p.subcategory, p.theme, p.brand, p.title]
            .map(x => compact(normalize((x as string) || '')));
          return words.some(w => fields.some(f => f.includes(w)));
        });
      }
    }

    // If still empty, try loose contains across subcategory, category, theme, brand, and title
    if (categoryProducts.length === 0) {
      const needle = normalizedCategoryC;
      const tokens = (normalize(category) || '').split(' ').filter(Boolean).map(compact);
      categoryProducts = products.filter(p => {
        const fields = [p.category, p.subcategory, p.theme, p.brand, p.title]
          .map(x => compact(normalize((x as string) || '')));
        // simple contains for exact/substring
        const containsNeedle = fields.some(f => f && (f === needle || f.includes(needle)));
        if (containsNeedle) return true;
        // token-based AND: every token must appear in at least one field
        if (tokens.length > 1) {
          return tokens.every(tok => fields.some(f => f.includes(tok)));
        }
        return false;
      });
    }
    
    // Determine exclusive context flags (resolved by the effect above)
    const kidsFlag = sessionStorage.getItem('kidsContext') === 'true';
    const menFlag = sessionStorage.getItem('menContext') === 'true';
    const shouldShowKidsOnly = location.pathname.includes('/category/') && kidsFlag && !menFlag;
    const shouldShowMenOnly = location.pathname.includes('/category/') && menFlag && !kidsFlag;
    
    
    if (shouldShowKidsOnly) {
      const kidsFiltered = categoryProducts.filter(p => {
        const g = (normalize(p.gender) || '');
        const c = (normalize(p.category) || '');
        return g === 'kids' || c === 'kids';
      });
      if (kidsFiltered.length > 0) {
        categoryProducts = kidsFiltered;
      }
    }
    
    if (shouldShowMenOnly) {
      const menFiltered = categoryProducts.filter(p => {
        const g = (normalize(p.gender) || '');
        const c = (normalize(p.category) || '');
        return g === 'men' || c === 'men';
      });
      if (menFiltered.length > 0) {
        categoryProducts = menFiltered;
      }
    }
    
    return categoryProducts;
  }, [products, normalizedCategory, location.pathname]);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    filteredByCategory.forEach(p => {
      if (p.subcategory) set.add(p.subcategory);
    });
    return Array.from(set).sort();
  }, [filteredByCategory]);

  // sort/filter state
  const [sortBy, setSortBy] = useState<'relevance'|'price-asc'|'price-desc'>('relevance');
  // Radix Select requires non-empty item values; use 'all' sentinel instead of ''
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Initialize brand from URL (?brand=...) and keep in sync when URL changes (e.g., back/forward)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get('brand');
    const next = brandParam && brandParam.trim() !== '' ? brandParam : 'all';
    // Avoid unnecessary state updates
    setSelectedBrand(prev => (prev === next ? prev : next));
  }, [location.search]);

  // When brand changes via UI, reflect it in the URL query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const current = params.get('brand') || 'all';
    const desired = selectedBrand || 'all';
    if (current === desired) return;
    if (desired === 'all') {
      params.delete('brand');
    } else {
      params.set('brand', desired);
    }
    const qs = params.toString();
    const path = `/category/${encodeURIComponent((category || '').toLowerCase())}${normalizedSub ? `/${encodeURIComponent(normalizedSub)}` : ''}`;
    navigate(qs ? `${path}?${qs}` : path, { replace: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand]);

  const filteredProducts = useMemo(() => {
    const stripGenderTokens = (s: string) => s.replace(/\b(girl|girls|boy|boys|kid|kids)\b/g, '').replace(/\s+/g, ' ').trim();
    let list = !normalizedSub
      ? filteredByCategory
      : filteredByCategory.filter(p => {
          const ps = compact(normalize(p.subcategory));
          if (ps === normalizedSubC) return true;
          // try after removing gender tokens from both sides
          const psBase = compact(stripGenderTokens(normalize(p.subcategory)));
          const subBase = compact(stripGenderTokens(normalizedSub));
          if (psBase && subBase && psBase === subBase) return true;
          // loose contains match as a last resort
          return ps.includes(normalizedSubC) || psBase.includes(subBase);
        });
    // brand filter (skip when 'all')
    if (selectedBrand && selectedBrand !== 'all') {
      list = list.filter(p => (p.brand || '').toLowerCase() === selectedBrand.toLowerCase());
    }
    // sort
    if (sortBy === 'price-asc') list = [...list].sort((a,b) => (a.price||0) - (b.price||0));
    if (sortBy === 'price-desc') list = [...list].sort((a,b) => (b.price||0) - (a.price||0));
    return list;
  }, [filteredByCategory, normalizedSub, selectedBrand, sortBy]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    filteredByCategory.forEach(p => { if (p.brand) set.add(p.brand); });
    return Array.from(set).sort();
  }, [filteredByCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        {/* Heading */}
        <div className="mb-6">
          <div className="flex items-end gap-3 flex-wrap">
            <h1 className="text-3xl font-bold capitalize">{decodedURIComponentSafe(category)}</h1>
            <span className="text-sm text-muted-foreground">({filteredProducts.length} items)</span>
          </div>
          {subcategory && (
            <p className="text-muted-foreground capitalize">Subcategory: {decodedURIComponentSafe(subcategory)}</p>
          )}
        </div>

        {/* Subcategory navigation */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/category/${encodeURIComponent(normalizedCategory)}`}
                className={`px-3 py-1 rounded-full text-sm border ${!normalizedSub ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'}`}
              >
                All ({filteredByCategory.length})
              </Link>
              {subcategories.map((sub) => {
                const stripGenderTokens = (s: string) => s.replace(/\b(girl|girls|boy|boys|kid|kids)\b/g, '').replace(/\s+/g, ' ').trim();
                // compute count for this sub using same logic as filteredProducts
                const subC = (sub || '').toLowerCase().replace(/\s+/g, '');
                const baseCount = filteredByCategory.filter(p => {
                  const ps = (p.subcategory ? p.subcategory.toLowerCase().replace(/\s+/g, '') : '');
                  if (ps === subC) return true;
                  const psBase = (stripGenderTokens(p.subcategory || '').toLowerCase().replace(/\s+/g, ''));
                  const subBase = (stripGenderTokens(sub).toLowerCase().replace(/\s+/g, ''));
                  if (psBase && subBase && psBase === subBase) return true;
                  return ps.includes(subC) || psBase.includes(subBase);
                }).length;
                return (
                  <Link
                    key={sub}
                    to={`/category/${encodeURIComponent(normalizedCategory)}/${encodeURIComponent(sub.toLowerCase())}`}
                    className={`px-3 py-1 rounded-full text-sm border ${normalizedSub === sub.toLowerCase() ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'}`}
                  >
                    {sub} ({baseCount})
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBrand} onValueChange={(v) => setSelectedBrand(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBrand !== 'all' && (
              <Button variant="outline" onClick={() => setSelectedBrand('all')}>Clear brand</Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{filteredProducts.length} items</div>
        </div>

        {/* Grid */}
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-muted-foreground">No products found.</div>
        ) : (
          <section className="mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
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
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

function decodedURIComponentSafe(v?: string) {
  if (!v) return '';
  try { return decodeURIComponent(v); } catch { return v; }
}

export default CategoryPage;
