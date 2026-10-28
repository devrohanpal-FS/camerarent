import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, ArrowLeft, Camera, Film, Layers,
  LayoutGrid, Table as TableIcon, ArrowRight, SlidersHorizontal,
  X, Check, ArrowUpDown, Sparkles, RotateCcw
} from 'lucide-react';
import { apiRequest, getProductImageUrl } from '../utils/api';
import { SONY_SERIES_PRODUCTS, SONY_SERIES_SECTIONS, type SeriesTitleType } from '../data/sonySeriesData';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  specs?: string;
  dailyRate: number;
  weeklyRate: number;
  depositAmount: number;
  images: string;
  subcategory?: string;
  totalStock?: number;
  category: {
    name: string;
    slug: string;
  };
  vendor: {
    name: string;
  };
}

export interface EnrichedCatalogItem {
  id: string;
  seriesOrder?: number;
  seriesTitle?: SeriesTitleType;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  subcategory: string;
  sheetCategory: string;
  type: string;
  model: string;
  focalLength?: string;
  brand: string;
  mount: string;
  dailyRate: number;
  weeklyRate: number;
  depositAmount: number;
  priceOnRequest?: boolean;
  images: string;
  description: string;
  vendorName: string;
  available: boolean;
  popularity: number;
}

const BRAND_OPTIONS = [
  'Sony',
  'Canon',
  'DJI',
  'Aputure',
  'Godox',
  'Nanlite',
  'Atomos',
  'SmallHD',
  'Lilliput',
  'Sachtler',
  'Teris',
  'Manfrotto',
  'Tilta',
  'EasyRig',
  'RED',
  'Blackmagic',
  'ZEISS',
  'Sennheiser',
  'GoPro',
];

const SORT_OPTIONS = [
  { label: 'Official Series Order', value: 'series' },
  { label: 'Popularity (Most Rented)', value: 'popular' },
  { label: 'Price: Low to High (₹)', value: 'price-asc' },
  { label: 'Price: High to Low (₹)', value: 'price-desc' },
];

function getWebPSourceUrl(rawImage: string): string {
  const resolved = getProductImageUrl(rawImage);
  if (!resolved) return '';
  if (resolved.includes('unsplash.com')) {
    return resolved.includes('fm=')
      ? resolved.replace(/fm=[a-z]+/, 'fm=webp')
      : `${resolved}${resolved.includes('?') ? '&' : '?'}fm=webp&q=80`;
  }
  return resolved;
}

