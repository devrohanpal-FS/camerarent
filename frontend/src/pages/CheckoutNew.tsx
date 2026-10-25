import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  QrCode,
  Banknote,
  Copy,
  Check,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Upload,
  X,
  Truck,
  Building2,
  ExternalLink,
  Smartphone,
  FileCheck2,
  Lock,
  RefreshCw,
  Sparkles,
  Package,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { apiRequest, getProductImageUrl } from '../utils/api';
import TermsModal from '../components/TermsModal';
import CheckoutBoxCustomizer, {
  initializeBoxItemsForProduct,
  type EditableBoxItem,
} from '../components/CheckoutBoxCustomizer';
import {
  UPI_ID,
  QR_EXPIRY_MINUTES,
  COD_MAX_AMOUNT,
  checkCodEligibility,
} from '../config/payment';

const STUDIO_PICKUP_ADDRESS =
  '74, Basement, Gautam Nagar, New Delhi, Delhi 110049';
const STUDIO_PICKUP_PINCODE = '110049';

// Strict 2-button-style system using primary brand #2a1872 (Search Gear color)
const BTN_PRIMARY =
  'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 transition cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1872] focus-visible:ring-offset-2 shadow-md shadow-[#2a1872]/20';

const BTN_SECONDARY_OUTLINE =
  'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#2a1872]/5 text-[#2a1872] border-2 border-[#2a1872] font-extrabold text-xs sm:text-sm px-4 py-2.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1872] focus-visible:ring-offset-2';

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  utr?: string;
  proof?: string;
  terms?: string;
}

const generateOrderRef = () => {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `CR-${stamp}-${rand}`;
};

