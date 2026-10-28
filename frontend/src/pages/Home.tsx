import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, CheckCircle2, ArrowRight, ChevronRight, Sparkles,
  MapPin, Calendar, Heart, Phone, Check, ChevronDown, MessageSquare,
  PhoneCall, Building2,
  X, Filter
} from 'lucide-react';
import { gsap } from 'gsap';
import { apiRequest, getProductImageUrl } from '../utils/api';
import {
  SonyLogo, CanonLogo, DjiLogo, AputureLogo, NanluxLogo, GoProLogo,
  RedCinemaLogo, BlackmagicLogo, ZeissLogo, SennheiserLogo,
  AmazonLogo, ZohoLogo, MarutiSuzukiLogo, PrimeVideoLogo, ZomatoLogo,
  LenskartLogo, ZeptoLogo, CodingNinjasLogo, BombayShavingLogo, GrowsterLogo
} from '../components/BrandLogos';
import { SONY_SERIES_PRODUCTS, SONY_SERIES_SECTIONS } from '../data/sonySeriesData';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  dailyRate: number;
  weeklyRate: number;
  depositAmount: number;
  images: string;
  category: {
    name: string;
    slug: string;
  };
  vendor: {
    name: string;
  };
}

const INITIAL_FEATURED_PRODUCTS: Product[] = [
  {
    id: 'feat-1',
    name: 'Canon EOS R5 8K Full-Frame Mirrorless Camera',
    slug: 'canon-eos-r5',
    description: '45MP Full-Frame CMOS Sensor, 8K30 Raw Video, Dual Pixel CMOS AF II.',
    dailyRate: 2500,
    weeklyRate: 15000,
    depositAmount: 10000,
    images: '/images/products/canon-eos-r5.jpg',
    category: { name: 'Cameras', slug: 'cameras' },
    vendor: { name: 'CameraRent Pro Studio' }
  },
  {
    id: 'feat-2',
    name: 'Sony FX3 Full-Frame Cinema Line Camera',
    slug: 'sony-fx3',
    description: '4K 120p 10-bit 4:2:2, S-Cinetone, Active Cooling, XLR Handle Unit.',
    dailyRate: 2800,
    weeklyRate: 16500,
    depositAmount: 12000,
    images: '/images/products/sony-fx3.jpg',
    category: { name: 'Cameras', slug: 'cameras' },
    vendor: { name: 'CameraRent Pro Studio' }
  },
  {
    id: 'feat-3',
    name: 'Canon RF 50mm f/1.2L USM Prime Lens',
    slug: 'canon-rf-50-f1-2l',
    description: 'Ultra-fast f/1.2 aperture prime lens for razor-sharp portraits and cinema.',
    dailyRate: 1500,
    weeklyRate: 9000,
    depositAmount: 6000,
    images: '/images/products/canon-rf-50-f1-2l.jpg',
    category: { name: 'Lenses', slug: 'lenses' },
    vendor: { name: 'Apex Cinema Rentals' }
  },
  {
    id: 'feat-4',
    name: 'Aputure LS 600d Pro Daylight LED Light',
    slug: 'aputure-ls-600d-pro',
    description: '600W COB Daylight Bowens Mount Point-Source LED for High-Output Studio Lighting.',
    dailyRate: 2200,
    weeklyRate: 13000,
    depositAmount: 8000,
    images: '/images/products/aputure-ls-600d-pro.jpg',
    category: { name: 'Lights', slug: 'lights' },
    vendor: { name: 'CameraRent Pro Studio' }
  },
  {
    id: 'feat-5',
    name: 'Sony FX6 Full-Frame Cinema Camera Body',
    slug: 'sony-fx6',
    description: 'Electronic Variable ND Filter, 15+ Stops Dynamic Range, 4K 120p Cinema Rig.',
    dailyRate: 4500,
    weeklyRate: 27000,
    depositAmount: 15000,
    images: '/images/products/sony-fx6.jpg',
    category: { name: 'Cameras', slug: 'cameras' },
    vendor: { name: 'Apex Cinema Rentals' }
  },
  {
    id: 'feat-6',
    name: 'Sony FE 24-70mm f/2.8 GM II Lens',
    slug: 'sony-fe-24-70-gm-ii',
    description: 'G Master standard zoom lens with XD Linear Motors for fast silent autofocus.',
    dailyRate: 1600,
    weeklyRate: 9500,
    depositAmount: 6000,
    images: '/images/products/sony-fe-24-70-gm-ii.jpg',
    category: { name: 'Lenses', slug: 'lenses' },
    vendor: { name: 'CameraRent Pro Studio' }
  },
  {
    id: 'feat-7',
    name: 'RED Komodo 6K Global Shutter Cinema Camera',
    slug: 'red-komodo-6k',
    description: 'Super 35 Global Shutter CMOS, 6K REDCODE RAW for Feature Films & Commercials.',
    dailyRate: 5500,
    weeklyRate: 32000,
    depositAmount: 20000,
    images: '/images/products/red-komodo-6k.jpg',
    category: { name: 'Cameras', slug: 'cameras' },
    vendor: { name: 'Apex Cinema Rentals' }
  },
  {
    id: 'feat-8',
    name: 'DJI RS 3 Pro 3-Axis Motorized Carbon Gimbal',
    slug: 'dji-rs3-pro-gimbal',
    description: '4.5kg Tested Payload, Automated Axis Locks, LiDAR Range Finder Support.',
    dailyRate: 1200,
    weeklyRate: 7000,
    depositAmount: 5000,
    images: '/images/products/dji-rs3-pro-gimbal.jpg',
    category: { name: 'Support & Rigs', slug: 'support' },
    vendor: { name: 'CameraRent Pro Studio' }
  }
];

