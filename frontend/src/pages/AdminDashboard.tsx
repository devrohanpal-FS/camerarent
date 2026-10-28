import React, { useState, useEffect } from 'react';
import {
  BarChart3, Package, Users, RefreshCw,
  Layers, Calendar, ClipboardCheck, Ban, Trash2, Edit2,
  MessageSquare, UserPlus, X, Send, Eye, ExternalLink,
  Upload, Plus, Image as ImageIcon, Loader2, Star
} from 'lucide-react';
import {
  apiRequest,
  getProductImageUrl,
  parseProductImages,
  resolveSingleImageUrl,
} from '../utils/api';
import CmsPanel from '../components/CmsPanel';
import CrewManager from '../components/CrewManager';
import ProductSpecsEditor, {
  parseProductSpecsData,
  serializeProductSpecsData,
  getDefaultTechSpecs,
  getDefaultBoxItems,
  type TechSpecItem,
  type BoxItem,
} from '../components/ProductSpecsEditor';

interface StatBlock {
  totalOrdersCount: number;
  pendingApprovalsCount: number;
  activeRentalsCount: number;
  overdueReturnsCount: number;
  pendingCancellationsCount: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatBlock | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'cancellations' | 'kyc' | 'products' | 'crew' | 'users' | 'inquiries' | 'cms'>('orders');
  const [crewCount, setCrewCount] = useState<number>(9);

  const [pendingKycUsers, setPendingKycUsers] = useState<any[]>([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [whatsappOrder, setWhatsappOrder] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [proofPreviewUrl, setPosProofPreviewUrl] = useState<string | null>(null);

  const [newTechSpecs, setNewTechSpecs] = useState<TechSpecItem[]>(getDefaultTechSpecs('Cameras'));
  const [newBoxItems, setNewBoxItems] = useState<BoxItem[]>(getDefaultBoxItems('New Equipment'));
  const [editTechSpecs, setEditTechSpecs] = useState<TechSpecItem[]>([]);
  const [editBoxItems, setEditBoxItems] = useState<BoxItem[]>([]);

  const handleStartEditProduct = (p: any) => {
    setEditingProduct(p);
    const { techSpecs, boxItems } = parseProductSpecsData(p.specs);
    setEditTechSpecs(
      techSpecs.length > 0 ? techSpecs : getDefaultTechSpecs(getCategoryName(p.categoryId) || 'Cameras')
    );
    setEditBoxItems(
      boxItems.length > 0 ? boxItems : getDefaultBoxItems(p.name)
    );
  };

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    specs: '',
    dailyRate: '',
    weeklyRate: '',
    depositAmount: '',
    images: 'https://images.unsplash.com/photo-1620662056087-f2533ed89e86?auto=format&fit=crop&w=600&q=80',
    categoryId: '',
    subcategory: '',
    vendorId: '',
    totalStock: '1',
  });

