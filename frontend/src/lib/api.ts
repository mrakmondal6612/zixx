export type Product = {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  gender?: string;
  category?: string;
  subcategory?: string;
  price: number;
  discount?: number;
  rating?: number;
  theme?: string;
  size?: string[];
  color?: string[];
  image?: string[];
};

export type ProductQuery = {
  category?: string;
  subcategory?: string;
  gender?: string;
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  theme?: string;
  search?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating_desc';
  page?: number;
  limit?: number;
};

// Central API base builder
const ENV_BASE: string = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_BACKEND_URL || '';
const IS_DEV: boolean = Boolean((import.meta as any).env?.DEV);
export const RAW_BASE: string = IS_DEV ? '/api' : ENV_BASE;
export const TRIMMED_BASE = String(RAW_BASE).replace(/\/$/, '');
export const HAS_API_IN_BASE = /\/api(\/$)?$/.test(TRIMMED_BASE);
export const API_ROOT = TRIMMED_BASE
  ? (HAS_API_IN_BASE ? TRIMMED_BASE : `${TRIMMED_BASE}/api`)
  : '/api';
export const apiUrl = (p: string) => `${API_ROOT}${p.startsWith('/') ? p : `/${p}`}`;
// Build Authorization header from stored token (mobile fallback when cookies are blocked)
export function getAuthHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem('token');
    if (t) return { Authorization: `Bearer ${t}` };
  } catch {}
  return {};
}

function toQuery(params: Record<string, any>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length > 0) usp.set(k, v.join(','));
    } else if (typeof v === 'boolean') {
      usp.set(k, v ? 'true' : 'false');
    } else {
      usp.set(k, String(v));
    }
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export async function fetchProducts(query: ProductQuery) {
  // Normalize values expected by backend
  const q: any = { ...query };
  if (q.sizes) q.sizes = q.sizes.map((s: string) => s.toLowerCase());
  if (q.colors) q.colors = q.colors.map((c: string) => c.toLowerCase());
  if (q.category) q.category = q.category;
  const url = apiUrl(`/clients/products${toQuery(q)}`);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  return (await res.json()) as { ok: boolean; data: Product[]; total: number; page: number; limit: number };
}