export default function Home() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>(INITIAL_FEATURED_PRODUCTS);
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const cities = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

  const creatorCategories = [
    { name: 'Cameras', slug: 'cameras', image: '/images/products/sony-fx3.jpg', count: '45+ Cameras' },
    { name: 'Lenses', slug: 'lenses', image: '/images/products/canon-rf-50-f1-2l.jpg', count: '60+ Lenses' },
    { name: 'Lighting Equipment', slug: 'lights', image: '/images/products/aputure-ls-600d-pro.jpg', count: '40+ Lights' },
    { name: 'Monitors', slug: 'monitors', image: '/images/products/atomos-shogun-inferno-7.jpg', count: '14+ Monitors' },
    { name: 'Tripods', slug: 'tripods', image: '/images/products/sachtler-video-tripod.jpg', count: '15+ Tripods' },
    { name: 'Support & Rigs', slug: 'support', image: '/images/products/dji-ronin-2-gimbal.jpg', count: '12+ Support & Rigs' },
    { name: 'Drones', slug: 'drones', image: '/images/products/dji-mavic-3-pro.jpg', count: '5+ Aerial Drones' },
    { name: 'Lighting Accessories', slug: 'lighting-accessories', image: '/images/products/c-stand-turtle-base.jpg', count: '15+ Grip & Filters' },
    { name: 'Audio', slug: 'audio', image: '/images/products/dji-mic-2-wireless.jpg', count: '25+ Audio Kits' },
    { name: 'Manpower / Crew', slug: 'manpower', image: '/images/products/sony-fx9.jpg', count: '9+ Crew Services' },
  ];

  const gearBrands = [
    { name: 'Sony', logo: SonyLogo, logoUrl: '/images/logo/sony.png', count: '38 Products' },
    { name: 'Canon', logo: CanonLogo, logoUrl: '/images/logo/canon.png', count: '34 Products' },
    { name: 'DJI', logo: DjiLogo, logoUrl: '/images/logo/dji.png', count: '22 Products' },
    { name: 'Aputure', logo: AputureLogo, logoUrl: '/images/logo/aputure.png', count: '19 Products' },
    { name: 'Nanlux', logo: NanluxLogo, logoUrl: '/images/logo/nanlux.png', count: '12 Products' },
    { name: 'GoPro', logo: GoProLogo, logoUrl: '/images/logo/gopro.png', count: '10 Products' },
    { name: 'RED', logo: RedCinemaLogo, logoUrl: '/images/logo/red.png', count: '8 Products' },
    { name: 'Blackmagic', logo: BlackmagicLogo, logoUrl: '/images/logo/blackmagic.png', count: '15 Products' },
    { name: 'ZEISS', logo: ZeissLogo, logoUrl: '/images/logo/zeiss.png', count: '14 Products' },
    { name: 'Sennheiser', logo: SennheiserLogo, logoUrl: '/images/logo/sennheiser.png', count: '16 Products' },
  ];

  const enterpriseClients = [
    { name: 'Maruti Suzuki', logo: MarutiSuzukiLogo },
    { name: 'Amazon', logo: AmazonLogo },
    { name: 'Zoho', logo: ZohoLogo },
    { name: 'Prime Video', logo: PrimeVideoLogo },
    { name: 'Zomato', logo: ZomatoLogo },
    { name: 'Lenskart', logo: LenskartLogo },
    { name: 'Zepto', logo: ZeptoLogo },
    { name: 'Coding Ninjas', logo: CodingNinjasLogo },
    { name: 'Bombay Shaving Co', logo: BombayShavingLogo },
    { name: 'Growster', logo: GrowsterLogo },
  ];

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiRequest('/products');
        if (Array.isArray(data) && data.length > 0) {
          const flagships = data.filter((p: Product) =>
            /fx3|fx6|eos r5|komodo|24-70|50mm|600d|rs3|mavic/i.test(p.name)
          );
          const others = data.filter((p: Product) =>
            !/fx3|fx6|eos r5|komodo|24-70|50mm|600d|rs3|mavic/i.test(p.name)
          );
          setProducts([...flagships, ...others]);
        }
      } catch (err) {
        console.error('Using default featured products:', err);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-hero-content',
        { y: 20 },
        { y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' }
      );

      gsap.fromTo(
        '.gsap-brand-card',
        { y: 15, scale: 0.96 },
        { y: 0, scale: 1, stagger: 0.04, duration: 0.45, ease: 'back.out(1.4)', clearProps: 'transform' }
      );

      gsap.fromTo(
        '.gsap-cat-item',
        { y: 18, scale: 0.96 },
        { y: 0, scale: 1, stagger: 0.05, duration: 0.5, ease: 'power2.out', clearProps: 'transform' }
      );

      gsap.to('.gsap-floating-expert', {
        y: -8,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCardHover = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
    gsap.to(e.currentTarget, {
      y: enter ? -6 : 0,
      scale: enter ? 1.02 : 1,
      duration: 0.25,
      ease: 'power2.out'
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let query = `/catalog?city=${encodeURIComponent(selectedCity)}`;
    if (selectedCategory !== 'all') {
      query += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    if (searchText.trim()) {
      query += `&search=${encodeURIComponent(searchText.trim())}`;
    }
    navigate(query);
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div ref={containerRef} className="bg-[#F8F9FC] min-h-screen text-slate-900 pb-20">

      <div className="relative text-slate-900 pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-2xl">

        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <img
            src="/images/hero-banner-camera.jpg"
            alt="Hero Camera Equipment"
            className="w-full h-full object-cover object-bottom"
          />
        </div>

        <div className="max-w-7xl mx-auto space-y-10 relative z-10 gsap-hero-content">

          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 text-xs">
            <div className="flex items-center gap-6">
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCityModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white border border-slate-300 text-xs font-bold transition text-slate-900 cursor-pointer shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>Location: {selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-700 opacity-70" />
              </button>

              <Link
                to="/contact"
                className="hidden sm:inline-flex items-center gap-1.5 text-slate-900 hover:text-purple-700 transition font-bold"
              >
                <Phone className="w-3.5 h-3.5 text-purple-600" /> +91 98712 34567
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-300 text-xs font-bold text-slate-900 shadow-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>India's Premier Cinema & Camera Rental Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-black">
                POWER <span className="text-black">EVERY PRODUCTION</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-800 max-w-xl font-semibold leading-relaxed mx-auto lg:mx-0">
                Rent Professional Cameras, Cine Lenses & Production Gear for Your Next Big Shoot.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">

              </div>
            </div>

          </div>

          <div className="relative">
            <div className="relative liquid-glass rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-200/80 transition-all duration-300">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">

                <div
                  onClick={() => setCityModalOpen(true)}
                  className="w-full md:w-auto flex items-center gap-2.5 px-4 py-3 liquid-glass-input rounded-2xl cursor-pointer shrink-0"
                >
                  <MapPin className="w-4 h-4 text-[#2a1872] shrink-0" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-extrabold text-slate-600 block leading-none">City Hub</span>
                    <span className="text-xs font-black text-black">{selectedCity}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-700 ml-1" />
                </div>

                <div className="w-full md:w-auto relative shrink-0">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full md:w-44 px-4 py-3.5 liquid-glass-input rounded-2xl text-xs font-black text-black appearance-none focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white text-black py-1">All Categories</option>
                    <option value="cameras" className="bg-white text-black py-1">Cameras</option>
                    <option value="lenses" className="bg-white text-black py-1">Lenses</option>
                    <option value="lights" className="bg-white text-black py-1">Lighting Equipment</option>
                    <option value="monitors" className="bg-white text-black py-1">Monitors</option>
                    <option value="tripods" className="bg-white text-black py-1">Tripods</option>
                    <option value="support" className="bg-white text-black py-1">Camera Support & Rigs</option>
                    <option value="drones" className="bg-white text-black py-1">Drones</option>
                    <option value="lighting-accessories" className="bg-white text-black py-1">Lighting Accessories</option>
                    <option value="audio" className="bg-white text-black py-1">Audio</option>
                    <option value="manpower" className="bg-white text-black py-1">Manpower / Crew</option>
                    <option value="accessories" className="bg-white text-black py-1">Accessories</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2.5 flex-1 w-full px-4 py-2.5 liquid-glass-input rounded-2xl">
                  <Search className="w-5 h-5 text-[#2a1872] shrink-0" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="What are you Creating Today? Search Sony FX3, Canon R5, 85mm, Aputure 600d..."
                    className="w-full bg-transparent text-sm font-semibold text-black placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3.5 bg-[#2a1872] hover:bg-[#1f1157] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2a1872]/25 hover:shadow-[#2a1872]/40 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Search Gear</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pt-12">

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                Official Brand Partners
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                Search by Brands
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              Browse All Brands in Catalog <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {gearBrands.map((b, idx) => {
              const LogoComponent = b.logo;
              return (
                <button
                  key={idx}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                  onClick={() => navigate(`/catalog?brand=${encodeURIComponent(b.name)}`)}
                  className="gsap-brand-card bg-white border-2 border-slate-200/80 hover:border-purple-500 rounded-3xl p-5 text-center shadow-sm hover:shadow-xl transition-colors cursor-pointer flex flex-col items-center justify-between gap-4 group h-32"
                >
                  <div className="flex-1 w-full flex items-center justify-center px-2 py-1">
                    {b.logoUrl ? (
                      <img
                        src={b.logoUrl}
                        alt={`${b.name} logo`}
                        className="h-8 sm:h-9 w-auto max-w-[130px] max-h-9 object-contain group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <LogoComponent className="h-8 w-auto max-w-[140px]" />
                    )}
                  </div>

                  <div className="border-t border-slate-100 w-full pt-2 flex items-center justify-center text-xs">
                    <span className="font-extrabold text-slate-800 group-hover:text-purple-700">
                      {b.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Crafted</h2>
                <span className="px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
                  for Creators
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Explore categorized professional production equipment</p>
            </div>
            <Link to="/catalog" className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1">
              Explore All Categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3 sm:gap-4">
            {creatorCategories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/catalog?category=${cat.slug}`}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
                className="gsap-cat-item bg-white border-2 border-slate-200/80 hover:border-purple-500 rounded-3xl p-4 text-center shadow-sm hover:shadow-xl transition-colors flex flex-col items-center justify-between group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl bg-slate-50 p-2 flex items-center justify-center overflow-hidden border border-slate-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="mt-3 space-y-0.5 w-full">
                  <h3 className="text-xs font-black text-slate-900 group-hover:text-purple-700">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {cat.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {SONY_SERIES_SECTIONS.map((series) => {
          const seriesItems = SONY_SERIES_PRODUCTS
            .filter((item) => item.seriesTitle === series.title)
            .sort((a, b) => a.seriesOrder - b.seriesOrder);

          return (
            <section key={series.id} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-purple-200/80 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {series.badge}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      Category: {series.categoryLabel} • Type: {series.typeLabel}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    {series.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {series.subtitle}
                  </p>
                </div>
                <Link
                  to={`/catalog?subcategory=${encodeURIComponent(series.title)}`}
                  className="text-xs font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                >
                  View {series.title} in Catalog <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {seriesItems.map((item) => {
                  const dbMatch = products.find(
                    (p) =>
                      p.slug?.toLowerCase() === item.slug.toLowerCase() ||
                      p.name?.toLowerCase() === item.name.toLowerCase()
                  );
                  const resolvedImages = dbMatch?.images || item.images;
                  const isFav = wishlist.includes(item.slug);
                  const isPriceOnRequest = Boolean(item.priceOnRequest || item.dailyRate === 0);
                  return (
                    <div
                      key={item.slug}
                      onMouseEnter={(e) => handleCardHover(e, true)}
                      onMouseLeave={(e) => handleCardHover(e, false)}
                      onClick={() => navigate(`/products/${dbMatch?.slug || item.slug}`)}
                      className="rounded-3xl bg-white border-2 border-slate-200/90 hover:border-purple-600 p-5 shadow-xs hover:shadow-xl transition-colors cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3.5">
                        <div className="h-48 w-full rounded-2xl bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 border border-slate-100">
                          <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full z-20">
                            {item.type}
                          </span>

                          <button
                            onClick={(e) => toggleWishlist(item.slug, e)}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition z-20 ${isFav ? 'bg-pink-500 text-white shadow-md' : 'bg-white hover:bg-pink-50 text-slate-500 hover:text-pink-600 border border-slate-200'
                              }`}
                          >
                            <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                          </button>

                          <img
                            src={getProductImageUrl(resolvedImages)}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider">
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                              {item.sheetCategory}
                            </span>
                            <span className="text-slate-500">
                              {item.type === 'CREW' ? 'Role' : 'Model'}: <strong className="text-slate-800">{item.model}</strong>
                            </span>
                          </div>

                          <h3 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-purple-700">
                            {item.name}
                          </h3>

                          {item.focalLength && (
                            <span className="inline-block text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                              Focal Length: {item.focalLength}
                            </span>
                          )}

                          <div className="pt-1 flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none">
                                {isPriceOnRequest ? 'Crew Rate' : 'Price'}
                              </span>
                              {isPriceOnRequest ? (
                                <div className="text-base font-black text-purple-700 mt-1">
                                  Price on Request
                                </div>
                              ) : (
                                <div className="text-xl font-black text-slate-900 mt-0.5">
                                  ₹{item.dailyRate.toLocaleString('en-IN')}
                                  <span className="text-xs text-slate-500 font-semibold"> /day</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {isPriceOnRequest ? 'Available' : 'In Stock'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${dbMatch?.slug || item.slug}`);
                          }}
                          className="w-full py-2.5 bg-[#2a1872]/10 hover:bg-[#2a1872] border border-[#2a1872]/20 hover:border-[#2a1872] text-[#2a1872] hover:text-white font-extrabold text-xs rounded-xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isPriceOnRequest ? (
                            <>Book Crew • Price on Request <ArrowRight className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Rent Now • ₹{item.dailyRate.toLocaleString('en-IN')} <ArrowRight className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="pt-2 text-center">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition"
          >
            View Complete Rate Sheet & All Equipment in Catalog <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="space-y-6 sm:space-y-8 bg-white border-2 border-slate-200/80 rounded-2xl sm:rounded-[36px] p-6 sm:p-12 shadow-sm text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
              Industry Partners
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Our Clients
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              We have served some of the biggest clients and production houses in India.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {enterpriseClients.map((client, idx) => {
              const ClientLogo = client.logo;
              return (
                <div
                  key={idx}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                  className="bg-slate-50 hover:bg-white border-2 border-slate-200/80 hover:border-purple-400 rounded-2xl p-5 flex items-center justify-center h-24 shadow-xs hover:shadow-md transition-colors"
                >
                  <ClientLogo className="h-8 w-auto max-w-[140px]" />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl sm:rounded-[36px] bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100 border-2 border-purple-200 p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
          <div className="space-y-4 text-center md:text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-200 text-purple-900 text-xs font-black uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-purple-700" /> Free shoot planning
            </span>

            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Need help with your <span className="text-purple-700">shoot?</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Schedule a free 15-minute call with a CameraRent shoot expert. Get tailored advice on cameras, cine lenses, and lighting setups.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                onClick={() => setExpertModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#2a1872] hover:bg-[#1f1157] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-lg shadow-[#2a1872]/25 cursor-pointer transition active:scale-95"
              >
                <span>Book your free call</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0">
            <div className="gsap-floating-expert w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-tr from-purple-300 via-purple-200 to-indigo-100 p-2.5 shadow-2xl flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                <img
                  src="/circle4.png"
                  alt="CameraRent Shoot Expert"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl sm:rounded-[36px] bg-white border-2 border-slate-200/80 p-6 sm:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">

            <div className="md:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
                Elite Access
              </span>

              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Enterprises Solutions
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                For brands, agencies and production teams requiring multi-camera setups, custom billing, and priority logistics.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Multi-city support (Delhi NCR, Mumbai, Bengaluru, Hyderabad)</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Flexible monthly billing & corporate GST invoicing</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Dedicated account manager & 24/7 on-set replacement support</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/contact')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-sm rounded-2xl shadow-xl cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Talk to our team</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-5 bg-gradient-to-tr from-purple-50 to-indigo-50 rounded-3xl p-8 border border-purple-100 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-purple-700 text-white flex items-center justify-center shadow-xl">
                <Building2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-black text-base text-slate-900">500+ Businesses Trust CameraRent</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Custom production rates, backup standby units, and priority doorstep delivery.
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>

      {cityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" /> Select Operational City
              </h3>
              <button
                onClick={() => setCityModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setCityModalOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${selectedCity === city
                    ? 'bg-[#2a1872] text-white shadow-md'
                    : 'bg-slate-50 hover:bg-[#2a1872]/5 text-slate-700'
                    }`}
                >
                  <span>{city}</span>
                  {selectedCity === city && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {expertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setExpertModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">Free 15-Min Shoot Planning Call</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Speak directly with our senior cinematographer at our Gautam Nagar, New Delhi hub.
              </p>
            </div>

            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80 text-left space-y-2 text-xs text-slate-700 font-medium">
              <p>📍 <strong>Hub Address:</strong> 74, Basement, Gautam Nagar, New Delhi 110049</p>
              <p>📞 <strong>Direct Line:</strong> +91 98712 34567</p>
              <p>💬 <strong>WhatsApp:</strong> Instant camera package quotation</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="https://wa.me/919871234567?text=Hello%20CameraRent,%20I%20need%20assistance%20planning%20gear%20for%20my%20upcoming%20shoot."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
              </a>
              <button
                onClick={() => setExpertModalOpen(false)}
                className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