const LazyWebPImage = React.memo(function LazyWebPImage({
  images,
  alt,
  className = '',
}: {
  images: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const fallbackSrc = getProductImageUrl(images);
  const webpSrc = getWebPSourceUrl(images);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 animate-pulse z-0" />
      )}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 z-10">
          <Camera className="w-8 h-8 opacity-40" />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Preview</span>
        </div>
      )}

      {!errored && fallbackSrc && (
        <picture className="w-full h-full flex items-center justify-center">
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          <img
            src={fallbackSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`${className} transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      )}
    </div>
  );
});

function ProductCardSkeleton() {
  return (
    <div className="bg-white border-2 border-slate-100 rounded-[28px] p-4 space-y-4 shadow-xs animate-pulse">
      <div className="aspect-4/3 w-full rounded-2xl bg-slate-200/70 relative overflow-hidden">
        <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-slate-300/80" />
        <div className="absolute bottom-3 right-3 h-6 w-20 rounded-xl bg-slate-300/80" />
      </div>
      <div className="space-y-2.5 px-1">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-16 bg-slate-200 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-4 w-14 bg-slate-100 rounded-md" />
          <div className="h-4 w-20 bg-slate-100 rounded-md" />
        </div>
        <div className="h-3 w-full bg-slate-100 rounded" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center px-1">
        <div className="space-y-1">
          <div className="h-3 w-12 bg-slate-100 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

function inferBrand(name: string, categorySlug?: string): string {
  const n = name.toLowerCase();
  if (categorySlug === 'manpower') return 'CameraRent Crew';
  if (n.includes('sony') || n.includes('burano') || n.includes('venice')) return 'Sony';
  if (n.includes('red ') || n.includes('komodo')) return 'RED';
  if (n.includes('canon')) return 'Canon';
  if (n.includes('dji') || n.includes('ronin') || n.includes('mavic') || n.includes('inspire') || n.includes('fpv')) return 'DJI';
  if (n.includes('tilta')) return 'Tilta';
  if (n.includes('easy rig') || n.includes('easyrig')) return 'EasyRig';
  if (n.includes('aputure') || n.includes('amaran') || n.includes('nova')) return 'Aputure';
  if (n.includes('godox')) return 'Godox';
  if (n.includes('nanlite') || n.includes('nanlux') || n.includes('forza') || n.includes('pavotube')) return 'Nanlite';
  if (n.includes('atomos') || n.includes('shogun') || n.includes('ninja') || n.includes('sumo') || n.includes('monitor sum')) return 'Atomos';
  if (n.includes('smallhd')) return 'SmallHD';
  if (n.includes('lilliput')) return 'Lilliput';
  if (n.includes('sachtler')) return 'Sachtler';
  if (n.includes('teris')) return 'Teris';
  if (n.includes('manfrotto')) return 'Manfrotto';
  if (n.includes('matte led')) return 'Matte LED';
  if (n.includes('slider') || n.includes('shoulder rig') || categorySlug === 'lighting-accessories' || categorySlug === 'tripods') return 'Pro Grip';
  if (n.includes('gopro') || n.includes('hero')) return 'GoPro';
  if (n.includes('zeiss')) return 'ZEISS';
  if (n.includes('blackmagic') || n.includes('bmpcc')) return 'Blackmagic';
  if (n.includes('sennheiser') || n.includes('rode') || n.includes('speaker')) return 'Sennheiser';
  return 'Sony';
}

function inferMount(name: string, categorySlug: string): string {
  const n = name.toLowerCase();
  if (categorySlug === 'manpower') return 'On-Set Crew';
  if (categorySlug === 'drones' || n.includes('mavic') || n.includes('inspire') || n.includes('fpv')) return 'Aerial Gimbal';
  if (categorySlug === 'monitors' || n.includes('monitor') || n.includes('shogun') || n.includes('ninja')) return 'HDMI / 12G-SDI';
  if (categorySlug === 'tripods' || n.includes('tripod')) return '75mm / 100mm / 150mm Bowl';
  if (categorySlug === 'lighting-accessories') return 'Studio Grip & Matte Box';
  if (categorySlug === 'support' || n.includes('ronin') || n.includes('slider') || n.includes('rig')) return 'Universal Cine Rig';
  if (n.includes('burano') || n.includes('venice')) return 'PL Mount, Sony E-Mount';
  if (n.includes('komodo') || n.includes('red ')) return 'Canon RF, PL Mount';
  if (n.includes('canon') && n.includes('rf')) return 'Canon RF';
  if (n.includes('canon') && n.includes('ef')) return 'Canon EF';
  if (n.includes('canon')) return 'Canon RF';
  if (n.includes('tube')) return 'Pixel Tube / NATO';
  if (n.includes('matte led') || n.includes('nova')) return 'Soft Panel / Junior Pin';
  if (n.includes('aputure') || n.includes('godox') || n.includes('nanlite') || n.includes('light') || categorySlug === 'lights') return 'Bowens Mount';
  if (n.includes('sony') || n.includes('g-master') || n.includes('gm')) return 'Sony E-Mount';
  return 'Universal';
}

const MAIN_CATEGORY_TABS = [
  { id: 'All', label: 'All Equipment' },
  { id: 'Cameras', label: 'Cameras' },
  { id: 'Lenses', label: 'Lenses' },
  { id: 'Lights', label: 'Lights' },
  { id: 'Monitors', label: 'Monitors' },
  { id: 'Tripods', label: 'Tripods' },
  { id: 'Support & Rigs', label: 'Support & Rigs' },
  { id: 'Drones', label: 'Drones' },
  { id: 'Crew & Services', label: 'Crew & Services' },
] as const;

function mapCategoryParamToTab(catParam: string | null, subParam: string | null): string {
  const raw = (catParam || subParam || '').trim().toLowerCase();
  if (!raw || raw === 'all') return 'All';
  if (raw === 'cameras' || raw.includes('camera') && !raw.includes('lense') && !raw.includes('support') && !raw.includes('filter') && !raw.includes('assistant')) {
    return 'Cameras';
  }
  if (raw === 'lenses' || raw.includes('lense') || raw.includes('lens')) {
    return 'Lenses';
  }
  if (
    raw === 'lights' ||
    raw === 'lighting' ||
    raw === 'lighting-accessories' ||
    raw.includes('light') ||
    raw.includes('aputure') ||
    raw.includes('godox') ||
    raw.includes('nanlite') ||
    raw.includes('tube') ||
    raw.includes('led panel')
  ) {
    return 'Lights';
  }
  if (raw === 'monitors' || raw.includes('monitor')) return 'Monitors';
  if (raw === 'tripods' || raw.includes('tripod')) return 'Tripods';
  if (raw === 'support' || raw.includes('support') || raw.includes('rig')) return 'Support & Rigs';
  if (raw === 'drones' || raw.includes('drone')) return 'Drones';
  if (raw === 'manpower' || raw.includes('crew') || raw.includes('service')) return 'Crew & Services';
  return 'All';
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get('brand');
    return b ? b.split(',').filter(Boolean) : [];
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(() =>
    mapCategoryParamToTab(searchParams.get('category'), searchParams.get('subcategory'))
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sort') || 'series'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'sheet'>(() =>
    searchParams.get('view') === 'sheet' ? 'sheet' : 'grid'
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const deferredSearch = useDeferredValue(debouncedSearch);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setAutocompleteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedBrands.length > 0) params.brand = selectedBrands.join(',');
    if (selectedSubcategory !== 'All') params.category = selectedSubcategory;
    if (sortBy !== 'series') params.sort = sortBy;
    if (viewMode !== 'grid') params.view = viewMode;

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedBrands,
    selectedSubcategory,
    sortBy,
    viewMode,
    setSearchParams,
  ]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiRequest('/products/categories');
        if (Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await apiRequest('/products');
        if (active) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const allCatalogItems: EnrichedCatalogItem[] = useMemo(() => {
    const dbBySlug = new Map<string, Product>();
    const dbByName = new Map<string, Product>();
    for (const p of products) {
      dbBySlug.set(p.slug.toLowerCase(), p);
      dbByName.set(p.name.toLowerCase(), p);
    }

    const canonicalItems: EnrichedCatalogItem[] = SONY_SERIES_PRODUCTS.map((item, idx) => {
      const matched =
        dbBySlug.get(item.slug.toLowerCase()) ||
        dbByName.get(item.name.toLowerCase());

      const popularityBase =
        item.name.includes('FX3') || item.name.includes('FX6') || item.name.includes('24-70') || item.name.includes('50mm') || item.name.includes('A7S3') || item.name.includes('Komodo') || item.name.includes('Ronin') || item.name.includes('Mavic')
          ? 100 - idx
          : 80 - idx;

      return {
        ...item,
        id: matched?.id || item.id,
        slug: matched?.slug || item.slug,
        images: matched?.images || item.images,
        priceOnRequest: Boolean(item.priceOnRequest || item.dailyRate === 0),
        brand: inferBrand(item.name, item.categorySlug),
        mount: inferMount(item.name, item.categorySlug),
        available: matched ? (matched.totalStock ?? 1) > 0 : true,
        popularity: popularityBase,
      };
    });

    const canonicalSlugs = new Set(SONY_SERIES_PRODUCTS.map((s) => s.slug.toLowerCase()));
    const canonicalNames = new Set(SONY_SERIES_PRODUCTS.map((s) => s.name.toLowerCase()));

    const extraItems: EnrichedCatalogItem[] = products
      .filter(
        (p) =>
          !canonicalSlugs.has(p.slug.toLowerCase()) &&
          !canonicalNames.has(p.name.toLowerCase())
      )
      .map((p, idx) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: p.category?.slug || 'accessories',
        categoryName: p.category?.name || 'Gear',
        subcategory: p.subcategory || p.category?.name || 'Studio Gear',
        sheetCategory: p.subcategory || p.category?.name || 'Studio Gear',
        type:
          p.category?.slug === 'lenses'
            ? 'LENSE'
            : p.category?.slug === 'cameras'
            ? 'CINE'
            : p.category?.slug === 'drones'
            ? 'DRONE'
            : p.category?.slug === 'support'
            ? 'RIG'
            : p.category?.slug === 'manpower'
            ? 'CREW'
            : 'GEAR',
        model: p.name.split(' ').slice(1, 3).join(' ') || p.name,
        brand: inferBrand(p.name, p.category?.slug),
        mount: inferMount(p.name, p.category?.slug || ''),
        dailyRate: p.dailyRate,
        weeklyRate: p.weeklyRate,
        depositAmount: p.depositAmount,
        priceOnRequest: p.dailyRate === 0 || p.category?.slug === 'manpower',
        images: p.images,
        description: p.description,
        vendorName: p.vendor?.name || 'CameraRent Pro Studio',
        available: (p.totalStock ?? 1) > 0,
        popularity: 50 - idx,
      }));

    return [...canonicalItems, ...extraItems];
  }, [products]);

  const autocompleteSuggestions = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) {
      return allCatalogItems.slice(0, 6);
    }
    return allCatalogItems
      .filter((item) => {
        const hay = `${item.name} ${item.brand} ${item.seriesTitle || ''} ${item.sheetCategory} ${item.type} ${item.model} ${item.focalLength || ''} ${item.mount}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [allCatalogItems, deferredSearch]);

  const filteredItems = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    const filtered = allCatalogItems.filter((item) => {
      if (q) {
        const hay = `${item.name} ${item.brand} ${item.seriesTitle || ''} ${item.sheetCategory} ${item.type} ${item.model} ${item.focalLength || ''} ${item.mount} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (selectedBrands.length > 0) {
        const matchBrand = selectedBrands.some(
          (b) => item.brand.toLowerCase() === b.toLowerCase() || item.name.toLowerCase().includes(b.toLowerCase())
        );
        if (!matchBrand) return false;
      }

      if (selectedSubcategory !== 'All') {
        const tab = selectedSubcategory.toLowerCase();
        const catSlug = (item.categorySlug || '').toLowerCase();
        const series = (item.seriesTitle || '').toLowerCase();

        if (tab === 'cameras') {
          if (catSlug !== 'cameras' && series !== 'cinemetic camera' && series !== 'dslr camera') {
            return false;
          }
        } else if (tab === 'lenses') {
          if (catSlug !== 'lenses' && series !== 'camera lense' && series !== 'block lense') {
            return false;
          }
        } else if (tab === 'lights') {
          const isLight =
            catSlug === 'lights' ||
            catSlug === 'lighting-accessories' ||
            series.includes('lighting') ||
            series === 'tube lights' ||
            series === 'led panels';
          if (!isLight) return false;
        } else if (tab === 'monitors') {
          if (catSlug !== 'monitors' && series !== 'monitors') return false;
        } else if (tab === 'tripods') {
          if (catSlug !== 'tripods' && series !== 'tripods') return false;
        } else if (tab === 'support & rigs') {
          if (catSlug !== 'support' && series !== 'camera support & rigs') return false;
        } else if (tab === 'drones') {
          if (catSlug !== 'drones' && series !== 'drones') return false;
        } else if (tab === 'crew & services') {
          if (
            catSlug !== 'manpower' &&
            series !== 'manpower / production crew' &&
            series !== 'other equipment & services'
          ) {
            return false;
          }
        } else {
          const subMatch =
            series === tab ||
            item.subcategory?.toLowerCase() === tab ||
            catSlug === tab ||
            item.categoryName?.toLowerCase() === tab;
          if (!subMatch) return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') {
        if (a.priceOnRequest && !b.priceOnRequest) return 1;
        if (!a.priceOnRequest && b.priceOnRequest) return -1;
        return a.dailyRate - b.dailyRate;
      }
      if (sortBy === 'price-desc') {
        if (a.priceOnRequest && !b.priceOnRequest) return 1;
        if (!a.priceOnRequest && b.priceOnRequest) return -1;
        return b.dailyRate - a.dailyRate;
      }
      if (sortBy === 'popular') return b.popularity - a.popularity;
      const orderA = a.seriesOrder ?? 999;
      const orderB = b.seriesOrder ?? 999;
      return orderA - orderB;
    });
  }, [
    allCatalogItems,
    deferredSearch,
    selectedBrands,
    selectedSubcategory,
    sortBy,
  ]);

  const seriesGroups = useMemo(() => {
    return SONY_SERIES_SECTIONS.map((sec) => ({
      ...sec,
      items: filteredItems.filter((item) => item.seriesTitle === sec.title),
    })).filter((g) => g.items.length > 0);
  }, [filteredItems]);

  const nonSeriesFilteredItems = useMemo(() => {
    return filteredItems.filter((item) => !item.seriesTitle);
  }, [filteredItems]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedBrands([]);
    setSelectedSubcategory('All');
    setSortBy('series');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = selectedBrands.length;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!autocompleteOpen) {
      if (e.key === 'ArrowDown') setAutocompleteOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && autocompleteSuggestions[highlightedIndex]) {
        e.preventDefault();
        const target = autocompleteSuggestions[highlightedIndex];
        setAutocompleteOpen(false);
        navigate(`/products/${target.slug}`);
      } else {
        setAutocompleteOpen(false);
      }
    } else if (e.key === 'Escape') {
      setAutocompleteOpen(false);
    }
  };

  const renderFilterSidebarContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-700" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Brands
          </h2>
          {selectedBrands.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-700 text-white">
              {selectedBrands.length}
            </span>
          )}
        </div>
        {selectedBrands.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedBrands([])}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSelectedBrands([])}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            selectedBrands.length === 0
              ? 'bg-[#2a1872] hover:bg-[#1f1157] text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <span>All Brands</span>
        </button>

        {BRAND_OPTIONS.map((brand) => {
          const checked = selectedBrands.includes(brand);
          return (
            <label
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                checked
                  ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    checked
                      ? 'bg-purple-700 border-purple-700 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" />}
                </div>
                <span>{brand}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderProductCard = (item: EnrichedCatalogItem) => {
    const isPriceOnRequest = Boolean(item.priceOnRequest || item.dailyRate === 0);

    return (
      <Link
        key={item.slug}
        to={`/products/${item.slug}`}
        className="bg-white border-2 border-slate-200/80 hover:border-purple-600 rounded-[28px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between p-4"
      >
        <div>
          <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-white border border-slate-100 shrink-0">
            <LazyWebPImage
              images={item.images}
              alt={item.name}
              className={`${
                item.type === 'CREW' || item.categorySlug === 'manpower'
                  ? 'object-cover object-top p-0'
                  : 'object-contain p-3'
              } w-full h-full group-hover:scale-105 transition-transform duration-500`}
            />

            <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full z-20 tracking-wider">
              {item.seriesOrder ? item.type : item.categoryName}
            </span>

            <span className="absolute bottom-3 right-3 bg-purple-700 text-white text-xs font-black px-3 py-1 rounded-xl shadow-md z-20">
              {isPriceOnRequest
                ? 'Price on Request'
                : `₹${item.dailyRate.toLocaleString('en-IN')}/day`}
            </span>
          </div>

          <div className="pt-4 px-1 space-y-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                {item.sheetCategory}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                Model: <strong className="text-slate-800">{item.model}</strong>
              </span>
            </div>

            <h3 className="font-black text-base text-slate-900 group-hover:text-purple-700 transition line-clamp-1">
              {item.name}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                {item.brand}
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                {item.mount.split(',')[0]}
              </span>
              {item.focalLength && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                  Focal: {item.focalLength}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-slate-100 flex justify-between items-center px-1">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none">
              {isPriceOnRequest ? 'Crew / Service Rate' : 'Rental Price'}
            </span>
            {isPriceOnRequest ? (
              <div className="text-base font-black text-purple-700 mt-0.5">
                Price on Request
              </div>
            ) : (
              <div className="text-lg font-black text-slate-900 mt-0.5">
                ₹{item.dailyRate.toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-slate-500"> / day</span>
              </div>
            )}
          </div>

          <span className="px-4 py-2 rounded-xl bg-[#2a1872]/10 group-hover:bg-[#2a1872] text-[#2a1872] group-hover:text-white font-extrabold text-xs transition flex items-center gap-1">
            {isPriceOnRequest ? 'Enquire' : 'Rent Now'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-[#F8F9FC] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-purple-700 transition font-extrabold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homepage
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-extrabold shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#2a1872] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Series Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-[#2a1872] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Rate Sheet View
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Equipment Rental Catalog & Official Rate Card
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Cameras • Lenses • Lights • Monitors • Tripods • Support & Rigs • Drones • Crew & Services
              </p>
            </div>

            <div ref={searchContainerRef} className="relative w-full lg:w-96">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-purple-600 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onFocus={() => setAutocompleteOpen(true)}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setAutocompleteOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search Aputure 600d, Nanlite, SmallHD, Sachtler, RS4 Pro..."
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-600 focus:bg-white pl-11 pr-9 py-3 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setDebouncedSearch('');
                    }}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {autocompleteOpen && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-slate-200 rounded-3xl shadow-2xl z-40 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {debouncedSearch.trim()
                        ? `Matching Gear (${autocompleteSuggestions.length})`
                        : 'Popular Cinema & Production Gear'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ↵ to open
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {autocompleteSuggestions.map((item, idx) => {
                      const isPriceOnRequest = Boolean(item.priceOnRequest || item.dailyRate === 0);
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => {
                            setAutocompleteOpen(false);
                            navigate(`/products/${item.slug}`);
                          }}
                          className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                            idx === highlightedIndex
                              ? 'bg-purple-50/90'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 shrink-0 overflow-hidden">
                              <LazyWebPImage
                                images={item.images}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-black text-slate-900 truncate">
                                  {item.name}
                                </p>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                                {item.sheetCategory} • {item.type} • Model: {item.model}
                                {item.focalLength ? ` • ${item.focalLength}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {isPriceOnRequest ? (
                              <span className="text-[11px] font-black text-purple-700 block">
                                Price on Request
                              </span>
                            ) : (
                              <>
                                <span className="text-xs font-black text-purple-700 block">
                                  ₹{item.dailyRate.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  / day
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              {MAIN_CATEGORY_TABS.map((tab) => {
                const active = selectedSubcategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubcategory(tab.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                      tab.id === 'All'
                        ? active
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : active
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-purple-50/60 hover:bg-purple-100 text-slate-800 border-purple-200/70'
                    }`}
                  >
                    {tab.id === 'All' && <Layers className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-extrabold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedBrands.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Active Brand Filters:
              </span>
              {selectedBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBrand(b)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold cursor-pointer"
                >
                  Brand: {b} <X className="w-3 h-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedBrands([])}
                className="text-xs font-extrabold text-red-600 hover:underline ml-1 cursor-pointer"
              >
                Clear Brands
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8">

          <aside className="hidden lg:block w-72 shrink-0 sticky top-6 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
            {renderFilterSidebarContent()}
          </aside>

          <main className="flex-1 min-w-0 w-full space-y-10">
            {loading ? (
              <div className="space-y-6">
                <div className="h-24 w-full rounded-3xl bg-slate-200/70 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <ProductCardSkeleton key={n} />
                  ))}
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-3">
                <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-700 font-black text-base">
                  No equipment matches your selected filters.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try widening your daily price range or resetting brand and mount filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white font-extrabold text-xs cursor-pointer shadow-sm transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : sortBy !== 'series' ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5">
                  <span className="text-xs font-black text-slate-700">
                    Showing <strong className="text-purple-700">{filteredItems.length}</strong> items sorted by{' '}
                    <strong className="text-slate-900">
                      {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                    </strong>
                  </span>
                  <button
                    onClick={() => setSortBy('series')}
                    className="text-xs font-extrabold text-purple-700 hover:underline cursor-pointer"
                  >
                    Restore Series Grouping
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map((item) => renderProductCard(item))}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {seriesGroups.map((group) => (
                  <section key={group.id} className="space-y-5">
                    <div className="bg-gradient-to-r from-[#16042E] via-[#2A084E] to-[#1E0638] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-pink-300 text-[11px] font-black uppercase tracking-wider">
                          <Film className="w-3.5 h-3.5" />
                          <span>{group.badge}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                          {group.title}
                        </h2>
                        <p className="text-xs text-purple-200 font-medium">
                          {group.subtitle}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-extrabold text-purple-100">
                          Category: <strong className="text-white">{group.categoryLabel}</strong>
                        </span>
                        <span className="px-3.5 py-2 rounded-2xl bg-pink-500/20 border border-pink-400/30 text-xs font-extrabold text-pink-200">
                          Type: <strong className="text-white">{group.typeLabel}</strong>
                        </span>
                        <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-xs font-extrabold text-emerald-200">
                          {group.items.length} {group.typeLabel === 'MANPOWER' ? 'Roles' : 'Models'}
                        </span>
                      </div>
                    </div>

                    {viewMode === 'sheet' ? (
                      <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-amber-300/90 text-slate-900 border-b-2 border-slate-300 text-xs font-black uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-12 text-center">#</th>
                                <th className="py-3.5 px-4">
                                  {group.typeLabel === 'LENSE'
                                    ? 'Camera Lens Name'
                                    : group.typeLabel === 'MANPOWER'
                                    ? 'Crew Role / Service'
                                    : 'Equipment Name'}
                                </th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Type</th>
                                <th className="py-3.5 px-4">Model</th>
                                {group.typeLabel === 'LENSE' && (
                                  <th className="py-3.5 px-4">Focal Length</th>
                                )}
                                <th className="py-3.5 px-4 text-right">Price (Per Day)</th>
                                <th className="py-3.5 px-4 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                              {group.items.map((item) => {
                                const isPriceOnRequest = Boolean(item.priceOnRequest || item.dailyRate === 0);
                                return (
                                  <tr key={item.slug} className="hover:bg-purple-50/50 transition">
                                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500 text-center">
                                      {item.seriesOrder}
                                    </td>
                                    <td className="py-3.5 px-4 font-black text-slate-900">
                                      <Link
                                        to={`/products/${item.slug}`}
                                        className="flex items-center gap-3 hover:text-purple-700"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 shrink-0 overflow-hidden">
                                          <LazyWebPImage
                                            images={item.images}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                        <span>{item.name}</span>
                                      </Link>
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                                      {item.sheetCategory}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-black text-xs">
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 font-bold text-slate-800">
                                      {item.model}
                                    </td>
                                    {group.typeLabel === 'LENSE' && (
                                      <td className="py-3.5 px-4 font-bold text-purple-700">
                                        {item.focalLength}
                                      </td>
                                    )}
                                    <td className="py-3.5 px-4 text-right font-black text-base text-slate-900">
                                      {isPriceOnRequest
                                        ? 'Price on Request'
                                        : `₹${item.dailyRate.toLocaleString('en-IN')}`}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <Link
                                        to={`/products/${item.slug}`}
                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs transition"
                                      >
                                        {isPriceOnRequest ? 'Enquire' : 'Rent'} <ArrowRight className="w-3.5 h-3.5" />
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {group.items.map((item) => renderProductCard(item))}
                      </div>
                    )}
                  </section>
                ))}

                {nonSeriesFilteredItems.length > 0 && (
                  <section className="space-y-5 pt-8 border-t border-slate-200">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        Additional Studio Gear ({nonSeriesFilteredItems.length})
                      </h2>
                      <p className="text-xs text-slate-500">
                        Lighting, Audio, Gimbals, Monitors & Production Accessories
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {nonSeriesFilteredItems.map((item) => renderProductCard(item))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative z-10 w-80 max-w-[88vw] bg-white h-full overflow-y-auto p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <span className="font-black text-base text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-700" /> Filter Equipment
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderFilterSidebarContent()}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200 sticky bottom-0 bg-white flex gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white text-xs font-black shadow-md transition"
              >
                Show {filteredItems.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
