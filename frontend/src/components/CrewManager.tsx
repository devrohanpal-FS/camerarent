import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Clock,
  Briefcase,
  ExternalLink,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Sun,
  Volume2,
  Film,
  Building
} from 'lucide-react';
import { apiRequest, getProductImageUrl } from '../utils/api';
import { Link } from 'react-router-dom';

interface CrewMember {
  id: string;
  name: string;
  slug: string;
  role: string;
  department: string;
  dailyRate: number;
  priceOnRequest: boolean;
  shiftHours: number;
  experience: string;
  phone: string;
  images: string;
  description: string;
  totalStock: number;
  isAvailable: boolean;
  createdAt: string;
}

const PRESET_CREW_PHOTOS = [
  { label: 'DOP (Director of Photography)', url: '/images/crew/crew-dop.jpg' },
  { label: 'Camera Assistant / 1st AC', url: '/images/crew/crew-camera-assistant.jpg' },
  { label: 'Light Operator / Gaffer', url: '/images/crew/crew-light-operator.jpg' },
  { label: 'Light Man / Lighting Grip', url: '/images/crew/crew-light-man.jpg' },
  { label: 'Sound Recordist / Audio Mixer', url: '/images/crew/crew-sound-recordist.jpg' },
  { label: 'Sound Assistant / Boom Op', url: '/images/crew/crew-sound-assistant.jpg' },
  { label: 'Film Director', url: '/images/crew/crew-film-director.jpg' },
  { label: 'Line Producer', url: '/images/crew/crew-line-producer.jpg' },
  { label: 'Studio Assistant / Floor Tech', url: '/images/crew/crew-studio-assist.jpg' },
];

