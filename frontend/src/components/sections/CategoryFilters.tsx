import React, { useEffect, useState } from "react";

interface CategoryFiltersProps {
  onChange?: (filters: {
    sizes: string[];
    colors: string[];
    priceMin?: number;
    priceMax?: number;
    sort?: string;
  }) => void;
  value?: {
    sizes?: string[];
    colors?: string[];
    priceMin?: number;
    priceMax?: number;
    sort?: string;
  };
  // optional lists derived from the current product set (pages should pass these)
  availableSizes?: string[];
  availableColors?: string[];
}

// canonical defaults and extras
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];
const EXTRA_SIZES = ["XXL", "XXXL", "4XL"];
const DEFAULT_COLORS = ["Black", "White", "Red", "Blue"];
const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({ onChange, value, availableSizes, availableColors }) => {
  const [sizes, setSizes] = useState<string[]>(value?.sizes || []);
  const [colors, setColors] = useState<string[]>(value?.colors || []);
  const [priceMin, setPriceMin] = useState<string>(
    value?.priceMin !== undefined ? String(value.priceMin) : ""
  );
  const [priceMax, setPriceMax] = useState<string>(
    value?.priceMax !== undefined ? String(value.priceMax) : ""
  );
  const [sort, setSort] = useState<string>(value?.sort || "relevance");

  // Accept optional available lists from pages via props
  const passedAvailableSizes = availableSizes;
  const passedAvailableColors = availableColors;

  // Sync internal state if parent value changes
  useEffect(() => {
    if (!value) return;
    // normalize incoming sizes/colors so they match the displayed button labels
    setSizes((value.sizes || []).map((s) => normalizeSize(String(s))));
    setColors((value.colors || []).map((c) => titleCase(normalizeColor(String(c)))));
    setPriceMin(value.priceMin !== undefined ? String(value.priceMin) : "");
    setPriceMax(value.priceMax !== undefined ? String(value.priceMax) : "");
    setSort(value.sort || "relevance");
  }, [value?.sizes, value?.colors, value?.priceMin, value?.priceMax, value?.sort]);

  // Helpers to normalize and merge available lists
  const normalizeSize = (s: string) => (s || "").toString().trim().toUpperCase();
  const normalizeColor = (c: string) => (c || "").toString().trim().toLowerCase();
  const titleCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  const buildSizesList = (): string[] => {
    // gather sizes from passedAvailableSizes if present, normalize and dedupe preserving canonical order
    const seen = new Set<string>();
    const out: string[] = [];

    // start with defaults in canonical order
    [...DEFAULT_SIZES.map(normalizeSize), ...EXTRA_SIZES.map(normalizeSize)].forEach((sz) => {
      if (sz && !seen.has(sz)) {
        seen.add(sz);
        out.push(sz);
      }
    });

    // then include any sizes coming from pages (product-derived)
    const fromProps = passedAvailableSizes || [];
    fromProps.map(normalizeSize).forEach((sz) => {
      if (sz && !seen.has(sz)) {
        seen.add(sz);
        out.push(sz);
      }
    });

    return out;
  };

  const buildColorsList = (): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];

    // prefer default colors first
    DEFAULT_COLORS.map((c) => normalizeColor(c)).forEach((c) => {
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(titleCase(c));
      }
    });

    const fromProps = passedAvailableColors || [];
    // add any product-derived colors (title-cased) preserving first-seen order
    fromProps.map(normalizeColor).forEach((c) => {
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(titleCase(c));
      }
    });

    return out;
  };

  const SIZES_LIST = buildSizesList();
  const COLORS_LIST = buildColorsList();

  // normalize available sets for quick lookup
  const availableSizesSet = new Set((passedAvailableSizes || []).map((s) => normalizeSize(String(s))));
  const availableColorsSet = new Set((passedAvailableColors || []).map((c) => normalizeColor(String(c))));

  const toggleInArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const emit = () => {
    onChange?.({
      sizes,
      colors,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
    });
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 xl:w-80 md:sticky md:top-20 md:self-start bg-white border border-gray-200 rounded-lg p-4 md:p-5">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Sort</h3>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            emit();
          }}
          className="w-full border rounded-md px-3 py-2"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES_LIST.map((s) => {
            const active = sizes.includes(s);
            const available = availableSizesSet.has(s);
            const disabledNotActive = !available && !active;
            return (
              <button
                key={s}
                onClick={() => {
                  // prevent selecting unavailable option; allow deselect if already active
                  if (disabledNotActive) return;
                  setSizes((prev) => {
                    const next = toggleInArray(prev, s);
                    setTimeout(emit, 0);
                    return next;
                  });
                }}
                disabled={disabledNotActive}
                className={`px-3 py-1.5 rounded-md border ${
                  active ? "bg-black text-white border-black" : "bg-white"
                } ${disabledNotActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS_LIST.map((c) => {
            const active = colors.includes(c);
            const normalized = normalizeColor(String(c));
            const available = availableColorsSet.has(normalized);
            const disabledNotActive = !available && !active;
            return (
              <button
                key={c}
                onClick={() => {
                  if (disabledNotActive) return;
                  setColors((prev) => {
                    const next = toggleInArray(prev, c);
                    setTimeout(emit, 0);
                    return next;
                  });
                }}
                disabled={disabledNotActive}
                className={`px-3 py-1.5 rounded-md border ${
                  active ? "bg-black text-white border-black" : "bg-white"
                } ${disabledNotActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-semibold text-lg mb-3">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={emit}
            className="w-24 border rounded-md px-3 py-2"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={emit}
            className="w-24 border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setSizes([]);
            setColors([]);
            setPriceMin("");
            setPriceMax("");
            setSort("relevance");
            setTimeout(emit, 0);
          }}
          className="px-3 py-2 border rounded-md"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

export default CategoryFilters;