export default function CheckoutNew() {
  const {
    items,
    loading: cartLoading,
    rentalTotal,
    depositTotal,
    taxTotal,
    grandTotal,
    fetchCart,
  } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Handover Mode: Delivery vs Studio Pickup
  const [handoverMode, setHandoverMode] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  // Customer & Address Fields
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('Delhi NCR');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'COD'>('UPI_QR');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [paymentProofName, setPaymentProofName] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Dynamic QR Order Reference & 10-Minute Countdown (auto-regenerates QR on expiry)
  const [orderRef, setOrderRef] = useState<string>(() => generateOrderRef());
  const [countdown, setCountdown] = useState<number>(QR_EXPIRY_MINUTES * 60);
  const [qrRegeneratedCount, setQrRegeneratedCount] = useState<number>(0);

  // Terms & Mobile UI State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // In-the-box custom gear state (per cart item)
  const [customBoxState, setCustomBoxState] = useState<Record<string, EditableBoxItem[]>>({});
  const [packingNotes, setPackingNotes] = useState<Record<string, string>>({});

  // Validation, Error Toast & Double-click Guard State
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiErrorToast, setApiErrorToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [cartInitialized, setCartInitialized] = useState(false);

  // OrderSuccess State
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    grandTotal: number;
    paymentMethod: 'UPI_QR' | 'COD';
    paymentStatus: string;
    deliveryAddress: string;
    handoverMode: 'DELIVERY' | 'PICKUP';
    recipientName: string;
    recipientPhone: string;
    utrNumber?: string;
    kitDetails?: string[];
  } | null>(null);

  const upiId = import.meta.env.VITE_UPI_ID || UPI_ID;

  const regenerateQrSession = useCallback(() => {
    setOrderRef(generateOrderRef());
    setCountdown(QR_EXPIRY_MINUTES * 60);
    setQrRegeneratedCount((c) => c + 1);
  }, []);

  // Load Cart & Pre-populate User Info
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart().finally(() => {
      setCartInitialized(true);
    });
  }, [user, navigate, fetchCart]);

  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user]);

  // Auto-initialize default "What's in the box" items for all cart products (reads customized items from ProductDetail if set)
  useEffect(() => {
    if (items && items.length > 0) {
      setCustomBoxState((prev) => {
        let changed = false;
        const next = { ...prev };
        items.forEach((item) => {
          if (!next[item.id]) {
            let kit = initializeBoxItemsForProduct(item.product);
            try {
              const saved = localStorage.getItem(`camerarent_custom_box_${item.product.id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  kit = parsed;
                }
              }
            } catch {}
            next[item.id] = kit;
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      setPackingNotes((prev) => {
        let changed = false;
        const next = { ...prev };
        items.forEach((item) => {
          if (next[item.id] === undefined) {
            try {
              const savedNote = localStorage.getItem(`camerarent_box_note_${item.product.id}`);
              if (savedNote) {
                next[item.id] = savedNote;
                changed = true;
              }
            } catch {}
          }
        });
        return changed ? next : prev;
      });
    }
  }, [items]);

  const handleBoxStateChange = (cartItemId: string, updated: EditableBoxItem[]) => {
    setCustomBoxState((prev) => ({
      ...prev,
      [cartItemId]: updated,
    }));
  };

  const handlePackingNoteChange = (cartItemId: string, note: string) => {
    setPackingNotes((prev) => ({
      ...prev,
      [cartItemId]: note,
    }));
  };

  // Empty-cart redirect to /catalog once cart finishes loading (unless order was just placed)
  useEffect(() => {
    if (cartInitialized && !cartLoading && items.length === 0 && !placedOrder) {
      navigate('/catalog', { replace: true });
    }
  }, [cartInitialized, cartLoading, items.length, placedOrder, navigate]);

  // 10-Minute Countdown Timer for UPI QR — regenerates QR automatically on expiry
  useEffect(() => {
    if (paymentMethod !== 'UPI_QR' || placedOrder) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setOrderRef(generateOrderRef());
          setQrRegeneratedCount((c) => c + 1);
          return QR_EXPIRY_MINUTES * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, placedOrder]);

  // Check COD Eligibility using config/payment.ts
  const codEligibility = useMemo(() => {
    return checkCodEligibility({
      kycStatus: user?.kycStatus,
      city: handoverMode === 'PICKUP' ? 'Delhi NCR' : city,
      grandTotal,
      items,
    });
  }, [user?.kycStatus, handoverMode, city, grandTotal, items]);

  // If COD becomes ineligible while selected, switch back to UPI_QR
  useEffect(() => {
    if (paymentMethod === 'COD' && !codEligibility.eligible) {
      setPaymentMethod('UPI_QR');
    }
  }, [paymentMethod, codEligibility.eligible]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Dynamic UPI URI:
  // upi://pay?pa=${VITE_UPI_ID}&pn=CameraRent&am=${total}&cu=INR&tn=${orderRef}
  const upiUri = `upi://pay?pa=${upiId}&pn=CameraRent&am=${grandTotal.toFixed(
    2
  )}&cu=INR&tn=${orderRef}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Optional Screenshot Upload Handler (JPG/PNG/WEBP, max 5MB)
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)
    ) {
      setErrors((prev) => ({
        ...prev,
        proof: 'Only JPG, PNG, and WEBP screenshot files are allowed.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        proof: 'Screenshot file size must be 5 MB or less.',
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, proof: undefined }));
    setPaymentProofName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      nextErrors.name = 'Please enter your full name.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const indianTenDigit =
      cleanPhone.length === 12 && cleanPhone.startsWith('91')
        ? cleanPhone.slice(2)
        : cleanPhone;

    if (!/^[6-9]\d{9}$/.test(indianTenDigit)) {
      nextErrors.phone =
        'Please enter a valid 10-digit Indian mobile number.';
    }

    if (handoverMode === 'DELIVERY') {
      if (!address.trim() || address.trim().length < 8) {
        nextErrors.address =
          'Please enter a complete street/studio delivery address.';
      }
      if (!city.trim()) {
        nextErrors.city = 'Please select or enter a city.';
      }
      if (!/^\d{6}$/.test(pincode.trim())) {
        nextErrors.pincode = 'Please enter a valid 6-digit pincode.';
      }
    }

    if (paymentMethod === 'UPI_QR') {
      if (!/^\d{12}$/.test(utrNumber.trim())) {
        nextErrors.utr = 'Please enter a valid 12-digit UTR number.';
      }
    } else if (paymentMethod === 'COD') {
      if (!codEligibility.eligible) {
        setApiErrorToast(
          codEligibility.reason ||
            'Cash on Delivery is not eligible for this order.'
        );
        return false;
      }
    }

    if (!termsAccepted) {
      nextErrors.terms =
        'Please accept the terms & rental policy to continue.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isUtrValid = /^\d{12}$/.test(utrNumber.trim());

  const isPlaceOrderDisabled =
    submitting ||
    items.length === 0 ||
    !termsAccepted ||
    (paymentMethod === 'UPI_QR' && !isUtrValid) ||
    (paymentMethod === 'COD' && !codEligibility.eligible);

  const placeOrderLabel =
    paymentMethod === 'COD' ? 'Place Order (Pay on Delivery)' : 'Place Order';

  // Progress Step calculation
  const cleanPhoneForProgress = phone.replace(/\D/g, '');
  const normalizedPhoneForProgress =
    cleanPhoneForProgress.length === 12 && cleanPhoneForProgress.startsWith('91')
      ? cleanPhoneForProgress.slice(2)
      : cleanPhoneForProgress;

  const isDetailsComplete =
    fullName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(normalizedPhoneForProgress) &&
    (handoverMode === 'PICKUP' ||
      (address.trim().length >= 8 &&
        city.trim().length > 0 &&
        /^\d{6}$/.test(pincode.trim())));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingRef.current || submitting) return;

    setApiErrorToast(null);

    if (!validateForm()) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const resolvedAddress =
        handoverMode === 'PICKUP'
          ? `STUDIO PICKUP: ${STUDIO_PICKUP_ADDRESS} (Pin: ${STUDIO_PICKUP_PINCODE})`
          : `${address.trim()}, ${city.trim()} - ${pincode.trim()}`;

      // Build summary of custom kit items & packing instructions
      const kitSummaries = items.map((cartItem) => {
        const boxList = customBoxState[cartItem.id] || [];
        const packingNote = packingNotes[cartItem.id]?.trim();
        const itemsStr = boxList.map((b) => `${b.qty}x ${b.name}`).join(', ');
        let summary = `${cartItem.product.name} [Kit: ${itemsStr || 'Standard'}]`;
        if (packingNote) {
          summary += ` (Special Note: ${packingNote})`;
        }
        return summary;
      });

      const kitContentsString = kitSummaries.join(' | ');

      const details = [
        `Handover: ${
          handoverMode === 'PICKUP'
            ? 'Studio Pickup (Gautam Nagar Hub)'
            : 'Doorstep Delivery'
        }`,
        `Recipient: ${fullName.trim()} (${phone.trim()})`,
        paymentMethod === 'UPI_QR'
          ? `UPI QR (Ref: ${orderRef}, UTR: ${utrNumber.trim()})`
          : 'Cash on Delivery (COD)',
        `Custom Kit Contents: ${kitContentsString}`,
      ].join(' | ');

      const result = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          deliveryAddress: resolvedAddress,
          deliveryDetails: details,
          paymentMethod,
          utrNumber: paymentMethod === 'UPI_QR' ? utrNumber.trim() : undefined,
          paymentProofUrl:
            paymentMethod === 'UPI_QR' && paymentProofUrl
              ? paymentProofUrl
              : undefined,
          paymentId: paymentMethod === 'UPI_QR' ? utrNumber.trim() : 'COD',
        }),
      });

      const createdOrder = result.order;
      setPlacedOrder({
        orderNumber: createdOrder.orderNumber,
        grandTotal: createdOrder.grandTotal || grandTotal,
        paymentMethod,
        paymentStatus: createdOrder.paymentStatus || 'PENDING',
        deliveryAddress: resolvedAddress,
        handoverMode,
        recipientName: fullName.trim(),
        recipientPhone: phone.trim(),
        utrNumber: paymentMethod === 'UPI_QR' ? utrNumber.trim() : undefined,
        kitDetails: kitSummaries,
      });

      // Clear local cart state only on success
      useCartStore.setState({
        items: [],
        rentalTotal: 0,
        depositTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
      });
    } catch (err: any) {
      // Keep cart intact and show error toast
      setApiErrorToast(
        err.message ||
          'Order placement failed. Your cart items are still intact — please try again.'
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ============================================================================
  // 1. LOADING SKELETON STATE
  // ============================================================================
  if (!cartInitialized || (cartLoading && items.length === 0 && !placedOrder)) {
    return (
      <div
        className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6"
        aria-busy="true"
        aria-label="Loading checkout"
      >
        <div className="h-14 w-full bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. ORDER SUCCESS PAGE
  // ============================================================================
  if (placedOrder) {
    const isVerificationPending = placedOrder.paymentStatus === 'VERIFICATION';
    const customKitMsg = placedOrder.kitDetails?.length
      ? `. Custom Kit: ${placedOrder.kitDetails.join('; ')}`
      : '';
    const waSupportText = encodeURIComponent(
      `Hi CameraRent! I have placed Order #${placedOrder.orderNumber} (Total: ₹${placedOrder.grandTotal.toFixed(
        2
      )}, Method: ${placedOrder.paymentMethod}, Status: ${placedOrder.paymentStatus}${
        placedOrder.utrNumber ? `, UTR: ${placedOrder.utrNumber}` : ''
      }${customKitMsg}). Please confirm dispatch/pickup details.`
    );

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 ${
              isVerificationPending
                ? 'bg-amber-50 border-amber-400 text-amber-800'
                : 'bg-emerald-50 border-emerald-500 text-emerald-800'
            }`}
          >
            {isVerificationPending ? (
              <Clock className="w-8 h-8" />
            ) : (
              <CheckCircle2 className="w-9 h-9" />
            )}
          </div>

          <div className="space-y-2" aria-live="polite">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                isVerificationPending
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}
            >
              {isVerificationPending
                ? 'Payment Verification Pending'
                : 'Order Confirmed • Pay on Delivery'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {isVerificationPending
                ? 'Order Placed — Verifying Payment'
                : 'Order Confirmed!'}
            </h1>

            <p className="text-sm font-mono font-extrabold text-[#6D28D9]">
              Order ID: #{placedOrder.orderNumber}
            </p>
          </div>

          {/* Order Details Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Order ID</span>
              <span className="font-mono font-bold text-slate-900">
                #{placedOrder.orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Total Payable</span>
              <span className="font-black text-slate-900 text-base">
                ₹{placedOrder.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Payment Method</span>
              <span className="font-bold text-slate-900">
                {placedOrder.paymentMethod === 'UPI_QR'
                  ? 'UPI / QR Code'
                  : 'Cash on Delivery (COD)'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Payment Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  isVerificationPending
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-purple-100 text-[#6D28D9]'
                }`}
              >
                {placedOrder.paymentStatus}
              </span>
            </div>

            {placedOrder.utrNumber && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">12-Digit UTR</span>
                <span className="font-mono font-bold text-slate-900">
                  {placedOrder.utrNumber}
                </span>
              </div>
            )}

            <div className="space-y-1 pt-1 pb-1">
              <span className="text-slate-600 font-semibold block">
                {placedOrder.handoverMode === 'PICKUP'
                  ? 'Studio Pickup Details:'
                  : 'Delivery Details:'}
              </span>
              <p className="font-bold text-slate-900">
                {placedOrder.recipientName} • {placedOrder.recipientPhone}
              </p>
              <p className="font-medium text-slate-700 leading-relaxed">
                {placedOrder.deliveryAddress}
              </p>
            </div>

            {/* Custom Box Kit Summary */}
            {placedOrder.kitDetails && placedOrder.kitDetails.length > 0 && (
              <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 text-xs space-y-2 text-left">
                <div className="font-extrabold text-[#6D28D9] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Package className="w-4 h-4 text-[#6D28D9]" /> Customized In-The-Box Contents
                </div>
                <div className="space-y-1.5 text-slate-800 text-xs">
                  {placedOrder.kitDetails.map((k, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span className="text-[#6D28D9] font-black text-xs shrink-0">✓</span>
                      <span className="font-medium leading-relaxed">{k}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic pt-0.5">
                  Your customized accessory count has been logged for our prep & dispatch warehouse team.
                </p>
              </div>
            )}
          </div>

          {/* Two Button Styles Only: Primary Filled (#6D28D9) and Secondary Outline */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/919871234567?text=${waSupportText}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_PRIMARY} flex-1`}
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Support
            </a>

            <Link to="/dashboard" className={`${BTN_SECONDARY_OUTLINE} flex-1`}>
              View in Dashboard
            </Link>

            <Link to="/catalog" className={BTN_SECONDARY_OUTLINE}>
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // REUSABLE ORDER SUMMARY CONTENT (Right Sticky Column + Mobile Collapsible)
  // ============================================================================
  const renderOrderSummaryContent = () => (
    <div className="space-y-4">
      {/* Item Thumbnails, Names, Rental Dates & Number of Days */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img
                src={getProductImageUrl(item.product.images)}
                alt={item.product.name}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                {item.product.name}
              </h4>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                <span>
                  {new Date(item.startDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}{' '}
                  –{' '}
                  {new Date(item.endDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
                <span className="font-extrabold text-slate-800">
                  ({item.rentalDays} {item.rentalDays === 1 ? 'day' : 'days'})
                </span>
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-600 font-semibold">
                  Qty {item.quantity} × ₹{item.product.dailyRate.toLocaleString('en-IN')}/day
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  ₹{(item.rentalCost || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Customized Box Items Preview */}
              {customBoxState[item.id] && customBoxState[item.id].length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] bg-purple-50/70 p-2 rounded-lg">
                  <div className="font-extrabold flex items-center justify-between text-[#6D28D9]">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-[#6D28D9]" /> Custom Box Kit:
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded">
                      {customBoxState[item.id].reduce((sum, b) => sum + b.qty, 0)} units
                    </span>
                  </div>
                  <p className="line-clamp-2 text-slate-700 font-medium mt-1 leading-snug">
                    {customBoxState[item.id].map((b) => `${b.qty}x ${b.name}`).join(', ')}
                  </p>
                  {packingNotes[item.id] && (
                    <p className="text-[10px] text-slate-500 italic mt-0.5 truncate">
                      Note: "{packingNotes[item.id]}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Price Breakdown using cartStore calculations */}
      <div className="space-y-2.5 pt-4 border-t border-slate-200 text-xs sm:text-sm">
        <div className="flex justify-between text-slate-700">
          <span>Equipment Rent</span>
          <span className="font-bold text-slate-900">
            ₹{rentalTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between text-slate-700">
          <span>Multi-Day Discount</span>
          <span className="font-bold text-emerald-700">-₹0</span>
        </div>

        {/* Refundable Deposit highlighted "Refundable" */}
        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-950">
          <span className="flex items-center gap-1.5 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Security Deposit</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
              Refundable
            </span>
          </span>
          <span className="font-extrabold text-slate-900">
            ₹{depositTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between text-slate-700">
          <span>GST (18%)</span>
          <span className="font-bold text-slate-900">
            ₹{taxTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="text-base font-black text-slate-900 block">
              Total Payable
            </span>
            <span className="text-[11px] text-slate-600 font-medium">
              Includes ₹{depositTotal.toLocaleString('en-IN')} refundable deposit
            </span>
          </div>
          <span className="text-2xl font-black text-[#6D28D9]">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Trust Strip: Insured gear, Sensor tested, Deposit refund */}
      <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-[#6D28D9]" />
          <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
            Insured gear
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <Sparkles className="w-4 h-4 text-[#6D28D9]" />
          <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
            Sensor tested
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-[#6D28D9]" />
          <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
            Deposit refund
          </span>
        </div>
      </div>
    </div>
  );

  const kycStatus = user?.kycStatus || 'NONE';

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-28 lg:pb-12">
      {/* Top Bar & Progress Indicator: Cart -> Details -> Payment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4">
        <Link to="/cart" className={BTN_SECONDARY_OUTLINE}>
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        {/* Progress Indicator: Cart -> Details -> Payment */}
        <nav
          aria-label="Checkout progress"
          className="flex items-center gap-2 sm:gap-3 text-xs font-extrabold"
        >
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-emerald-700 hover:underline"
          >
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
              ✓
            </span>
            <span>Cart</span>
          </Link>

          <span className="text-slate-400">→</span>

          <div
            className={`flex items-center gap-1.5 ${
              isDetailsComplete ? 'text-emerald-700' : 'text-[#6D28D9]'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                isDetailsComplete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-[#6D28D9] text-white'
              }`}
            >
              {isDetailsComplete ? '✓' : '2'}
            </span>
            <span>Details</span>
          </div>

          <span className="text-slate-400">→</span>

          <div className="flex items-center gap-1.5 text-[#6D28D9]">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                isDetailsComplete
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              3
            </span>
            <span>Payment</span>
          </div>
        </nav>
      </div>

      {/* API Error Toast (keeps cart intact) */}
      {apiErrorToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl p-4 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Could not complete order</p>
              <p className="font-medium text-red-800 mt-0.5">{apiErrorToast}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApiErrorToast(null)}
            aria-label="Dismiss error"
            className={BTN_SECONDARY_OUTLINE}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MOBILE ONLY: Collapsible Summary at Top ("Show summary ₹X ▾") */}
      <div className="lg:hidden bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((prev) => !prev)}
          aria-expanded={mobileSummaryOpen}
          className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
        >
          <span className="text-xs sm:text-sm font-extrabold text-[#6D28D9] flex items-center gap-1.5">
            <span>
              {mobileSummaryOpen ? 'Hide summary' : 'Show summary'} ₹
              {grandTotal.toLocaleString('en-IN')}
            </span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
          <span className="text-xs font-bold text-slate-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </button>

        {mobileSummaryOpen && (
          <div className="p-4 border-t border-slate-200">
            {renderOrderSummaryContent()}
          </div>
        )}
      </div>

      {/* MAIN 2-COLUMN DESKTOP GRID (8px spacing multiples: gap-6 = 24px, p-6 = 24px) */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* LEFT COLUMN: 4 STEP CARDS */}
        <div className="lg:col-span-7 space-y-6">
          {/* ================================================================
              SECTION 1: DELIVERY / STUDIO PICKUP + CUSTOMER & ADDRESS FIELDS
              ================================================================ */}
          <section
            aria-labelledby="checkout-handover-heading"
            className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="checkout-handover-heading"
                className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Delivery or Studio Pickup
              </h2>
              <span className="text-xs font-bold text-slate-600">
                Gautam Nagar, New Delhi
              </span>
            </div>

            {/* Delivery / Studio Pickup Toggle (Primary Filled vs Secondary Outline) */}
            <div
              className="grid grid-cols-2 gap-4"
              role="radiogroup"
              aria-label="Delivery or Studio Pickup"
            >
              <button
                type="button"
                role="radio"
                aria-checked={handoverMode === 'DELIVERY'}
                onClick={() => setHandoverMode('DELIVERY')}
                className={
                  handoverMode === 'DELIVERY'
                    ? BTN_PRIMARY
                    : BTN_SECONDARY_OUTLINE
                }
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Delivery</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={handoverMode === 'PICKUP'}
                onClick={() => {
                  setHandoverMode('PICKUP');
                  setCity('Delhi NCR');
                }}
                className={
                  handoverMode === 'PICKUP'
                    ? BTN_PRIMARY
                    : BTN_SECONDARY_OUTLINE
                }
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Studio Pickup</span>
              </button>
            </div>

            {/* Name & Phone (10-digit India) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkout-full-name"
                  className="block text-xs font-extrabold text-slate-800 mb-1.5"
                >
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="checkout-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Enter full name"
                  className={`w-full min-h-[44px] bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                    errors.name ? 'border-red-600' : 'border-slate-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs font-bold text-red-600 mt-1" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-extrabold text-slate-800 mb-1.5"
                >
                  Phone (10-digit India) <span className="text-red-600">*</span>
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="9871234567"
                  className={`w-full min-h-[44px] bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                    errors.phone ? 'border-red-600' : 'border-slate-300'
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs font-bold text-red-600 mt-1" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {handoverMode === 'PICKUP' ? (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1 text-xs">
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#6D28D9]" />
                  CameraRent Studio Pickup Hub
                </p>
                <p className="font-bold text-slate-800">{STUDIO_PICKUP_ADDRESS}</p>
                <p className="text-slate-600">
                  Bring your original Government ID for sensor check and equipment handover.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-extrabold text-slate-800 mb-1.5"
                  >
                    Delivery Address <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address)
                        setErrors({ ...errors, address: undefined });
                    }}
                    placeholder="House/Flat/Studio no., building, street, locality"
                    className={`w-full bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                      errors.address ? 'border-red-600' : 'border-slate-300'
                    }`}
                  />
                  {errors.address && (
                    <p
                      className="text-xs font-bold text-red-600 mt-1"
                      role="alert"
                    >
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="checkout-city"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      City <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="checkout-city"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (errors.city) setErrors({ ...errors, city: undefined });
                      }}
                      className={`w-full min-h-[44px] bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                        errors.city ? 'border-red-600' : 'border-slate-300'
                      }`}
                    >
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="New Delhi">New Delhi</option>
                      <option value="Noida">Noida</option>
                      <option value="Gurugram">Gurugram</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                    {errors.city && (
                      <p
                        className="text-xs font-bold text-red-600 mt-1"
                        role="alert"
                      >
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-pincode"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      Pincode (6-digit) <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (errors.pincode)
                          setErrors({ ...errors, pincode: undefined });
                      }}
                      placeholder="110049"
                      className={`w-full min-h-[44px] bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                        errors.pincode ? 'border-red-600' : 'border-slate-300'
                      }`}
                    />
                    {errors.pincode && (
                      <p
                        className="text-xs font-bold text-red-600 mt-1"
                        role="alert"
                      >
                        {errors.pincode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================================================================
              SECTION 2: CUSTOMIZE "WHAT'S IN THE BOX" & KIT ACCESSORIES
              ================================================================ */}
          <CheckoutBoxCustomizer
            items={items}
            customBoxState={customBoxState}
            onChangeBoxState={handleBoxStateChange}
            packingNotes={packingNotes}
            onChangePackingNote={handlePackingNoteChange}
          />

          {/* ================================================================
              SECTION 3: KYC STATUS BADGE (Approved / Pending / Not uploaded)
              ================================================================ */}
          <section
            aria-labelledby="checkout-kyc-heading"
            className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="checkout-kyc-heading"
                  className="text-base font-black text-slate-900 flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  KYC Verification
                </h2>

                {kycStatus === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />{' '}
                    Approved
                  </span>
                ) : kycStatus === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-900 border border-red-300">
                    <AlertCircle className="w-3.5 h-3.5 text-red-700" /> Not
                    uploaded
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {kycStatus === 'APPROVED'
                  ? 'Your KYC is approved. Both UPI / QR Code and Cash on Delivery are unlocked.'
                  : 'Verified KYC is required before dispatch and to unlock Cash on Delivery.'}
              </p>
            </div>

            {kycStatus !== 'APPROVED' && (
              <Link
                to="/dashboard"
                className={`${BTN_SECONDARY_OUTLINE} shrink-0`}
              >
                <span>Upload KYC in Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </section>

          {/* ================================================================
              SECTION 4: PAYMENT METHOD ("UPI / QR Code" & "Cash on Delivery")
              ================================================================ */}
          <section
            aria-labelledby="checkout-payment-heading"
            className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2
                id="checkout-payment-heading"
                className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white text-xs flex items-center justify-center font-bold">
                  4
                </span>
                Payment Method
              </h2>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#6D28D9]" /> Encrypted
              </span>
            </div>

            {/* Radio Cards: "UPI / QR Code" and "Cash on Delivery" */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              role="radiogroup"
              aria-label="Payment method"
            >
              {/* Radio Card 1: UPI / QR Code */}
              <div
                role="radio"
                tabIndex={0}
                aria-checked={paymentMethod === 'UPI_QR'}
                onClick={() => setPaymentMethod('UPI_QR')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPaymentMethod('UPI_QR');
                  }
                }}
                className={`min-h-[88px] p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${
                  paymentMethod === 'UPI_QR'
                    ? 'border-[#6D28D9] bg-purple-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6D28D9] flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        UPI / QR Code
                      </span>
                      <span className="text-[11px] font-bold text-[#6D28D9]">
                        Instant Scan & Pay
                      </span>
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'UPI_QR'
                        ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'UPI_QR' && (
                      <Check className="w-3 h-3" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Scan dynamic UPI QR and submit your 12-digit UTR number.
                </p>
              </div>

              {/* Radio Card 2: Cash on Delivery */}
              <div
                role="radio"
                tabIndex={codEligibility.eligible ? 0 : -1}
                aria-checked={paymentMethod === 'COD'}
                aria-disabled={!codEligibility.eligible}
                onClick={() => {
                  if (codEligibility.eligible) {
                    setPaymentMethod('COD');
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    codEligibility.eligible &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    setPaymentMethod('COD');
                  }
                }}
                className={`min-h-[88px] p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${
                  !codEligibility.eligible
                    ? 'border-slate-200 bg-slate-100 opacity-75 cursor-not-allowed'
                    : paymentMethod === 'COD'
                    ? 'border-[#6D28D9] bg-purple-50/50 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6D28D9] flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        Cash on Delivery
                      </span>
                      <span className="text-[11px] font-bold text-[#6D28D9]">
                        {codEligibility.eligible ? 'Available' : 'Ineligible'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'COD'
                        ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'COD' && <Check className="w-3 h-3" />}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Pay at handover (orders up to ₹
                  {COD_MAX_AMOUNT.toLocaleString('en-IN')} in Delhi NCR).
                </p>
              </div>
            </div>

            {/* Exact Ineligibility Reason(s) for COD */}
            {!codEligibility.eligible && (
              <div
                aria-live="polite"
                className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1"
              >
                <p className="font-extrabold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-800 shrink-0" />
                  Cash on Delivery is unavailable for this order:
                </p>
                <ul className="list-disc list-inside space-y-0.5 font-medium text-amber-900 pl-1">
                  {codEligibility.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ==============================================================
                UPI / QR CODE DETAILS PANEL
                ============================================================== */}
            {paymentMethod === 'UPI_QR' && (
              <div
                aria-live="polite"
                className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Dynamic QR Code */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shrink-0 flex flex-col items-center">
                    <QRCodeSVG
                      value={upiUri}
                      size={168}
                      level="M"
                      includeMargin={true}
                    />
                    <span className="text-xs font-extrabold text-slate-900 mt-2">
                      Amount: ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Ref: {orderRef}
                    </span>
                  </div>

                  {/* Amount, UPI ID with copy button, Mobile "Open in UPI app", 10-min countdown */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div
                        aria-live="polite"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6D28D9]"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>QR valid for {formatCountdown(countdown)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={regenerateQrSession}
                        className={BTN_SECONDARY_OUTLINE}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate QR</span>
                      </button>
                    </div>

                    {qrRegeneratedCount > 0 && (
                      <p className="text-[11px] font-bold text-[#6D28D9]">
                        QR refreshed with new reference ({orderRef}).
                      </p>
                    )}

                    {/* UPI ID + Copy Button */}
                    <div className="bg-white border border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="px-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          UPI ID
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate block">
                          {upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className={BTN_SECONDARY_OUTLINE}
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    {/* "Open in UPI app" button (mobile only) */}
                    <div className="sm:hidden">
                      <a href={upiUri} className={`${BTN_PRIMARY} w-full`}>
                        <Smartphone className="w-4 h-4" /> Open in UPI app
                      </a>
                    </div>
                  </div>
                </div>

                {/* UTR Input (12 digits) + Optional Screenshot Upload (jpg/png/webp, max 5MB) */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="checkout-utr"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      12-Digit UTR Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="checkout-utr"
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={utrNumber}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 12);
                        setUtrNumber(digits);
                        if (errors.utr) setErrors({ ...errors, utr: undefined });
                      }}
                      placeholder="Enter 12-digit UTR number"
                      className={`w-full min-h-[44px] bg-white border px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#6D28D9] ${
                        errors.utr
                          ? 'border-red-600'
                          : isUtrValid
                          ? 'border-emerald-600'
                          : 'border-slate-300'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-[11px] font-bold ${
                          isUtrValid ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {utrNumber.length}/12 digits
                      </span>
                      {isUtrValid && (
                        <span className="text-[11px] font-extrabold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid 12-digit UTR
                        </span>
                      )}
                    </div>
                    {errors.utr && (
                      <p
                        className="text-xs font-bold text-red-600 mt-1"
                        role="alert"
                      >
                        {errors.utr}
                      </p>
                    )}
                  </div>

                  {/* Optional Screenshot Upload (jpg/png/webp, max 5MB) */}
                  <div>
                    <label
                      htmlFor="checkout-proof"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      Payment Screenshot (Optional, JPG/PNG/WEBP ≤ 5MB)
                    </label>
                    {!paymentProofUrl ? (
                      <label
                        htmlFor="checkout-proof"
                        className={`${BTN_SECONDARY_OUTLINE} w-full`}
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span className="truncate">Upload Screenshot</span>
                        <input
                          id="checkout-proof"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProofUpload}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <div className="min-h-[44px] bg-white border border-emerald-300 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={paymentProofUrl}
                            alt="Uploaded payment proof"
                            className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                          />
                          <span className="text-xs font-bold text-emerald-900 truncate">
                            {paymentProofName || 'Screenshot attached'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofUrl(null);
                            setPaymentProofName('');
                          }}
                          aria-label="Remove screenshot"
                          className={BTN_SECONDARY_OUTLINE}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {errors.proof && (
                      <p
                        className="text-xs font-bold text-red-600 mt-1"
                        role="alert"
                      >
                        {errors.proof}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                CASH ON DELIVERY (COD) INFO CARD
                ============================================================== */}
            {paymentMethod === 'COD' && codEligibility.eligible && (
              <div
                aria-live="polite"
                className="p-4 sm:p-6 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3 text-xs sm:text-sm text-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-sm">
                      Cash on Delivery (Pay on Handover)
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Inspect your camera bodies and lenses upon delivery or studio pickup before completing payment.
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6D28D9] shrink-0" />
                    <span>
                      <strong>Pay on delivery:</strong> Pay ₹
                      {grandTotal.toLocaleString('en-IN')} at the time of delivery/handover.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6D28D9] shrink-0" />
                    <span>
                      <strong>Original ID required:</strong> Present your original Government ID for verification at delivery.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6D28D9] shrink-0" />
                    <span>
                      <strong>Deposit collected at delivery:</strong> The refundable security deposit of ₹
                      {depositTotal.toLocaleString('en-IN')} is collected on delivery and refunded upon return.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </section>

          {/* ================================================================
              SECTION 4: TERMS & RENTAL POLICY CHECKBOX + DESKTOP SUBMIT
              ================================================================ */}
          <section
            aria-labelledby="checkout-terms-heading"
            className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"
          >
            <h2 id="checkout-terms-heading" className="sr-only">
              Terms and Rental Policy
            </h2>

            {/* Quick Policy Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-slate-600 block">Base Shift:</span>
                <strong className="text-slate-800">8 Hours</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Payment:</span>
                <strong className="text-emerald-700">50% Advance</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Support:</span>
                <strong className="text-slate-800">1 Attendant</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Territory:</span>
                <strong className="text-slate-800">Delhi Rates</strong>
              </div>
            </div>

            <label
              htmlFor="checkout-terms-checkbox"
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              <input
                id="checkout-terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.terms) setErrors({ ...errors, terms: undefined });
                }}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 text-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9] cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-extrabold text-[#6D28D9] underline hover:text-[#581c87] cursor-pointer inline"
                >
                  Terms & Conditions (10 Clauses)
                </button>
                , equipment care guidelines, and refundable deposit terms.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-xs text-[#2a1872] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Read Full 10 Terms & Conditions</span>
              </button>
              <span className="text-slate-300">•</span>
              <Link
                to="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {errors.terms && (
              <p className="text-xs font-bold text-red-600" role="alert">
                {errors.terms}
              </p>
            )}

            {/* Desktop Primary Button */}
            <button
              type="submit"
              disabled={isPlaceOrderDisabled}
              className={`hidden lg:inline-flex w-full py-3.5 text-sm ${BTN_PRIMARY}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>
                  {placeOrderLabel} • ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              )}
            </button>

            {paymentMethod === 'UPI_QR' && !isUtrValid && (
              <p className="text-[11px] font-semibold text-slate-600 text-center">
                Enter your 12-digit UTR number above to enable Place Order.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (Desktop) */}
        <aside className="hidden lg:block lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="font-black text-base text-slate-900">
              Order Summary
            </h2>
            <span className="text-xs font-extrabold text-[#6D28D9] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {renderOrderSummaryContent()}
        </aside>
      </form>

      {/* MOBILE STICKY BOTTOM BAR (44px touch targets) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
            Total Payable
          </span>
          <span className="text-lg font-black text-slate-900">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isPlaceOrderDisabled}
          className={`${BTN_PRIMARY} flex-1 max-w-xs`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Placing...</span>
            </>
          ) : (
            <span>{placeOrderLabel}</span>
          )}
        </button>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        showAcceptButton={true}
        onAccept={() => {
          setTermsAccepted(true);
          if (errors.terms) setErrors({ ...errors, terms: undefined });
        }}
      />
    </div>
  );
}
