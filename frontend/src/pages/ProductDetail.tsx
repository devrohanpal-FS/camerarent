import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, CheckCircle2, ZoomIn, Maximize2,
  Star, Check, Package, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, Sparkles, Truck, ShieldCheck, Clock, Plus, Minus,
  ShoppingCart, Camera, Battery, HardDrive, Briefcase, Disc, Award,
  MessageSquare, Heart, X, CreditCard, UserCheck, MapPin, FileText,
  Trash2, RotateCcw, Zap
} from 'lucide-react';
import { apiRequest, getProductImageUrl, getAllProductImageUrls } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import DateRangePicker from '../components/DatePicker';

import { parseProductSpecsData } from '../components/ProductSpecsEditor';
import {
  initializeBoxItemsForProduct,
  type EditableBoxItem,
} from '../components/CheckoutBoxCustomizer';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  specs: string;
  dailyRate: number;
  weeklyRate: number;
  depositAmount: number;
  images: string;
  category: {
    name: string;
    slug?: string;
  };
  vendor: {
    name: string;
  };
  totalStock: number;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const end = new Date();
    end.setDate(end.getDate() + 3);
    end.setHours(0, 0, 0, 0);
    return end;
  });
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [addingUpsellId, setAddingUpsellId] = useState<string | null>(null);

  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const [activeBoxItems, setActiveBoxItems] = useState<EditableBoxItem[]>([]);
  const [boxPackingNote, setBoxPackingNote] = useState<string>('');
  const [newCustomItemName, setNewCustomItemName] = useState('');
  const [newCustomItemQty, setNewCustomItemQty] = useState(1);

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProductAndRelated() {
      setLoading(true);
      setError(null);
      setSelectedImageIdx(0);
      try {
        const [data, allProducts] = await Promise.all([
          apiRequest(`/products/${slug}`),
          apiRequest('/products').catch(() => []),
        ]);
        setProduct(data);

        if (Array.isArray(allProducts)) {
          const filtered = allProducts
            .filter((item: Product) => item.id !== data.id)
            .slice(0, 8);
          setRelatedProducts(filtered);
        }
      } catch (err: any) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProductAndRelated();
  }, [slug]);

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    async function checkRangeStock() {
      if (!product) return;
      if (!startDate || !endDate) {
        setAvailableStock(product.totalStock ?? 3);
        return;
      }
      setStockLoading(true);
      setStockError(null);
      try {
        const startStr = formatDateStr(startDate);
        const endStr = formatDateStr(endDate);
        const data = await apiRequest(
          `/products/${product.id}/stock-availability?startDate=${startStr}&endDate=${endStr}`
        );
        setAvailableStock(data.availableStock);
        if (quantity > data.availableStock && data.availableStock > 0) {
          setQuantity(data.availableStock);
        }
      } catch {
        setAvailableStock(product.totalStock ?? 2);
      } finally {
        setStockLoading(false);
      }
    }
    checkRangeStock();
  }, [startDate, endDate, product, quantity]);

  useEffect(() => {
    if (!product?.id) return;
    try {
      const saved = localStorage.getItem(`camerarent_custom_box_${product.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveBoxItems(parsed);
          setBoxPackingNote(localStorage.getItem(`camerarent_box_note_${product.id}`) || '');
          return;
        }
      }
    } catch {}
    setActiveBoxItems(initializeBoxItemsForProduct(product));
    setBoxPackingNote('');
  }, [product]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Equipment Specs...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8" />
        </div>
        <div className="text-slate-900 font-black text-xl">{error || 'Product not found'}</div>
        <p className="text-xs text-slate-500">The equipment you are looking for may have been moved or retired.</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2a1872] hover:bg-[#1f1157] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Equipment Catalog
        </Link>
      </div>
    );
  }

  const rawImages = getAllProductImageUrls(product.images);
  const primaryImgUrl = rawImages[0] || getProductImageUrl(product.images);
  const galleryViews = rawImages.length > 1
    ? rawImages.map((url, idx) => ({
        url,
        label: idx === 0 ? 'Main View' : `View ${idx + 1}`,
        cropClass: 'scale-100',
      }))
    : [
        { url: primaryImgUrl, label: 'Front View', cropClass: 'scale-100' },
        { url: primaryImgUrl, label: 'Close-up Detail', cropClass: 'scale-125 object-center' },
        { url: primaryImgUrl, label: 'Mount & Sensor', cropClass: 'scale-110 -rotate-2' },
        { url: primaryImgUrl, label: 'Full Kit Profile', cropClass: 'scale-95' },
      ];

  const { techSpecs: customTechSpecs } = parseProductSpecsData(product.specs);

  let parsedSpecs: { [key: string]: any } = {};
  try {
    parsedSpecs = JSON.parse(product.specs);
  } catch {
    parsedSpecs = {};
  }

  const defaultSpecs: { [key: string]: string } = {
    'Equipment Category': product.category.name,
    'Verified Partner': product.vendor.name,
    'Condition & Calibration': 'QC Passed • Sensor & Optics Cleaned',
    'Mount / Interface': product.category.name.toLowerCase().includes('canon') ? 'Canon RF / EF Mount' : 'Standard Cine / E-Mount',
    'Power & Battery': '2x High-Capacity Rechargeable Batteries Included',
    'Weather Sealing': 'Dust & Moisture Resistant Magnesium Alloy',
    'Insurance Coverage': 'Eligible for CameraRent Damage Waiver',
    'Dispatch Location': '74, Basement, Gautam Nagar, New Delhi 110049',
  };

  const displaySpecsList: Array<{ key: string; value: string }> =
    customTechSpecs.length > 0
      ? customTechSpecs
      : Object.entries({ ...defaultSpecs, ...parsedSpecs })
          .filter(([k]) => k !== 'technicalSpecs' && k !== 'whatsInTheBox' && typeof parsedSpecs[k] !== 'object')
          .map(([key, value]) => ({ key, value: String(value) }));

  let diffDays = 1;
  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  const baseRentalRaw = product.dailyRate * diffDays * quantity;
  const gstAmount = Math.round(baseRentalRaw * 0.18);
  const grandTotal = baseRentalRaw + gstAmount;

  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const effectiveStock = availableStock !== null ? availableStock : (product.totalStock || 3);

  const updateBoxItems = (newItems: EditableBoxItem[]) => {
    setActiveBoxItems(newItems);
    if (!product?.id) return;
    try {
      localStorage.setItem(`camerarent_custom_box_${product.id}`, JSON.stringify(newItems));
    } catch {}
  };

  const updatePackingNote = (note: string) => {
    setBoxPackingNote(note);
    if (!product?.id) return;
    try {
      localStorage.setItem(`camerarent_box_note_${product.id}`, note);
    } catch {}
  };

  const handleUpdateBoxItemQty = (id: string, delta: number) => {
    const updated = activeBoxItems.map((item) => {
      if (item.id === id) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter((item) => item.qty > 0);
    updateBoxItems(updated);
  };

  const handleRemoveBoxItem = (id: string) => {
    const updated = activeBoxItems.filter((item) => item.id !== id);
    updateBoxItems(updated);
  };

  const handleAddQuickPreset = (presetName: string, defaultUnit: string, qtyToAdd: number = 1) => {
    const existingIdx = activeBoxItems.findIndex(
      (item) => item.name.toLowerCase() === presetName.toLowerCase()
    );

    if (existingIdx >= 0) {
      const updated = [...activeBoxItems];
      updated[existingIdx].qty += qtyToAdd;
      updateBoxItems(updated);
    } else {
      const newItem: EditableBoxItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: presetName,
        qty: qtyToAdd,
        unit: defaultUnit,
        desc: 'Added as customer kit accessory',
        isCustom: true,
      };
      updateBoxItems([...activeBoxItems, newItem]);
    }
  };

  const handleAddNewCustomItem = () => {
    if (!newCustomItemName.trim()) return;
    const newItem: EditableBoxItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newCustomItemName.trim(),
      qty: Math.max(1, newCustomItemQty || 1),
      unit: 'Item',
      desc: 'Customer requested accessory',
      isCustom: true,
    };
    updateBoxItems([...activeBoxItems, newItem]);
    setNewCustomItemName('');
    setNewCustomItemQty(1);
  };

  const handleResetBoxItems = () => {
    const defaults = initializeBoxItemsForProduct(product);
    updateBoxItems(defaults);
    updatePackingNote('');
    try {
      localStorage.removeItem(`camerarent_custom_box_${product.id}`);
      localStorage.removeItem(`camerarent_box_note_${product.id}`);
    } catch {}
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select your rental start and end dates.');
      return;
    }

    try {
      localStorage.setItem(`camerarent_custom_box_${product.id}`, JSON.stringify(activeBoxItems));
      if (boxPackingNote.trim()) {
        localStorage.setItem(`camerarent_box_note_${product.id}`, boxPackingNote.trim());
      }
    } catch {}

    setSubmitting(true);
    try {
      await addToCart(product.id, startDate, endDate, quantity);
      setSuccess(true);
      setTimeout(() => {
        navigate('/cart');
      }, 1200);
    } catch (err: any) {
      alert(`Could not add to cart: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpsellAdd = async (upsellItem: Product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const start = startDate || new Date(Date.now() + 86400000);
    const end = endDate || new Date(Date.now() + 3 * 86400000);
    setAddingUpsellId(upsellItem.id);
    try {
      await addToCart(upsellItem.id, start, end, 1);
    } catch {
      navigate(`/products/${upsellItem.slug}`);
    } finally {
      setTimeout(() => setAddingUpsellId(null), 1000);
    }
  };

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const getBoxItemIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('batter') || n.includes('cell') || n.includes('power') || n.includes('v-mount')) return Battery;
    if (n.includes('case') || n.includes('bag') || n.includes('box') || n.includes('pelican') || n.includes('flight')) return Briefcase;
    if (n.includes('charg') || n.includes('cord') || n.includes('cable') || n.includes('dock') || n.includes('adapter')) return Zap;
    if (n.includes('card') || n.includes('drive') || n.includes('storage') || n.includes('ssd') || n.includes('media')) return HardDrive;
    if (n.includes('cap') || n.includes('hood') || n.includes('filter') || n.includes('strap') || n.includes('cover')) return Disc;
    return Camera;
  };

  const faqs = [
    {
      q: 'How does the refundable security deposit work?',
      a: `The security deposit of ₹${product.depositAmount.toLocaleString('en-IN')} per unit is 100% refundable. Once the equipment is returned and passes our standard 5-minute physical & sensor check, the full deposit is released back to your original UPI or bank account within 24 hours.`
    },

    {
      q: 'Can I pick up the equipment from your New Delhi hub or get doorstep delivery?',
      a: 'Both options are available! You can walk into our experience hub at 74, Basement, Gautam Nagar, New Delhi 110049 (Near AIIMS Metro) to test and pick up your gear, or opt for express studio/shoot doorstep delivery across Delhi NCR.'
    },
    {
      q: 'What if my shoot gets delayed or I need to extend my rental?',
      a: 'Simply message our dispatch desk on WhatsApp at least 6 hours before your return time. Subject to availability, we will extend your booking at the pro-rata discounted multi-day rate.'
    },
    {
      q: 'Is all equipment tested before handover?',
      a: 'Yes! Every camera sensor, lens element, gimbal motor, and battery undergoes a 14-point technician inspection prior to dispatch. You can also test the gear yourself at handover.'
    }
  ];

  const reviews = [
    {
      name: 'Kabir Mehta',
      role: 'Director of Photography',
      project: 'TV Commercial Shoot',
      rating: 5,
      date: '2 weeks ago',
      comment: `Rented the ${product.name} for a 4-day brand shoot in South Delhi. Sensor was spotless, batteries held full charge, and the Pelican hard case kept everything safe on set. Deposit was refunded the very next morning!`
    },
    {
      name: 'Ananya Verma',
      role: 'Independent Filmmaker',
      project: 'OTT Documentary',
      rating: 5,
      date: '1 month ago',
      comment: 'Super transparent pricing with the 7-day discount. The Gautam Nagar team helped us pair the right prime lenses and V-mount batteries during our free 15-minute shoot call.'
    },
    {
      name: 'Rohan Kapoor',
      role: 'Wedding & Fashion Cinematographer',
      project: 'Editorial Campaign',
      rating: 5,
      date: '1 month ago',
      comment: 'Zero hassle handover and spotless optics. Having live stock availability and clear GST breakdown upfront makes budgeting for client shoots effortless.'
    }
  ];

  return (
    <div className="bg-[#F8F9FC] min-h-screen text-slate-900 pb-28 lg:pb-20">
      
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-purple-700 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/catalog" className="hover:text-purple-700 transition">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/catalog?category=${product.category.slug || 'cameras'}`} className="hover:text-purple-700 transition">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold line-clamp-1 max-w-[220px] sm:max-w-xs">{product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                isWishlisted
                  ? 'bg-pink-50 border-pink-200 text-pink-600'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-3.5 h-3.5" fill={isWishlisted ? 'currentColor' : 'none'} />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-14">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-7 space-y-8">

            <div className="bg-white rounded-2xl sm:rounded-[32px] border-2 border-slate-200/80 p-3.5 sm:p-6 shadow-sm space-y-4">
              
              <div
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleImageMouseMove}
                onClick={() => setLightboxOpen(true)}
                className="relative aspect-4/3 w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center cursor-zoom-in group"
              >
                <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                    {product.category.name}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> QC Verified
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-md text-white text-[11px] font-bold pointer-events-none">
                    <ZoomIn className="w-3.5 h-3.5 text-purple-300" />
                    {isZoomed ? 'Zooming 2.2x' : 'Hover to Zoom • Click Fullscreen'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 cursor-pointer"
                    title="Open Fullscreen Lightbox"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <img
                  src={galleryViews[selectedImageIdx]?.url || primaryImgUrl}
                  alt={product.name}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isZoomed ? 'scale(2.15)' : undefined,
                  }}
                  className={`w-full h-full ${
                    product.category?.slug === 'manpower' || product.category?.name?.toLowerCase().includes('crew')
                      ? 'object-cover object-top p-0'
                      : 'object-contain p-6'
                  } transition-transform duration-200 ease-out ${
                    !isZoomed ? galleryViews[selectedImageIdx]?.cropClass || '' : ''
                  }`}
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {galleryViews.map((view, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative h-20 sm:h-24 rounded-2xl overflow-hidden border-2 bg-slate-50 p-2 flex flex-col items-center justify-center transition cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/20'
                        : 'border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={view.url}
                      alt={`${product.name} ${view.label}`}
                      className={`w-full h-full object-contain ${view.cropClass}`}
                    />
                    <span className="absolute bottom-1 inset-x-1 bg-black/60 text-white text-[9px] font-bold py-0.5 rounded text-center truncate px-1">
                      {view.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: ShieldCheck, title: 'Sensor Cleaned', sub: '14-Point QC Check', color: 'text-emerald-600 bg-emerald-50' },
                { icon: Truck, title: 'Express Dispatch', sub: 'Delhi NCR & Studio', color: 'text-purple-600 bg-purple-50' },
                { icon: Clock, title: 'Flexible Multi-Day', sub: 'Up to 30% Discount', color: 'text-blue-600 bg-blue-50' },
                { icon: Award, title: '24h Deposit Refund', sub: 'Instant UPI Release', color: 'text-amber-600 bg-amber-50' },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{feat.title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{feat.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[32px] border-2 border-slate-200/80 p-4 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Technical Datasheet</span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Technical Specifications</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {displaySpecsList.length} Attributes
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-200/70 text-xs">
                    {displaySpecsList.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600 uppercase tracking-wider text-[11px] w-2/5 sm:w-1/3 border-r border-slate-200/60">
                          {spec.key}
                        </th>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border-2 border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">What's in the Box</h2>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6D28D9] border border-purple-200">
                        Editable by Customer
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Need extra batteries, cards, or custom gear? Add or adjust items below for your shoot.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {activeBoxItems.length} Items ({activeBoxItems.reduce((s, i) => s + i.qty, 0)} units)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetBoxItems}
                    className="text-xs font-bold text-slate-500 hover:text-[#6D28D9] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition inline-flex items-center gap-1 cursor-pointer"
                    title="Reset to standard package defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset Defaults</span>
                  </button>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                      title="Edit product specs in admin dashboard"
                    >
                      Admin Edit
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-2.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Quick Add Kit Extras:
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleAddQuickPreset('High-Capacity Batteries', 'Batteries', 1)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/80 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Battery className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+1 Extra Battery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuickPreset('High-Speed Pro Media Card', '128GB', 1)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/80 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>+1 Extra 128GB Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuickPreset('Dual Fast Charger & AC Cord', 'Set', 1)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/80 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>+1 Extra Fast Charger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuickPreset('Micro/Full HDMI Cable', 'Cable', 1)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/80 border border-purple-200 text-slate-700 font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ HDMI Cable</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeBoxItems.map((item) => {
                  const Icon = getBoxItemIcon(item.name);
                  const isBattery = item.name.toLowerCase().includes('batter');

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                        item.isCustom
                          ? 'bg-purple-50/40 border-purple-200'
                          : 'bg-slate-50/80 border-slate-200/80 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveBoxItem(item.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Remove this item from box"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                          {isBattery && item.qty > 2 && (
                            <span className="inline-block mt-1 text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Boosted Battery Pack
                            </span>
                          )}
                          {item.isCustom && (
                            <span className="inline-block mt-1 text-[9px] font-black text-[#6D28D9] bg-purple-100 px-2 py-0.5 rounded-md">
                              Customer Added
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">
                          Quantity:
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateBoxItemQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                              title={item.qty === 1 ? 'Remove from box' : 'Decrease quantity'}
                            >
                              {item.qty === 1 ? (
                                <Trash2 className="w-3 h-3 text-red-500" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </button>

                            <span className="w-9 text-center font-black text-xs text-slate-900 select-none">
                              {item.qty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleUpdateBoxItemQty(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-purple-50 hover:text-[#6D28D9] transition cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-semibold text-slate-500 min-w-10">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  + Add Custom Gear or Accessory to this Box:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Extra V-Mount Battery, Card Reader, Mattebox..."
                    value={newCustomItemName}
                    onChange={(e) => setNewCustomItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCustomItem();
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={newCustomItemQty}
                      onChange={(e) => setNewCustomItemQty(Number(e.target.value) || 1)}
                      className="w-16 bg-white border border-slate-200 px-2 py-2 rounded-xl text-xs text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCustomItem}
                      className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#581c87] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Box</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-packing-notes"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Special Packing Instructions for Dispatch Hub (Optional):
                </label>
                <input
                  id="product-packing-notes"
                  type="text"
                  placeholder="e.g. Please pre-charge all batteries to 100%, include Indian AC power cords..."
                  value={boxPackingNote}
                  onChange={(e) => updatePackingNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>

            </div>

          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white rounded-2xl sm:rounded-[32px] border-2 border-slate-200/90 p-4 sm:p-7 shadow-xl space-y-5 sm:space-y-6">

              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                    {product.vendor.name}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-slate-900">4.9</span>
                    <span className="text-slate-400 font-semibold">(42 Reviews)</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h1>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                <div className="pt-2 flex items-baseline justify-between">
                  {product.dailyRate === 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-purple-700">
                        Price on Request
                      </span>
                      <span className="text-xs font-bold text-slate-500">• Custom Shift / Project Rate</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">
                          ₹{product.dailyRate.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-slate-500">/ day</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        Weekly: <strong className="text-slate-800">₹{product.weeklyRate.toLocaleString('en-IN')}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <DateRangePicker
                  productId={product.id}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />

                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  stockLoading
                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                    : isOutOfStock
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {stockLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Checking live studio inventory...</span>
                      </>
                    ) : isOutOfStock ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span>Unavailable for selected dates</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span>Live Availability: {effectiveStock} {effectiveStock === 1 ? 'Unit' : 'Units'} Ready</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Instant Lock
                  </span>
                </div>

                {stockError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {stockError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Quantity Needed</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Max {effectiveStock} units available</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock || quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-800 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black w-7 text-center text-slate-900">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                      disabled={isOutOfStock || quantity >= effectiveStock}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-800 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {product.dailyRate === 0 ? (
                <div className="bg-purple-50/70 rounded-2xl p-4 sm:p-5 border border-purple-200/90 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-purple-200/70 pb-2.5">
                    <span className="font-black text-purple-950 uppercase tracking-wider text-[11px]">
                      Production Crew / Service Rate
                    </span>
                    <span className="font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-md text-[10px] border border-purple-200">
                      {diffDays} {diffDays === 1 ? 'Day' : 'Days'} × {quantity} {quantity === 1 ? 'Crew Member' : 'Crew Members'}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Manpower and production crew rates depend on shoot call-time hours, location, and project requirements. Contact our production desk for an instant quote.
                  </p>
                  <div className="pt-2 border-t border-purple-200/70 flex items-baseline justify-between">
                    <span className="text-sm font-black text-slate-900">Rate</span>
                    <span className="text-lg font-black text-purple-700">Price on Request</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                      Transparent Price Breakdown
                    </span>
                    <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[10px]">
                      {diffDays} {diffDays === 1 ? 'Day' : 'Days'} × {quantity} {quantity === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>
                      Base Rate (₹{product.dailyRate.toLocaleString('en-IN')} × {diffDays}d{quantity > 1 ? ` × ${quantity}` : ''})
                    </span>
                    <span className="text-slate-900 font-bold">₹{baseRentalRaw.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>GST (18% on ₹{baseRentalRaw.toLocaleString('en-IN')})</span>
                    <span className="text-slate-900 font-bold">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-3 border-t-2 border-slate-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">Total Payable</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Includes 18% GST
                      </span>
                    </div>
                    <span className="text-2xl font-black text-purple-700">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {activeBoxItems && activeBoxItems.length > 0 && (
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#6D28D9] font-black">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5 text-[#6D28D9]" /> Customized In-The-Box Kit:
                    </span>
                    <span className="bg-purple-200/80 text-purple-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                      {activeBoxItems.reduce((s, i) => s + i.qty, 0)} parts
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium text-[11px] line-clamp-2 leading-relaxed">
                    {activeBoxItems.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {product.dailyRate === 0 ? (
                  <Link
                    to="/contact"
                    className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-purple-600/25 transition cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enquire Now • Price on Request</span>
                  </Link>
                ) : success ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-black text-sm py-4 rounded-2xl shadow-lg">
                    <CheckCircle2 className="w-5 h-5" /> Added to Rental Kit! Opening Cart...
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={submitting || !startDate || !endDate || stockLoading || isOutOfStock}
                    className="w-full bg-[#2a1872] hover:bg-[#1f1157] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-[#2a1872]/25 transition cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Adding to Cart...
                      </>
                    ) : isOutOfStock ? (
                      'Unavailable for Selected Dates'
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart • ₹{grandTotal.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-semibold pt-1">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> UPI QR & COD Available
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Instant Confirmation
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#2a1872]" /> Standard Rental Terms
                    </span>
                    <Link
                      to="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#2a1872] underline font-semibold hover:text-purple-700"
                    >
                      View 10 Clauses
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>1 Shift = 8 Hours (Overtime &gt;10h)</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>50% Advance on Booking</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>1 Attendant Accompanies</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Delhi Rates (+50% Outstation)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {relatedProducts.length > 0 && (
          <section className="space-y-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  Complete Your Production Rig
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                  Frequently Rented Together
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-purple-500 flex items-center justify-center text-slate-700 hover:text-purple-700 shadow-xs cursor-pointer transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-purple-500 flex items-center justify-center text-slate-700 hover:text-purple-700 shadow-xs cursor-pointer transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300"
            >
              {relatedProducts.map((item) => {
                const isJustAdded = addingUpsellId === item.id;
                const itemPriceOnRequest = item.dailyRate === 0;
                return (
                  <div
                    key={item.id}
                    className="w-64 sm:w-72 shrink-0 bg-white rounded-3xl border-2 border-slate-200/80 hover:border-purple-500 p-4 shadow-sm hover:shadow-xl transition flex flex-col justify-between group"
                  >
                    <div
                      onClick={() => navigate(`/products/${item.slug}`)}
                      className="space-y-3 cursor-pointer"
                    >
                      <div className="h-40 w-full rounded-2xl bg-slate-50 p-3 flex items-center justify-center overflow-hidden border border-slate-100">
                        <img
                          src={getProductImageUrl(item.images)}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                          {item.category?.name || 'Pro Gear'}
                        </span>
                        <h3 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-purple-700">
                          {item.name}
                        </h3>
                        <p className="text-sm font-black text-slate-900">
                          {itemPriceOnRequest ? (
                            <span className="text-purple-700">Price on Request</span>
                          ) : (
                            <>
                              ₹{item.dailyRate.toLocaleString('en-IN')}
                              <span className="text-[10px] font-semibold text-slate-500"> / day</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                      {itemPriceOnRequest ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${item.slug}`)}
                          className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#2a1872]/10 hover:bg-[#2a1872] text-[#2a1872] hover:text-white border border-[#2a1872]/20"
                        >
                          <span>View Crew Role</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpsellAdd(item)}
                          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#2a1872]/10 hover:bg-[#2a1872] text-[#2a1872] hover:text-white border border-[#2a1872]/20'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added to Kit
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Add to Kit
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-200 items-start">

          <div className="lg:col-span-7 bg-white rounded-[32px] border-2 border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Verified Crew Feedback</span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">Cinematographer Reviews</h2>
              </div>

              <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200 px-4 py-2.5 rounded-2xl">
                <div className="text-2xl font-black text-slate-900">4.9</div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Based on 42 verified rentals</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((rev, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">
                        {rev.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {rev.name}
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Verified Shoot
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {rev.role} • <span className="text-purple-700">{rev.project}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-[32px] border-2 border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Rental Policies & Support</span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isOpen ? 'border-purple-400 bg-purple-50/30' : 'border-slate-200/80 bg-slate-50/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="text-xs font-black text-slate-900 leading-snug">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-purple-700 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-purple-100 pt-2.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black">Still have technical questions?</h4>
                <p className="text-[10px] text-slate-300">Talk to our Gautam Nagar camera technicians</p>
              </div>
              <Link
                to="/contact"
                className="px-4 py-2 bg-[#2a1872] hover:bg-[#1f1157] text-white text-xs font-bold rounded-xl shrink-0 transition"
              >
                Ask Crew
              </Link>
            </div>
          </div>

        </div>

      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-slate-200 px-4 py-3 shadow-2xl">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          {product.dailyRate === 0 ? (
            <>
              <div>
                <span className="text-lg font-black text-purple-700 block">
                  Price on Request
                </span>
                <p className="text-[10px] text-slate-500 font-bold">
                  Production Crew • Custom Shift Rate
                </p>
              </div>
              <Link
                to="/contact"
                className="px-6 py-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enquire Now</span>
              </Link>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-purple-700">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  {diffDays} {diffDays === 1 ? 'Day' : 'Days'} • Inc. 18% GST
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={submitting || !startDate || !endDate || stockLoading || isOutOfStock}
                className="px-6 py-3.5 bg-[#2a1872] hover:bg-[#1f1157] disabled:bg-slate-300 text-white font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 shrink-0 cursor-pointer transition active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">{product.name}</h3>
                <p className="text-[11px] text-slate-500">{galleryViews[selectedImageIdx]?.label}</p>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[60vh] flex items-center justify-center bg-slate-50 rounded-2xl p-6 overflow-hidden">
              <img
                src={galleryViews[selectedImageIdx]?.url || primaryImgUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex justify-center gap-3">
              {galleryViews.map((view, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