export default function CrewManager() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'DOP (Director of Photography)',
    department: 'Camera',
    dailyRate: 0,
    priceOnRequest: true,
    shiftHours: 8,
    experience: '5+ Years • Commercials & Features',
    phone: '+91 98110 00000',
    images: '/images/crew/crew-dop.jpg',
    description: '',
    totalStock: 1,
  });

  useEffect(() => {
    loadCrew();
  }, []);

  async function loadCrew() {
    setLoading(true);
    try {
      const data = await apiRequest('/crew');
      setCrew(data);
    } catch (err: any) {
      console.error('Failed to load crew:', err);
      showToast('error', 'Failed to load crew members: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const uploadRes = await apiRequest('/products/upload-images', {
          method: 'POST',
          body: JSON.stringify({
            files: [{ name: file.name, dataUrl: base64 }],
          }),
        });
        if (uploadRes?.urls?.[0]) {
          setFormData((prev) => ({ ...prev, images: uploadRes.urls[0] }));
          showToast('success', 'Profile photo uploaded successfully');
        }
      } catch (err: any) {
        showToast('error', 'Photo upload failed: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      showToast('error', 'Name and Role are required');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/crew', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      showToast('success', `Crew member "${formData.name}" added successfully!`);
      setShowAddModal(false);
      resetForm();
      loadCrew();
    } catch (err: any) {
      showToast('error', 'Failed to add crew member: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(item: CrewMember) {
    setEditingCrew(item);
    setFormData({
      name: item.name,
      role: item.role,
      department: item.department,
      dailyRate: item.dailyRate,
      priceOnRequest: item.priceOnRequest,
      shiftHours: item.shiftHours,
      experience: item.experience,
      phone: item.phone,
      images: item.images,
      description: item.description,
      totalStock: item.totalStock,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCrew) return;

    setSubmitting(true);
    try {
      await apiRequest(`/crew/${editingCrew.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      showToast('success', `Crew member "${formData.name}" updated successfully!`);
      setEditingCrew(null);
      resetForm();
      loadCrew();
    } catch (err: any) {
      showToast('error', 'Failed to update crew member: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    try {
      await apiRequest(`/crew/${id}`, {
        method: 'DELETE',
      });
      showToast('success', 'Crew member deleted successfully');
      setDeleteConfirmId(null);
      loadCrew();
    } catch (err: any) {
      showToast('error', 'Failed to delete crew member: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      role: 'DOP (Director of Photography)',
      department: 'Camera',
      dailyRate: 0,
      priceOnRequest: true,
      shiftHours: 8,
      experience: '5+ Years • Commercials & Features',
      phone: '+91 98110 00000',
      images: '/images/crew/crew-dop.jpg',
      description: '',
      totalStock: 1,
    });
  }

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'Camera':
        return <Camera className="w-3.5 h-3.5 text-purple-600" />;
      case 'Lighting':
        return <Sun className="w-3.5 h-3.5 text-amber-600" />;
      case 'Audio':
        return <Volume2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'Direction & Production':
        return <Film className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Building className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Camera':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Lighting':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Audio':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Direction & Production':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const filteredCrew = crew.filter((item) => {
    const matchesDept = selectedDept === 'all' || item.department.toLowerCase() === selectedDept.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query) ||
      item.experience.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesDept && matchesSearch;
  });

  const departmentCounts = {
    camera: crew.filter((c) => c.department === 'Camera').length,
    lighting: crew.filter((c) => c.department === 'Lighting').length,
    audio: crew.filter((c) => c.department === 'Audio').length,
    direction: crew.filter((c) => c.department.includes('Direction') || c.department.includes('Production')).length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-1.5 border border-purple-200">
            <Users className="w-3.5 h-3.5" />
            <span>On-Set Production Crew</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Crew Members Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update, and manage verified cinematographers, focus pullers, gaffers, sound mixers & on-set staff.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-[#2a1872] hover:bg-[#1f1157] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crew Member</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Crew
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-0.5">
            {crew.length}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">Active & Available</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Camera Dept
          </span>
          <span className="text-2xl font-black text-purple-700 block mt-0.5">
            {departmentCounts.camera}
          </span>
          <span className="text-[11px] text-slate-500">DOPs & ACs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Lighting Dept
          </span>
          <span className="text-2xl font-black text-amber-600 block mt-0.5">
            {departmentCounts.lighting}
          </span>
          <span className="text-[11px] text-slate-500">Gaffers & Grips</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sound Dept
          </span>
          <span className="text-2xl font-black text-blue-600 block mt-0.5">
            {departmentCounts.audio}
          </span>
          <span className="text-[11px] text-slate-500">Recordists & Booms</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { id: 'all', label: `All (${crew.length})` },
            { id: 'camera', label: 'Camera' },
            { id: 'lighting', label: 'Lighting' },
            { id: 'audio', label: 'Audio / Sound' },
            { id: 'direction & production', label: 'Direction & Prod.' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                selectedDept === tab.id
                  ? 'bg-[#2a1872] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#2a1872]" />
          <span>Loading crew personnel...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCrew.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-200 transition flex flex-col group"
            >
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <img
                  src={getProductImageUrl(member.images)}
                  alt={member.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/crew/crew-dop.jpg';
                  }}
                />
                
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />

                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border backdrop-blur-md shadow-xs ${getDeptColor(
                      member.department
                    )}`}
                  >
                    {getDeptIcon(member.department)}
                    <span>{member.department}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-black backdrop-blur-md shadow-xs">
                    Available
                  </span>
                </div>

                <div className="absolute bottom-3 inset-x-3 text-white">
                  <h3 className="font-extrabold text-base leading-tight drop-shadow-sm">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-200 font-medium drop-shadow-xs">
                    {member.role}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {member.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <span>{member.shiftHours}h Shift Base</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      <span className="line-clamp-1">{member.experience}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Shift Rate
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {member.priceOnRequest || member.dailyRate === 0
                        ? 'Price on Request'
                        : `₹${member.dailyRate.toLocaleString('en-IN')} / Shift`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/products/${member.slug}`}
                      target="_blank"
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition"
                      title="View public catalog listing"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleStartEdit(member)}
                      className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer"
                      title="Edit crew member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(member.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                      title="Delete crew member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}

          {filteredCrew.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No crew members found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No personnel found matching "{searchQuery}". Click "Add New Crew Member" to create a new profile.
              </p>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-950 to-[#2a1872] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Add New Crew Member</h3>
                <p className="text-xs text-slate-300">
                  Create a verified on-set personnel profile with photo and shift rates.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name / Listing Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Senior DOP (Director of Photography) or Rahul Verma"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. 1st Camera Assistant & Focus Puller"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  >
                    <option value="Camera">Camera</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Audio">Audio / Sound</option>
                    <option value="Direction & Production">Direction & Production</option>
                    <option value="Studio & Support">Studio & Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Shift Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.shiftHours}
                    onChange={(e) => setFormData({ ...formData, shiftHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Daily Shift Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formData.priceOnRequest}
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872] disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.priceOnRequest}
                      onChange={(e) => setFormData({ ...formData, priceOnRequest: e.target.checked })}
                      className="rounded text-[#2a1872]"
                    />
                    <span className="text-[10px] text-slate-500 font-semibold">Price on Request</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Profile Photo (Person Portrait) *
                </label>
                
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-2">
                  <img
                    src={formData.images}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/crew/crew-dop.jpg';
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={formData.images}
                      onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                      placeholder="Image URL or choose preset below"
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer transition">
                        <Upload className="w-3 h-3 text-[#2a1872]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">or pick preset:</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CREW_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, images: preset.url })}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        formData.images === preset.url
                          ? 'bg-[#2a1872] text-white border-[#2a1872]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Experience / Seniority
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 8+ Years • ARRI & Sony Cine Certified"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Professional Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed background, camera rigs or lighting consoles experienced with..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save Crew Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCrew && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCrew(null);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-950 to-[#2a1872] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Edit Crew Member</h3>
                <p className="text-xs text-slate-300">
                  Update role details, shift rates, contact or profile photo.
                </p>
              </div>
              <button
                onClick={() => setEditingCrew(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  >
                    <option value="Camera">Camera</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Audio">Audio / Sound</option>
                    <option value="Direction & Production">Direction & Production</option>
                    <option value="Studio & Support">Studio & Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Shift Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.shiftHours}
                    onChange={(e) => setFormData({ ...formData, shiftHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Daily Shift Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formData.priceOnRequest}
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872] disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.priceOnRequest}
                      onChange={(e) => setFormData({ ...formData, priceOnRequest: e.target.checked })}
                      className="rounded text-[#2a1872]"
                    />
                    <span className="text-[10px] text-slate-500 font-semibold">Price on Request</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Profile Photo (Person Portrait) *
                </label>
                
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-2">
                  <img
                    src={formData.images}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/crew/crew-dop.jpg';
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={formData.images}
                      onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                      placeholder="Image URL or choose preset below"
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer transition">
                        <Upload className="w-3 h-3 text-[#2a1872]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">or pick preset:</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CREW_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, images: preset.url })}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        formData.images === preset.url
                          ? 'bg-[#2a1872] text-white border-[#2a1872]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Experience / Seniority
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Professional Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCrew(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  <span>Update Crew Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete Crew Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this crew member? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