  const [blackoutForm, setBlackoutForm] = useState({
    productId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [
        statsRes,
        ordersRes,
        cancelRes,
        prodRes,
        catRes,
        usersRes,
        contactsRes,
        crewRes,
      ] = await Promise.allSettled([
        apiRequest('/orders/admin/dashboard'),
        apiRequest('/orders'),
        apiRequest('/orders/admin/cancellations'),
        apiRequest('/products'),
        apiRequest('/products/categories'),
        apiRequest('/auth/admin/users'),
        apiRequest('/contacts'),
        apiRequest('/crew'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }
      const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      setOrders(ordersData);

      const cancelData = cancelRes.status === 'fulfilled' ? cancelRes.value : [];
      setCancellations(cancelData);

      const prodData = prodRes.status === 'fulfilled' ? prodRes.value : [];
      setProducts(prodData);

      const catData = catRes.status === 'fulfilled' ? catRes.value : [];
      setCategories(catData);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : [];
      setUsers(usersData);

      const contactsData = contactsRes.status === 'fulfilled' ? contactsRes.value : [];
      setContactMessages(contactsData);

      if (crewRes.status === 'fulfilled' && Array.isArray(crewRes.value)) {
        setCrewCount(crewRes.value.length);
      }

      if (catData.length > 0) {
        setNewProduct(prev => ({ ...prev, categoryId: catData[0].id }));
      }

      const pendingKyc = usersData.filter((u: any) => u.kycStatus === 'PENDING');
      setPendingKycUsers(pendingKyc);

      const uniqueVendors = Array.from(
        new Map(prodData.filter((p: any) => p?.vendor?.id).map((p: any) => [p.vendor.id, p.vendor])).values()
      ) as any[];
      if (uniqueVendors.length > 0) {
        setNewProduct(prev => ({ ...prev, vendorId: uniqueVendors[0].id }));
      }

    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const getCategoryName = (id: string) => {
    const found = categories.find((c) => c.id === id);
    return found ? found.name : '';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      alert('User account created successfully!');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to create user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user profile? All linked data will be deleted.')) return;
    try {
      await apiRequest(`/auth/admin/users/${id}`, {
        method: 'DELETE',
      });
      alert('User profile removed.');
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const handleResolveKyc = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await apiRequest(`/auth/admin/kyc/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }),
      });
      alert(`KYC request successfully ${action.toLowerCase()}d.`);
      loadAdminData();
    } catch (err: any) {
      alert(`KYC update failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleUpdateUserKycStatus = async (userId: string, newKycStatus: string) => {
    try {
      await apiRequest(`/auth/admin/kyc/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newKycStatus }),
      });
      alert(`User KYC Status updated to ${newKycStatus}`);
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update KYC status: ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      alert(`Order status updated to ${newStatus}`);
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'PAID' | 'FAILED') => {
    try {
      await apiRequest(`/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus }),
      });

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus });
      }

      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update payment status: ${err.message}`);
    }
  };

  const handleViewOrderDetails = async (orderId: string) => {
    setSelectedOrderLoading(true);
    try {
      const existing = orders.find(o => o.id === orderId);
      if (existing && existing.items && existing.items.length > 0) {
        setSelectedOrder(existing);
      } else {
        const orderData = await apiRequest(`/orders/${orderId}`);
        setSelectedOrder(orderData);
      }
    } catch (err: any) {
      alert(`Failed to load order details: ${err.message}`);
      console.error(err);
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleResolveCancellation = async (cancelId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await apiRequest(`/orders/admin/cancellations/${cancelId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: action === 'APPROVE' ? 'APPROVE' : 'REJECT' }),
      });
      alert(`Cancellation request ${action.toLowerCase()}d.`);
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to resolve cancellation: ${err.message}`);
    }
  };

  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');

  const readFileAsDataUrl = (file: File): Promise<{ name: string; dataUrl: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve({ name: file.name, dataUrl: reader.result });
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleUploadImageFiles = async (
    fileList: FileList | null,
    currentImagesStr: string,
    onChangeImages: (nextImagesStr: string) => void
  ) => {
    if (!fileList || fileList.length === 0) return;

    const existingList = parseProductImages(currentImagesStr);
    setUploadingImages(true);

    try {
      const filesArray = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (filesArray.length === 0) {
        alert('Please select valid image files (JPG, PNG, WEBP, etc.).');
        return;
      }

      const encodedFiles = await Promise.all(filesArray.map(readFileAsDataUrl));

      let uploadedUrls: string[] = [];
      try {
        const res = await apiRequest('/products/upload-images', {
          method: 'POST',
          body: JSON.stringify({ files: encodedFiles }),
        });
        if (Array.isArray(res.urls) && res.urls.length > 0) {
          uploadedUrls = res.urls;
        }
      } catch {
        uploadedUrls = encodedFiles.map((f) => f.dataUrl);
      }

      const merged = [...existingList, ...uploadedUrls];
      onChangeImages(JSON.stringify(merged));
    } catch (err: any) {
      alert(`Failed to upload images: ${err.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const renderProductImagesManager = (
    imagesStr: string,
    onChangeImages: (nextImagesStr: string) => void,
    urlInputValue: string,
    setUrlInputValue: (val: string) => void,
    inputIdPrefix: string
  ) => {
    const imageList = parseProductImages(imagesStr);

    const handleRemoveImage = (indexToRemove: number) => {
      const next = imageList.filter((_, idx) => idx !== indexToRemove);
      onChangeImages(next.length > 0 ? JSON.stringify(next) : '');
    };

    const handleSetMainImage = (indexToPromote: number) => {
      if (indexToPromote <= 0 || indexToPromote >= imageList.length) return;
      const chosen = imageList[indexToPromote];
      const rest = imageList.filter((_, idx) => idx !== indexToPromote);
      onChangeImages(JSON.stringify([chosen, ...rest]));
    };

    const handleAddUrl = () => {
      const trimmed = urlInputValue.trim();
      if (!trimmed) return;
      const next = [...imageList, trimmed];
      onChangeImages(JSON.stringify(next));
      setUrlInputValue('');
    };

    return (
      <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              Product Images ({imageList.length}) — Multiple Allowed
            </label>
            <p className="text-[10px] text-slate-400">
              Upload one or multiple photos from your device or paste image URLs. The first image is the main cover.
            </p>
          </div>

          <label
            htmlFor={`${inputIdPrefix}-file-upload`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white font-bold text-[11px] cursor-pointer shadow-xs transition shrink-0"
          >
            {uploadingImages ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Images</span>
              </>
            )}
            <input
              id={`${inputIdPrefix}-file-upload`}
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingImages}
              onChange={(e) => {
                handleUploadImageFiles(e.target.files, imagesStr, onChangeImages);
                e.target.value = '';
              }}
              className="sr-only"
            />
          </label>
        </div>

        {imageList.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
            {imageList.map((img, idx) => (
              <div
                key={`${idx}-${img.slice(0, 24)}`}
                className={`relative group rounded-xl bg-white border-2 p-1.5 flex flex-col items-center justify-between h-24 overflow-hidden ${idx === 0 ? 'border-purple-600' : 'border-slate-200'
                  }`}
              >
                <img
                  src={resolveSingleImageUrl(img)}
                  alt={`Product view ${idx + 1}`}
                  className="w-full h-14 object-contain rounded"
                />

                <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                  {idx === 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      <Star className="w-2.5 h-2.5 fill-purple-700" /> Main
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetMainImage(idx)}
                      className="text-[9px] font-bold text-slate-600 hover:text-purple-700 underline cursor-pointer"
                      title="Set as Main Cover Image"
                    >
                      Set Main
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-[11px] flex flex-col items-center gap-1">
            <ImageIcon className="w-5 h-5 text-slate-300" />
            <span>No images selected yet. Click "Upload Images" or add an image URL below.</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <input
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Or paste an image URL (https://...) and click Add"
            className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] text-slate-700 focus:outline-none focus:border-purple-600"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add URL
          </button>
        </div>
      </div>
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedImgs = parseProductImages(newProduct.images);
    if (parsedImgs.length === 0) {
      alert('Please upload at least one product image.');
      return;
    }
    const serializedSpecs = serializeProductSpecsData(newTechSpecs, newBoxItems);
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...newProduct,
          specs: serializedSpecs,
          images: JSON.stringify(parsedImgs),
          dailyRate: parseFloat(newProduct.dailyRate),
          weeklyRate: parseFloat(newProduct.weeklyRate),
          depositAmount: parseFloat(newProduct.depositAmount),
          totalStock: parseInt(newProduct.totalStock) || 1,
        }),
      });
      alert('Product created successfully!');
      loadAdminData();
      setNewProduct(prev => ({
        ...prev,
        name: '',
        description: '',
        specs: '',
        dailyRate: '',
        weeklyRate: '',
        depositAmount: '',
        images: '',
        subcategory: '',
        totalStock: '1',
      }));
      setNewTechSpecs(getDefaultTechSpecs());
      setNewBoxItems(getDefaultBoxItems());
    } catch (err: any) {
      alert(`Failed to add product: ${err.message}`);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const parsedImgs = parseProductImages(editingProduct.images);
    if (parsedImgs.length === 0) {
      alert('Please keep or upload at least one product image.');
      return;
    }
    const serializedSpecs = serializeProductSpecsData(editTechSpecs, editBoxItems);
    try {
      await apiRequest(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingProduct.name,
          description: editingProduct.description,
          specs: serializedSpecs,
          images: JSON.stringify(parsedImgs),
          dailyRate: parseFloat(editingProduct.dailyRate),
          weeklyRate: parseFloat(editingProduct.weeklyRate),
          depositAmount: parseFloat(editingProduct.depositAmount),
          categoryId: editingProduct.categoryId,
          subcategory: editingProduct.subcategory || null,
          totalStock: parseInt(editingProduct.totalStock) || 1,
        }),
      });
      alert('Product updated successfully!');
      setEditingProduct(null);
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product? All active booking overlaps must be cleared first.')) return;
    try {
      await apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      alert('Product deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackoutForm.productId || !blackoutForm.startDate || !blackoutForm.endDate) {
      alert('Please complete all blackout fields.');
      return;
    }
    try {
      await apiRequest('/products/admin/blackout', {
        method: 'POST',
        body: JSON.stringify(blackoutForm),
      });
      alert('Maintenance blackout dates applied!');
      setBlackoutForm({
        productId: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
    } catch (err: any) {
      alert(`Failed to apply blackout: ${err.message}`);
    }
  };

  const openWhatsappModal = (order: any) => {
    setWhatsappOrder(order);
    setWaPhone(order.user.phone || '+91');
    const itemsList = order.items?.map((item: any) => `• ${item.product?.name || 'Equipment'} (Qty: ${item.quantity})`).join('\n') || '• Equipment Package (Qty: 1)';
    setWaMessage(
      `Hello ${order.user.name}, this is CameraRent Operations. Your booking #${order.orderNumber} is now updated to ${order.status}.\n\nItems:\n${itemsList}\n\nRefundable deposit holds will be updated on handback. Thank you!`
    );
  };

  const sendWhatsapp = () => {
    if (!waPhone.trim()) {
      alert('Please provide a valid phone number.');
      return;
    }
    const cleanPhone = waPhone.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
    setWhatsappOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return 'text-blue-600 bg-blue-50';
      case 'APPROVED': return 'text-indigo-600 bg-indigo-50';
      case 'DISPATCHED': return 'text-cyan-600 bg-cyan-50';
      case 'ACTIVE': return 'text-amber-600 bg-amber-50';
      case 'RETURNED': return 'text-teal-600 bg-teal-50';
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-800">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-600" /> Super Admin Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">Global operations dashboard for users, KYC review, orders, and listings.</p>
        </div>
        <button
          onClick={loadAdminData}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 transition flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-2">{stats.totalOrdersCount}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Rentals</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-2">{stats.activeRentalsCount}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Cancellations</span>
            <span className="text-2xl font-extrabold text-red-500 mt-2">{stats.pendingCancellationsCount}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KYC Pending Review</span>
            <span className="text-2xl font-extrabold text-brand-600 mt-2">{pendingKycUsers.length}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-green-600 mt-2">₹{stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        {[
          { id: 'orders', label: 'All Orders', count: orders.length },
          { id: 'cancellations', label: 'Cancellations', count: cancellations.length },
          { id: 'kyc', label: 'KYC Requests', count: pendingKycUsers.length },
          { id: 'products', label: 'Inventory & Setup', count: products.length },
          { id: 'crew', label: 'Crew Members', count: crewCount },
          { id: 'users', label: 'Users Manager', count: users.length },
          { id: 'inquiries', label: 'User Inquiries', count: contactMessages.length },
          { id: 'cms', label: 'CMS Content Manager', count: 7 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === tab.id
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
          >
            {tab.label}
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
              }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-semibold">
          Loading administration metrics...
        </div>
      ) : (
        <div className="space-y-6">

          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-4 font-bold">Order Info</th>
                      <th className="p-4 font-bold">Customer</th>
                      <th className="p-4 font-bold">Rental Cost</th>
                      <th className="p-4 font-bold">Payment & Verification</th>
                      <th className="p-4 font-bold">Address</th>
                      <th className="p-4 font-bold">Status & Action</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => {
                      const payMethod = o.paymentMethod || 'COD';
                      const payStatus = o.paymentStatus || 'PENDING';
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <button
                              onClick={() => handleViewOrderDetails(o.id)}
                              className="font-bold text-brand-600 hover:text-brand-700 hover:underline font-mono text-left cursor-pointer transition focus:outline-none"
                            >
                              {o.orderNumber}
                            </button>
                            <p className="text-[12px] text-slate-400 mt-0.5">Date: {new Date(o.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-700">{o.user.name}</p>
                            <p className="text-[12px] text-slate-400">{o.user.email}</p>
                            {o.user.phone && <p className="text-[11px] text-slate-400 font-bold">{o.user.phone}</p>}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800">₹{o.grandTotal.toFixed(2)}</p>
                            <p className="text-[12px] text-brand-600 font-bold">Dep: ₹{o.totalDeposit.toFixed(2)}</p>
                          </td>
                          <td className="p-4 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${payMethod === 'UPI_QR'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                  }`}
                              >
                                {payMethod === 'UPI_QR' ? 'UPI QR' : 'COD'}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${payStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : payStatus === 'VERIFICATION'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : payStatus === 'FAILED'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                              >
                                {payStatus}
                              </span>
                            </div>

                            {(o.utrNumber || o.paymentProofUrl) && (
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                {o.utrNumber && (
                                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    UTR: {o.utrNumber}
                                  </span>
                                )}
                                {o.paymentProofUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPosProofPreviewUrl(o.paymentProofUrl)}
                                    className="text-purple-700 hover:underline font-extrabold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> Proof
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 pt-0.5">
                              {payStatus !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(o.id, 'PAID')}
                                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  Mark as Paid
                                </button>
                              )}
                              {payStatus !== 'FAILED' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(o.id, 'FAILED')}
                                  className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-600 max-w-[200px] line-clamp-1">{o.deliveryAddress}</p>
                          </td>
                          <td className="p-4">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className={`border border-slate-200 rounded-lg p-1.5 focus:outline-none text-[13px] font-bold ${getStatusColor(o.status)}`}
                            >
                              <option value="PLACED">PLACED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="RETURNED">RETURNED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewOrderDetails(o.id)}
                                className="p-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition cursor-pointer"
                                title="View Order Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openWhatsappModal(o)}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition cursor-pointer"
                                title="Notify Customer on WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cancellations' && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-4 font-bold">Order #</th>
                      <th className="p-4 font-bold">Requested On</th>
                      <th className="p-4 font-bold">Reason</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cancellations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No active cancellation requests.</td>
                      </tr>
                    ) : (
                      cancellations.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <button
                              onClick={() => handleViewOrderDetails(c.order.id)}
                              className="font-bold text-brand-600 hover:text-brand-700 hover:underline font-mono text-left cursor-pointer transition focus:outline-none"
                            >
                              {c.order.orderNumber}
                            </button>
                          </td>
                          <td className="p-4 text-slate-600">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-slate-500 max-w-[200px] line-clamp-1" title={c.reason}>
                            {c.reason}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              c.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 flex items-center gap-2">
                            {c.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleResolveCancellation(c.id, 'APPROVE')}
                                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleResolveCancellation(c.id, 'REJECT')}
                                  className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 border border-slate-200 font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 font-medium">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-4 font-bold">Customer Info</th>
                      <th className="p-4 font-bold">Verification Document</th>
                      <th className="p-4 font-bold">KYC Status</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingKycUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">All user KYC accounts are currently verified.</td>
                      </tr>
                    ) : (
                      pendingKycUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                          </td>
                          <td className="p-4">
                            {u.kycDocUrl ? (
                              <a
                                href={getProductImageUrl(u.kycDocUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 hover:underline font-bold"
                              >
                                View ID Upload file
                              </a>
                            ) : (
                              <span className="text-red-500 font-semibold italic">No file uploaded</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-bold text-[10px]">
                              {u.kycStatus}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                            <button
                              onClick={() => handleResolveKyc(u.id, 'APPROVE')}
                              className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Approve KYC
                            </button>
                            <button
                              onClick={() => handleResolveKyc(u.id, 'REJECT')}
                              className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 border border-slate-200 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-slate-800">Current Inventory</h3>
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
                  {products.map((p) => {
                    const imgCount = parseProductImages(p.images).length;
                    return (
                      <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImageUrl(p.images)}
                            alt={p.name}
                            className="w-10 h-10 object-contain p-0.5 rounded-lg bg-white border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 leading-tight">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.category.name} | Dep: ₹{p.depositAmount} | Stock: {p.totalStock} | {imgCount} {imgCount === 1 ? 'photo' : 'photos'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs text-slate-800 shrink-0">₹{p.dailyRate}/d</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleStartEditProduct(p)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                              title="Edit Listing, Specs, Box Items & Images"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
                    <Layers className="w-4 h-4 text-brand-600" /> Create New Equipment Listing
                  </h3>
                  <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Equipment Name</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Category</label>
                        <select
                          value={newProduct.categoryId}
                          onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value, subcategory: '' })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Subcategory</label>
                        {getCategoryName(newProduct.categoryId) === 'Cameras' ? (
                          <select
                            value={newProduct.subcategory}
                            onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                          >
                            <option value="">None</option>
                            <option value="Mirrorless Camera">Mirrorless Camera</option>
                            <option value="Cinema Camera">Cinema Camera</option>
                            <option value="Drone Camera">Drone Camera</option>
                            <option value="Action Camera">Action Camera</option>
                          </select>
                        ) : getCategoryName(newProduct.categoryId) === 'Lights' ? (
                          <select
                            value={newProduct.subcategory}
                            onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                          >
                            <option value="">None</option>
                            <option value="Continuous Lights">Continuous Lights</option>
                            <option value="Strobe Lights">Strobe Lights</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={newProduct.subcategory}
                            onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                            placeholder="e.g. Zoom (optional)"
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Daily (₹)</label>
                        <input
                          type="number"
                          value={newProduct.dailyRate}
                          onChange={(e) => setNewProduct({ ...newProduct, dailyRate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Weekly (₹)</label>
                        <input
                          type="number"
                          value={newProduct.weeklyRate}
                          onChange={(e) => setNewProduct({ ...newProduct, weeklyRate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Deposit (₹)</label>
                        <input
                          type="number"
                          value={newProduct.depositAmount}
                          onChange={(e) => setNewProduct({ ...newProduct, depositAmount: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={newProduct.totalStock}
                          onChange={(e) => setNewProduct({ ...newProduct, totalStock: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    {renderProductImagesManager(
                      newProduct.images,
                      (nextImages) => setNewProduct((prev) => ({ ...prev, images: nextImages })),
                      newImageUrlInput,
                      setNewImageUrlInput,
                      'create-product'
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Description</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none min-h-[60px]"
                        required
                      />
                    </div>

                    <div>
                      <ProductSpecsEditor
                        techSpecs={newTechSpecs}
                        onChangeTechSpecs={setNewTechSpecs}
                        boxItems={newBoxItems}
                        onChangeBoxItems={setNewBoxItems}
                        productName={newProduct.name || 'New Equipment Unit'}
                        categoryName={getCategoryName(newProduct.categoryId) || 'Cameras'}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl shadow-md transition cursor-pointer"
                    >
                      Publish Equipment Listing
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
                    <Ban className="w-4 h-4 text-red-500" /> Apply Maintenance Blackout dates
                  </h3>
                  <form onSubmit={handleCreateBlackout} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Select Equipment Unit</label>
                      <select
                        value={blackoutForm.productId}
                        onChange={(e) => setBlackoutForm({ ...blackoutForm, productId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                        required
                      >
                        <option value="">-- Choose Gear --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Blackout Start</label>
                        <input
                          type="date"
                          value={blackoutForm.startDate}
                          onChange={(e) => setBlackoutForm({ ...blackoutForm, startDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Blackout End</label>
                        <input
                          type="date"
                          value={blackoutForm.endDate}
                          onChange={(e) => setBlackoutForm({ ...blackoutForm, endDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Reason for Blackout</label>
                      <input
                        type="text"
                        value={blackoutForm.reason}
                        onChange={(e) => setBlackoutForm({ ...blackoutForm, reason: e.target.value })}
                        placeholder="e.g. Lens element recoating, sensor calibration check"
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition"
                    >
                      Blockout Calendar Dates
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'crew' && <CrewManager />}

          {activeTab === 'users' && (
            <div className="space-y-6">

              <div className="flex justify-between items-center pb-2">
                <h3 className="font-extrabold text-base text-slate-800">User Profiles Manager</h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-brand-500/10"
                >
                  <UserPlus className="w-4 h-4" /> Add User Account
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <th className="p-4 font-bold">Name</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Phone</th>
                        <th className="p-4 font-bold">Role</th>
                        <th className="p-4 font-bold">KYC Status</th>
                        <th className="p-4 font-bold">Joined On</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-850">{u.name}</td>
                          <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                          <td className="p-4 text-slate-600">{u.phone || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                              u.role === 'VENDOR' ? 'bg-cyan-100 text-cyan-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={u.kycStatus}
                              onChange={(e) => handleUpdateUserKycStatus(u.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold focus:outline-none border border-slate-200 cursor-pointer ${u.kycStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  u.kycStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-250 animate-pulse' :
                                    u.kycStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-slate-50 text-slate-500'
                                }`}
                            >
                              <option value="NONE">NONE</option>
                              <option value="PENDING">PENDING</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-extrabold text-base text-slate-800">User Support Inquiries</h3>
                <span className="text-xs text-slate-500 font-medium">
                  Showing {contactMessages.length} submitted messages
                </span>
              </div>

              {contactMessages.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-semibold">
                  No support inquiries or contact messages found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {contactMessages.map((msg) => (
                    <div key={msg.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-50 pb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">{msg.subject}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px] mt-1 font-semibold">
                            <span>From: <strong className="text-slate-700">{msg.name}</strong> ({msg.email})</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 font-medium whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <div className="flex justify-end pt-1">
                        <a
                          href={`mailto:${msg.email}?subject=RE: ${msg.subject}`}
                          className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          Reply via Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cms' && (
            <CmsPanel />
          )}

        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-100 animate-fade-in">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5 mb-4">
              <UserPlus className="w-5 h-5 text-brand-600" /> Add New User Profile
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="E.g. David Miller"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="david@example.com"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Mobile Phone (for WhatsApp)</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+919999999999"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Account Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Authorization Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none font-semibold text-slate-700"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="ADMIN">ADMIN (Super Admin)</option>
                  <option value="VENDOR">VENDOR</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-md transition"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 relative shadow-2xl border border-slate-100 animate-fade-in">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5 mb-4">
              <Edit2 className="w-5 h-5 text-brand-600" /> Edit Equipment Listing
            </h3>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value, subcategory: '' })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Subcategory</label>
                  {getCategoryName(editingProduct.categoryId) === 'Cameras' ? (
                    <select
                      value={editingProduct.subcategory || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                    >
                      <option value="">None</option>
                      <option value="Mirrorless Camera">Mirrorless Camera</option>
                      <option value="Cinema Camera">Cinema Camera</option>
                      <option value="Drone Camera">Drone Camera</option>
                      <option value="Action Camera">Action Camera</option>
                    </select>
                  ) : getCategoryName(editingProduct.categoryId) === 'Lights' ? (
                    <select
                      value={editingProduct.subcategory || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none font-semibold"
                    >
                      <option value="">None</option>
                      <option value="Continuous Lights">Continuous Lights</option>
                      <option value="Strobe Lights">Strobe Lights</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingProduct.subcategory || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                      placeholder="e.g. Zoom (optional)"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.dailyRate}
                    onChange={(e) => setEditingProduct({ ...editingProduct, dailyRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Weekly Rate (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.weeklyRate}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weeklyRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.depositAmount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, depositAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={editingProduct.totalStock || '1'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, totalStock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none"
                    required
                    min="1"
                  />
                </div>
              </div>

              {renderProductImagesManager(
                editingProduct.images || '',
                (nextImages) => setEditingProduct({ ...editingProduct, images: nextImages }),
                editImageUrlInput,
                setEditImageUrlInput,
                'edit-product'
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none min-h-[60px]"
                  required
                />
              </div>

              <div>
                <ProductSpecsEditor
                  techSpecs={editTechSpecs}
                  onChangeTechSpecs={setEditTechSpecs}
                  boxItems={editBoxItems}
                  onChangeBoxItems={setEditBoxItems}
                  productName={editingProduct.name || 'Equipment Unit'}
                  categoryName={getCategoryName(editingProduct.categoryId) || 'Cameras'}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                Save Listing Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {whatsappOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-100 animate-fade-in">
            <button
              onClick={() => setWhatsappOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5 mb-4">
              <MessageSquare className="w-5 h-5 text-green-600" /> WhatsApp Update Dispatcher
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Recipient Name</label>
                <p className="font-bold text-sm text-slate-800">{whatsappOrder.user.name}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Mobile Phone (with country code)</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="e.g. +919999999999"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Status Update Message</label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none text-slate-800 leading-normal"
                />
              </div>

              <button
                onClick={sendWhatsapp}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Open WhatsApp Web <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl border border-slate-100 animate-fade-in flex flex-col cursor-default font-sans"
          >

            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-brand-600" /> Order Details
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-[12px] text-slate-400 font-semibold">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 flex-1 text-sm">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
                      <Users className="w-4 h-4 text-slate-500" /> Customer Information
                    </h4>
                    <div className="space-y-1 text-[13px]">
                      <p className="text-slate-800"><strong className="text-slate-500 font-normal">Name:</strong> {selectedOrder.user?.name}</p>
                      <p className="text-slate-800"><strong className="text-slate-500 font-normal">Email:</strong> {selectedOrder.user?.email}</p>
                      <p className="text-slate-800"><strong className="text-slate-500 font-normal">Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</p>
                    </div>

                    {selectedOrder.kycDocUrl && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">KYC Document</span>
                        <a
                          href={getProductImageUrl(selectedOrder.kycDocUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 text-[13px] cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Document
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-1.5">
                      <Package className="w-4 h-4 text-slate-500" /> Shipping & Delivery
                    </h4>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        <strong className="text-slate-500 font-normal">Address:</strong> {selectedOrder.deliveryAddress}
                      </p>
                      {selectedOrder.deliveryDetails && (
                        <div className="mt-2 space-y-2">
                          <p className="text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100 italic leading-relaxed text-[13px]">
                            <strong className="text-slate-500 not-italic block text-[12px] font-bold uppercase tracking-wider mb-0.5">Instructions & Info:</strong>
                            "{selectedOrder.deliveryDetails}"
                          </p>

                          {selectedOrder.deliveryDetails.includes('Custom Kit Contents:') && (
                            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 text-xs space-y-1">
                              <span className="font-extrabold text-[#6D28D9] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Package className="w-3.5 h-3.5 text-[#6D28D9]" /> Dispatch Packing: Customized Box Items
                              </span>
                              <p className="text-slate-800 font-semibold leading-relaxed">
                                {selectedOrder.deliveryDetails.split('Custom Kit Contents:')[1]?.split(' - [Payment')[0] || ''}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-[13px]">
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-150 pb-1.5">
                      Order Status & Action
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl p-2 focus:outline-none font-bold text-slate-700 shadow-sm text-[13px] cursor-pointer"
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="RETURNED">RETURNED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-4 space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-150 pb-1.5">
                      Cost Breakdown
                    </h4>
                    <div className="space-y-1.5 pt-1 text-[13px]">
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>Rental Cost:</span>
                        <span className="font-bold text-slate-800">₹{(selectedOrder.totalRentalCost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>Refundable Deposit:</span>
                        <span className="font-bold text-brand-600">₹{(selectedOrder.totalDeposit || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>Tax (18% GST):</span>
                        <span className="font-bold text-slate-800">₹{(selectedOrder.totalTax || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between text-slate-900 font-extrabold text-sm">
                        <span>Grand Total:</span>
                        <span>₹{(selectedOrder.grandTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-950 text-xs flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-slate-700" /> Rented Equipment & Items
                </h4>

                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any) => {
                      const firstImg = item.product?.images?.split(',')[0] || 'https://images.unsplash.com/photo-1620662056087-f2533ed89e86?auto=format&fit=crop&w=600&q=80';
                      return (
                        <div key={item.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex gap-3 items-center min-w-0">
                            <img
                              src={firstImg}
                              alt={item.product?.name}
                              className="w-14 h-14 object-cover rounded-xl bg-slate-100 border border-slate-200/60 shrink-0 shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-[13px] truncate">{item.product?.name || 'Equipment Item'}</p>
                              <p className="text-[12px] text-slate-450 flex items-center gap-1 mt-1 font-bold">
                                <Calendar className="w-3.5 h-3.5 animate-pulse" />
                                {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                              </p>
                              {item.product?.vendor?.name && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Vendor: <strong className="text-slate-600 font-bold">{item.product.vendor.name}</strong>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 self-end sm:self-center">
                            <p className="text-[13px] font-bold text-slate-900 font-mono">₹{item.totalCost?.toFixed(2)}</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                              Qty: <strong className="text-slate-850 font-bold">{item.quantity}</strong> | ₹{item.depositAmount?.toFixed(2)} deposit
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      No items found in this order.
                    </p>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  openWhatsappModal(selectedOrder);
                }}
                className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition font-bold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <MessageSquare className="w-4 h-4" /> Notify Customer
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedOrderLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl border border-slate-100">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-xs font-bold text-slate-600">Fetching order details...</p>
          </div>
        </div>
      )}

      {proofPreviewUrl && (
        <div
          onClick={() => setPosProofPreviewUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                UPI Payment Screenshot Proof
              </h3>
              <button
                type="button"
                onClick={() => setPosProofPreviewUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-center max-h-[70vh] overflow-auto border border-slate-200">
              <img
                src={proofPreviewUrl}
                alt="Payment Proof Screenshot"
                className="max-w-full max-h-[62vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
