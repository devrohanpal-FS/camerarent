import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiRequest, getProductImageUrl } from '../utils/api';
import { 
  User, ShieldCheck, Clock, Calendar, AlertTriangle, FileText, RefreshCw, XCircle,
  Upload, Camera, CheckCircle2, ExternalLink, FileCheck2, Eye, X, Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { user, refreshProfile } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycPreview, setKycPreview] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycSuccessMsg, setKycSuccessMsg] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [reUploadMode, setReUploadMode] = useState(false);

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [editProfileMode, setEditProfileMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
      });
    }
  }, [user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await apiRequest('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleFileChange = (file?: File | null) => {
    setKycError(null);
    setKycSuccessMsg(null);
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setKycError('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setKycError('Invalid file format. Please upload a photo (JPG, PNG, WebP) or PDF.');
      return;
    }

    setKycFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setKycPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleRemoveSelectedFile = () => {
    setKycFile(null);
    setKycPreview(null);
    setKycError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycPreview) {
      setKycError('Please select or capture a photo of your Government ID.');
      return;
    }

    setSubmittingKyc(true);
    setKycError(null);
    setKycSuccessMsg(null);
    try {
      await apiRequest('/auth/kyc', {
        method: 'PUT',
        body: JSON.stringify({ kycDocUrl: kycPreview }),
      });
      setKycSuccessMsg('Government ID uploaded successfully! Your verification is now pending review.');
      setKycFile(null);
      setKycPreview(null);
      setReUploadMode(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshProfile();
    } catch (err: any) {
      setKycError(err.message || 'Failed to upload KYC document. Please try again.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleRequestCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrderId || !cancelReason) return;

    setSubmittingCancel(true);
    try {
      await apiRequest(`/orders/${cancellingOrderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      alert('Cancellation requested successfully.');
      setCancellingOrderId(null);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone || null,
          password: profileForm.password || undefined,
        }),
      });
      alert('Profile details updated successfully!');
      setEditProfileMode(false);
      refreshProfile();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSubmittingProfile(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'APPROVED': return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
      case 'DISPATCHED': return 'bg-cyan-50 text-cyan-600 border border-cyan-200';
      case 'ACTIVE': return 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse';
      case 'RETURNED': return 'bg-teal-50 text-teal-600 border border-teal-200';
      case 'COMPLETED': return 'bg-green-50 text-green-600 border border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">
            Customer Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage KYC verification status, edit profile info, and track active bookings.</p>
        </div>
        <button
          onClick={() => { refreshProfile(); loadOrders(); }}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 transition flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" /> Booking History & Approvals
          </h2>

          {loadingOrders ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-white animate-pulse rounded-2xl border border-slate-100 shadow-sm"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white text-center py-16 rounded-3xl border border-slate-100 shadow-sm p-6">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No rentals booked yet.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Configure your gear, select dates, and complete checkout to see your bookings list here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-brand-600 font-mono">#{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-400">Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {order.cancellation && (
                        <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                          Cancel: {order.cancellation.status}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 items-center justify-between">
                        <div className="flex gap-3 items-center">
                          <img
                            src={getProductImageUrl(item.product.images)}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const orderCreatedTime = new Date(order.createdAt).getTime();
                    const hoursSinceOrder = (Date.now() - orderCreatedTime) / (1000 * 60 * 60);
                    const isWithin12Hours = hoursSinceOrder <= 12;
                    const msRemaining = Math.max(0, 12 * 3600 * 1000 - (Date.now() - orderCreatedTime));
                    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
                    const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
                    const isCancellableState = !['CANCELLED', 'DISPATCHED', 'ACTIVE', 'RETURNED', 'COMPLETED'].includes(order.status);

                    return (
                      <>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4 text-xs">
                          <div>
                            <p className="text-slate-500">Delivery Address: <strong className="text-slate-800">{order.deliveryAddress}</strong></p>
                            {order.deliveryDetails && order.deliveryDetails.includes('Custom Kit Contents:') && (
                              <p className="text-[11px] text-purple-900 bg-purple-50/80 border border-purple-200/80 p-2 rounded-lg mt-1 font-medium">
                                <strong className="text-[#6D28D9] font-bold">Custom Kit Items:</strong>{' '}
                                {order.deliveryDetails.split('Custom Kit Contents:')[1]?.split(' - [Payment')[0] || order.deliveryDetails}
                              </p>
                            )}
                          </div>

                          {order.cancellation ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Cancellation Request Pending Review
                            </span>
                          ) : isCancellableState ? (
                            isWithin12Hours ? (
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  12h Window: {hoursRemaining}h {minsRemaining}m left
                                </span>
                                <button
                                  onClick={() => setCancellingOrderId(order.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Request Cancellation
                                </button>
                              </div>
                            ) : (
                              <span
                                className="text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1.5"
                                title="Cancellation requests are only allowed within 12 hours of order confirmation."
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Cancellation window closed (12h limit exceeded)
                              </span>
                            )
                          ) : null}
                        </div>

                        {cancellingOrderId === order.id && isWithin12Hours && (
                          <form onSubmit={handleRequestCancel} className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>12-Hour Cancellation Rule:</strong> You can only cancel this booking within 12 hours of confirmation. Time remaining: <strong>{hoursRemaining}h {minsRemaining}m</strong>.
                              </span>
                            </div>

                            <div>
                              <label className="block text-[10px] text-red-700 font-extrabold uppercase tracking-wider mb-1.5">
                                Reason for Cancellation *
                              </label>
                              <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Please explain why you need to cancel this order..."
                                rows={2}
                                className="w-full bg-white border border-red-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                                required
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setCancellingOrderId(null)}
                                className="bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                type="submit"
                                disabled={submittingCancel}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {submittingCancel ? 'Submitting...' : 'Confirm Cancellation Request'}
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2a1872]" /> KYC Verification
              </h3>
              {user?.kycStatus === 'APPROVED' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              )}
              {user?.kycStatus === 'PENDING' && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                </span>
              )}
            </div>

            {kycSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{kycSuccessMsg}</span>
              </div>
            )}

            {kycError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{kycError}</span>
              </div>
            )}

            {user?.kycStatus === 'APPROVED' && !reUploadMode && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 p-5 rounded-2xl space-y-3.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">Identity Verified & Active</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Your Government ID is verified. You have full clearance to book and checkout camera equipment across Delhi NCR.
                  </p>
                </div>
                {user.kycDocUrl && (
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDocModal(true)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-600" /> View Verified ID Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setReUploadMode(true)}
                      className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold underline cursor-pointer"
                    >
                      Update ID
                    </button>
                  </div>
                )}
              </div>
            )}

            {user?.kycStatus === 'PENDING' && !reUploadMode && (
              <div className="bg-amber-50/70 border border-amber-200/90 p-5 rounded-2xl space-y-3.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">Document Under Review</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Your ID document has been submitted and is currently being verified by our operations team. Approvals typically take less than 2 hours.
                  </p>
                </div>
                {user.kycDocUrl && (
                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowDocModal(true)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" /> View Submitted Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setReUploadMode(true)}
                      className="px-3 py-2 text-amber-800 hover:text-amber-950 text-xs font-bold underline cursor-pointer"
                    >
                      Upload Clearer Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {(user?.kycStatus === 'NONE' || user?.kycStatus === 'REJECTED' || reUploadMode) && (
              <div className="space-y-4">
                {user?.kycStatus === 'REJECTED' && !reUploadMode && (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-start gap-2 text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-bold">Previous Document Was Rejected</p>
                      <p className="text-[11px] text-red-600 mt-0.5">Please upload a clear, legible picture of your Government ID (Aadhaar / Driving License / Voter ID / Passport).</p>
                    </div>
                  </div>
                )}

                {reUploadMode && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Update Document Photo:</span>
                    <button
                      type="button"
                      onClick={() => { setReUploadMode(false); setKycFile(null); setKycPreview(null); }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed space-y-1.5 font-medium">
                  <p className="text-slate-900 font-extrabold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2a1872]" /> Why is verification required?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Cinema gear values range from ₹80,000 to ₹12,00,000+. Uploading a valid Government ID helps us safeguard equipment and release your booking smoothly.
                  </p>
                </div>

                <form onSubmit={handleKycSubmit} className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />

                  {!kycPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                        isDragging
                          ? 'border-[#2a1872] bg-purple-50/50 scale-[1.01]'
                          : 'border-slate-300 hover:border-[#2a1872] bg-slate-50/70 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#2a1872] flex items-center justify-center shadow-xs">
                        <Camera className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900">
                          Click to take photo or upload ID document
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Supports PNG, JPG, WebP or PDF (Max 10MB)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                        {['Aadhaar Card', 'Driving License', 'Voter ID', 'Passport'].map((doc) => (
                          <span
                            key={doc}
                            className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl border-2 border-purple-200 bg-slate-900 overflow-hidden group">
                        {kycFile?.type === 'application/pdf' ? (
                          <div className="p-8 flex flex-col items-center justify-center text-white space-y-2">
                            <FileText className="w-12 h-12 text-purple-400" />
                            <p className="text-xs font-bold text-slate-200 truncate max-w-xs">{kycFile.name}</p>
                            <span className="text-[10px] text-purple-300 font-bold bg-purple-900/60 px-2 py-0.5 rounded">
                              PDF Document ({((kycFile.size || 0) / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                        ) : (
                          <div className="relative max-h-56 overflow-hidden flex items-center justify-center bg-slate-950">
                            <img
                              src={kycPreview}
                              alt="KYC Document Preview"
                              className="w-full max-h-56 object-contain"
                            />
                            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg flex items-center justify-between text-[10px]">
                              <span className="truncate max-w-[180px] font-semibold">{kycFile?.name || 'ID Photo'}</span>
                              <span className="font-mono text-purple-300">
                                {kycFile ? `${((kycFile.size || 0) / 1024).toFixed(0)} KB` : 'Ready'}
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveSelectedFile}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition"
                          title="Remove & Choose Another Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Document photo attached
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#2a1872] hover:underline font-bold cursor-pointer"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingKyc || !kycPreview}
                    className="min-h-[44px] w-full bg-[#2a1872] hover:bg-[#1f1157] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#2a1872]/20 active:scale-[0.99]"
                  >
                    {submittingKyc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading & Submitting ID...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Submit Document for Approval</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-600" /> Profile Details
              </h3>
              {!editProfileMode && (
                <button
                  onClick={() => setEditProfileMode(true)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editProfileMode ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+919999999999"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">New Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileMode(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProfile}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl shadow-md transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Name</span>
                  <span className="font-bold text-slate-800">{user?.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Email</span>
                  <span className="font-semibold text-slate-700 font-mono">{user?.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Phone</span>
                  <span className="font-bold text-slate-800">{user?.phone || 'Not Added'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Account Role</span>
                  <span className="font-mono text-brand-600 font-bold uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDocModal && user?.kycDocUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#2a1872]" />
                <h4 className="font-black text-sm text-slate-900">Submitted Identity Document</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center min-h-[220px] max-h-[60vh]">
              {user.kycDocUrl.endsWith('.pdf') ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-brand-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">PDF Document Submitted</p>
                  <a
                    href={getProductImageUrl(user.kycDocUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Open PDF in New Window <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <img
                  src={getProductImageUrl(user.kycDocUrl)}
                  alt="Customer ID Document"
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={getProductImageUrl(user.kycDocUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#2a1872] hover:underline flex items-center gap-1"
              >
                Open original photo in new tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
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
