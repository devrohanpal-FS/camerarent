import React, { useEffect, useState } from 'react';
import { useCmsStore } from '../store/cmsStore';
import { 
  Plus, Trash2, Save, Upload, Eye, BookOpen, Heart, List, 
  Image as ImageIcon, Tag, Globe, Check, Loader2, Star
} from 'lucide-react';

export default function CmsPanel() {
  const { contents, fetchCms, updateCms, uploadImage } = useCmsStore();
  const [activeSubTab, setActiveSubTab] = useState<'landing' | 'about' | 'services' | 'portfolio' | 'team_testimonials' | 'faqs_menus' | 'seo_company'>('landing');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [homeHero, setHomeHero] = useState<any>({ sparkText: '', titleLine1: '', titleLine2: '', description: '' });
  const [homeCta, setHomeCta] = useState<any>({ badge: '', title: '', description: '', buttonText: '', link: '' });
  const [aboutPage, setAboutPage] = useState<any>({ title: '', subtitle: '', description: '', content: '', bannerUrl: '' });
  
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [clientLogos, setClientLogos] = useState<any[]>([]);
  
  const [company, setCompany] = useState<any>({ name: '', phone: '', email: '', address: '', city: '' });
  const [socials, setSocials] = useState<any>({ facebook: '', twitter: '', instagram: '', youtube: '', linkedin: '' });
  const [seo, setSeo] = useState<any>({ metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', ogImage: '', ogUrl: '' });
  const [navMenu, setNavMenu] = useState<any[]>([]);

  const [newService, setNewService] = useState({ name: '', description: '', iconName: 'ShieldCheck' });
  const [newPortfolio, setNewPortfolio] = useState({ title: '', category: 'Short Film', description: '', imageUrl: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', comment: '', rating: 5 });
  const [newTeam, setNewTeam] = useState({ name: '', role: '', imageUrl: '' });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newLogo, setNewLogo] = useState({ name: '', imageUrl: '' });
  const [newMenu, setNewMenu] = useState({ label: '', path: '' });

  useEffect(() => {
    fetchCms();
  }, [fetchCms]);

  useEffect(() => {
    if (contents.home_hero) setHomeHero(contents.home_hero);
    if (contents.home_cta) setHomeCta(contents.home_cta);
    if (contents.about_page) setAboutPage(contents.about_page);
    if (contents.services) setServices(contents.services);
    if (contents.portfolio) setPortfolio(contents.portfolio);
    if (contents.team_members) setTeam(contents.team_members);
    if (contents.testimonials) setTestimonials(contents.testimonials);
    if (contents.faqs) setFaqs(contents.faqs);
    if (contents.client_logos) setClientLogos(contents.client_logos);
    if (contents.company_details) setCompany(contents.company_details);
    if (contents.social_links) setSocials(contents.social_links);
    if (contents.seo_metadata) setSeo(contents.seo_metadata);
    if (contents.navigation_menu) setNavMenu(contents.navigation_menu);
  }, [contents]);

  const triggerNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleSaveConfig = async (key: string, value: any) => {
    try {
      await updateCms(key, value);
      triggerNotification(`Configuration '${key}' saved successfully!`);
    } catch (err: any) {
      triggerNotification(err.message || 'Failed to save configuration', true);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, onUploadSuccess: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadImage(file.name, file.type, base64);
        onUploadSuccess(url);
        triggerNotification('Image uploaded successfully!');
      } catch (err: any) {
        triggerNotification(err.message || 'Image upload failed', true);
      } finally {
        setUploadingField(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const TextareaEditor = ({ value, onChange, label, id }: { value: string; onChange: (v: string) => void; label: string; id: string }) => {
    const insertTag = (tagOpen: string, tagClose: string) => {
      const textarea = document.getElementById(id) as HTMLTextAreaElement;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selected = text.substring(start, end);
      const replacement = tagOpen + selected + tagClose;
      onChange(text.substring(0, start) + replacement + text.substring(end));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selected.length);
      }, 50);
    };

    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex gap-2">
            <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold hover:bg-slate-100">Bold</button>
            <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] italic hover:bg-slate-100">Italic</button>
            <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100">Paragraph</button>
          </div>
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            className="w-full p-3.5 text-xs text-slate-800 bg-transparent border-none outline-none focus:ring-0 min-h-[120px]"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap gap-1">
        {[
          { id: 'landing', label: 'Home Sections', icon: ImageIcon },
          { id: 'about', label: 'About Details', icon: BookOpen },
          { id: 'services', label: 'Services', icon: Heart },
          { id: 'portfolio', label: 'Portfolio', icon: Tag },
          { id: 'team_testimonials', label: 'Team & Quotes', icon: Star },
          { id: 'faqs_menus', label: 'FAQs & Menus', icon: List },
          { id: 'seo_company', label: 'SEO & Company', icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-brand-650 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-7 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          
          {activeSubTab === 'landing' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">Home Hero Configuration</h3>
                <p className="text-[10px] text-slate-400">Dynamic headings shown in the top header deck.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Spark Text Tagline</label>
                  <input
                    type="text"
                    value={homeHero.sparkText}
                    onChange={(e) => setHomeHero({ ...homeHero, sparkText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Main Title (Line 1)</label>
                    <input
                      type="text"
                      value={homeHero.titleLine1}
                      onChange={(e) => setHomeHero({ ...homeHero, titleLine1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Main Title Accent (Line 2)</label>
                    <input
                      type="text"
                      value={homeHero.titleLine2}
                      onChange={(e) => setHomeHero({ ...homeHero, titleLine2: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Hero Subtitle Paragraph</label>
                  <textarea
                    value={homeHero.description}
                    onChange={(e) => setHomeHero({ ...homeHero, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={() => handleSaveConfig('home_hero', homeHero)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Hero Section
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">CTA Promotion Banner</h3>
                <p className="text-[10px] text-slate-400">Dynamic offer banner shown in the middle of Home page.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Badge Text</label>
                    <input
                      type="text"
                      value={homeCta.badge}
                      onChange={(e) => setHomeCta({ ...homeCta, badge: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Action Button Label</label>
                    <input
                      type="text"
                      value={homeCta.buttonText}
                      onChange={(e) => setHomeCta({ ...homeCta, buttonText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Banner Heading Title</label>
                  <input
                    type="text"
                    value={homeCta.title}
                    onChange={(e) => setHomeCta({ ...homeCta, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Banner Description</label>
                  <textarea
                    value={homeCta.description}
                    onChange={(e) => setHomeCta({ ...homeCta, description: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={() => handleSaveConfig('home_cta', homeCta)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save CTA Banner
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">About Page Configuration</h3>
                <p className="text-[10px] text-slate-400">Content for the dedicated /about description page.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Header Banner Title</label>
                    <input
                      type="text"
                      value={aboutPage.title}
                      onChange={(e) => setAboutPage({ ...aboutPage, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Header Banner Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aboutPage.bannerUrl}
                        onChange={(e) => setAboutPage({ ...aboutPage, bannerUrl: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                        placeholder="https://..."
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                        {uploadingField === 'about_banner' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'about_banner', (url) => setAboutPage({ ...aboutPage, bannerUrl: url }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Banner Subtitle</label>
                  <input
                    type="text"
                    value={aboutPage.subtitle}
                    onChange={(e) => setAboutPage({ ...aboutPage, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Short Intro Description</label>
                  <textarea
                    value={aboutPage.description}
                    onChange={(e) => setAboutPage({ ...aboutPage, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <TextareaEditor
                  id="about-content"
                  label="Rich Text About Narrative Content"
                  value={aboutPage.content}
                  onChange={(v) => setAboutPage({ ...aboutPage, content: v })}
                />

                <button
                  onClick={() => handleSaveConfig('about_page', aboutPage)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save About Page
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'services' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">Core Services List</h3>
                <p className="text-[10px] text-slate-400">Manage vetted services cards with custom titles and descriptions.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add New Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Service Title</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="E.g., verified setup inspections"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Lucide Icon Name</label>
                    <select
                      value={newService.iconName}
                      onChange={(e) => setNewService({ ...newService, iconName: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="ShieldCheck">ShieldCheck</option>
                      <option value="Award">Award</option>
                      <option value="Truck">Truck</option>
                      <option value="HelpCircle">HelpCircle</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Service Description</label>
                  <input
                    type="text"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Short summary tag..."
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newService.name) return;
                    const items = [...services, { ...newService, id: `s_${Date.now()}` }];
                    await handleSaveConfig('services', items);
                    setNewService({ name: '', description: '', iconName: 'ShieldCheck' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Service Card
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Services</label>
                <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                  {services.map((s, idx) => (
                    <div key={s.id || idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold uppercase">{s.iconName}</span>
                        <h4 className="font-bold text-xs text-slate-800 mt-1">{s.name}</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{s.description}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = services.filter((item) => item.id !== s.id);
                          await handleSaveConfig('services', updated);
                        }}
                        className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">Portfolio & Case Studies</h3>
                <p className="text-[10px] text-slate-400">Featured projects and cinematic productions.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add New Case Study</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={newPortfolio.title}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="E.g., Cinematic Short"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Category / Tag</label>
                    <input
                      type="text"
                      value={newPortfolio.category}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Project Thumbnail Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPortfolio.imageUrl}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, imageUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="https://..."
                    />
                    <label className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                      {uploadingField === 'portfolio_img' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'portfolio_img', (url) => setNewPortfolio({ ...newPortfolio, imageUrl: url }))}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Brief Description</label>
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newPortfolio.title) return;
                    const items = [...portfolio, { ...newPortfolio, id: `p_${Date.now()}` }];
                    await handleSaveConfig('portfolio', items);
                    setNewPortfolio({ title: '', category: 'Short Film', description: '', imageUrl: '' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Project Case
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Portfolio Items</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map((p, idx) => (
                    <div key={p.id || idx} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex items-start gap-4">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-16 h-16 rounded-xl object-cover border shrink-0" />}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">{p.category}</span>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mt-1">{p.title}</h4>
                        <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = portfolio.filter((item) => item.id !== p.id);
                          await handleSaveConfig('portfolio', updated);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'team_testimonials' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">Testimonials & Client Quotes</h3>
                <p className="text-[10px] text-slate-400">Manage client reviews and ratings displayed on the home page.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add Testimonial</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={newTestimonial.name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      value={newTestimonial.role}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="Director"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Comment Quote</label>
                  <textarea
                    value={newTestimonial.comment}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newTestimonial.name) return;
                    const items = [...testimonials, { ...newTestimonial, id: `t_${Date.now()}` }];
                    await handleSaveConfig('testimonials', items);
                    setNewTestimonial({ name: '', role: '', comment: '', rating: 5 });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Quote Card
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Team Members Profile</h3>
                <p className="text-[10px] text-slate-400">Co-founders and management crew profiles.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add Team Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Profile Photo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeam.imageUrl}
                        onChange={(e) => setNewTeam({ ...newTeam, imageUrl: e.target.value })}
                        className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                        placeholder="https://..."
                      />
                      <label className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                        {uploadingField === 'team_img' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'team_img', (url) => setNewTeam({ ...newTeam, imageUrl: url }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newTeam.role}
                    onChange={(e) => setNewTeam({ ...newTeam, role: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                    placeholder="Technical Lead"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newTeam.name) return;
                    const items = [...team, { ...newTeam, id: `m_${Date.now()}` }];
                    await handleSaveConfig('team_members', items);
                    setNewTeam({ name: '', role: '', imageUrl: '' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Profile Card
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Clients Brand Logos</h3>
                <p className="text-[10px] text-slate-400">Cooperating studios and agency logos.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add Brand Logo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      value={newLogo.name}
                      onChange={(e) => setNewLogo({ ...newLogo, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Logo Image Upload</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLogo.imageUrl}
                        onChange={(e) => setNewLogo({ ...newLogo, imageUrl: e.target.value })}
                        className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      />
                      <label className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0">
                        {uploadingField === 'logo_img' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'logo_img', (url) => setNewLogo({ ...newLogo, imageUrl: url }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!newLogo.name) return;
                    const items = [...clientLogos, { ...newLogo, id: `l_${Date.now()}` }];
                    await handleSaveConfig('client_logos', items);
                    setNewLogo({ name: '', imageUrl: '' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Brand Logo
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'faqs_menus' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">FAQs List</h3>
                <p className="text-[10px] text-slate-400">Manage questions and answers displayed in Help FAQ section.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add FAQ Item</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Question</label>
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Answer Explanations</label>
                  <textarea
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    rows={3}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newFaq.question) return;
                    const items = [...faqs, { ...newFaq, id: `fq_${Date.now()}` }];
                    await handleSaveConfig('faqs', items);
                    setNewFaq({ question: '', answer: '' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save FAQ
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Navigation Menu Items</h3>
                <p className="text-[10px] text-slate-400">Routes and labels mapped in top header navigation.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-xs">
                <h4 className="font-bold text-xs text-slate-800">Add Navigation Route</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Link Label</label>
                    <input
                      type="text"
                      value={newMenu.label}
                      onChange={(e) => setNewMenu({ ...newMenu, label: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="E.g., Catalog"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Route Path</label>
                    <input
                      type="text"
                      value={newMenu.path}
                      onChange={(e) => setNewMenu({ ...newMenu, path: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs"
                      placeholder="E.g., /catalog"
                    />
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!newMenu.label) return;
                    const items = [...navMenu, newMenu];
                    await handleSaveConfig('navigation_menu', items);
                    setNewMenu({ label: '', path: '' });
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Route Item
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'seo_company' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-extrabold text-base text-slate-800">SEO & Open Graph Meta Tags</h3>
                <p className="text-[10px] text-slate-400">Manage headers attributes for search indexing engines.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Meta Browser Title</label>
                    <input
                      type="text"
                      value={seo.metaTitle}
                      onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Open Graph Title</label>
                    <input
                      type="text"
                      value={seo.ogTitle}
                      onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Meta Description Tags</label>
                  <textarea
                    value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Open Graph URL</label>
                    <input
                      type="text"
                      value={seo.ogUrl}
                      onChange={(e) => setSeo({ ...seo, ogUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Open Graph Share Image</label>
                    <input
                      type="text"
                      value={seo.ogImage}
                      onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSaveConfig('seo_metadata', seo)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save SEO Meta
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Company & Social Directory</h3>
                <p className="text-[10px] text-slate-400">General contacts coordinates.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Phone Helpline</label>
                    <input
                      type="text"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      value={company.city}
                      onChange={(e) => setCompany({ ...company, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={() => handleSaveConfig('company_details', company)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Contacts
                </button>
              </div>

              <div className="border-b border-slate-150 pb-4 pt-6 border-t border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Social Media Coordinates</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={socials.instagram}
                      onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={socials.linkedin}
                      onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSaveConfig('social_links', socials)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Social handles
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="border-b border-slate-150 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-4.5 h-4.5 text-brand-650" /> Live Mock Preview
            </h3>
            <span className="text-[9px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold uppercase">Real-Time</span>
          </div>

          <div className="bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 min-h-[300px] flex flex-col justify-between">
            {activeSubTab === 'landing' && (
              <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center text-center items-center bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950">
                <span className="bg-brand-500/20 text-brand-300 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {homeHero.sparkText || 'Tagline'}
                </span>
                <h1 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
                  {homeHero.titleLine1 || 'Heading 1'} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">{homeHero.titleLine2 || 'Heading 2'}</span>
                </h1>
                <p className="text-[10px] text-slate-300 max-w-sm font-medium leading-relaxed">
                  {homeHero.description || 'Description block'}
                </p>
                <div className="pt-2">
                  <span className="bg-white/10 text-white font-bold text-[9px] px-4 py-2 rounded-xl">
                    Search Gear Actions
                  </span>
                </div>
              </div>
            )}

            {activeSubTab === 'about' && (
              <div className="flex-1 flex flex-col bg-slate-900">
                <div className="h-28 bg-slate-800 relative flex items-center justify-center text-center">
                  {aboutPage.bannerUrl && <img src={aboutPage.bannerUrl} alt="About Banner" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                  <h3 className="relative z-10 text-sm font-extrabold text-white">{aboutPage.title || 'About Us'}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-[10px] text-slate-350 italic">{aboutPage.subtitle || 'Subtitle info'}</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-3">{aboutPage.description || 'Description info'}</p>
                  <div className="text-[8px] text-slate-500 border-t border-slate-800 pt-2 line-clamp-3" dangerouslySetInnerHTML={{ __html: aboutPage.content }} />
                </div>
              </div>
            )}

            {activeSubTab === 'services' && (
              <div className="p-6 space-y-4 flex-1 bg-slate-900">
                <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest text-center">SERVICES PREVIEW</p>
                <div className="grid grid-cols-2 gap-3">
                  {(services.length > 0 ? services.slice(0, 4) : [{ name: 'Inspection', description: '24-point audit check.' }]).map((s: any, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-slate-200 block">{s.name}</span>
                      <p className="text-[8px] text-slate-400 leading-normal line-clamp-2">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'portfolio' && (
              <div className="p-5 space-y-4 flex-1 bg-slate-900">
                <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest text-center">PORTFOLIO CASE STUDY</p>
                <div className="space-y-3">
                  {(portfolio.length > 0 ? portfolio.slice(0, 1) : [{ title: 'Alexa Mini Shoot', category: 'Short Film', description: 'Shot on location.', imageUrl: '' }]).map((p: any, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                      {p.imageUrl && <img src={p.imageUrl} alt="Case study" className="h-28 w-full object-cover opacity-60" />}
                      <div className="p-3.5 space-y-1">
                        <span className="text-[8px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold uppercase">{p.category}</span>
                        <h4 className="font-extrabold text-[10px] text-slate-200">{p.title}</h4>
                        <p className="text-[8px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'team_testimonials' && (
              <div className="p-5 space-y-4 flex-1 bg-slate-900 justify-center flex flex-col">
                <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest text-center">TESTIMONIAL PREVIEW</p>
                {(testimonials.length > 0 ? testimonials.slice(0, 1) : [{ name: 'Director', role: 'DOP', comment: 'Great service.', rating: 5 }]).map((t: any, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex text-amber-400 gap-0.5">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-300 italic font-medium">"{t.comment}"</p>
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                      <span className="font-bold text-[9px] text-white">{t.name}</span>
                      <span className="text-[8px] text-slate-500 font-bold">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSubTab === 'faqs_menus' && (
              <div className="p-5 space-y-3 flex-1 bg-slate-900 flex flex-col justify-center">
                <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest text-center">FAQ PREVIEW</p>
                {(faqs.length > 0 ? faqs.slice(0, 1) : [{ question: 'How long?', answer: 'Check details.' }]).map((f: any, idx) => (
                  <div key={idx} className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                    <h5 className="font-bold text-[9px] text-white">{f.question}</h5>
                    <p className="text-[8px] text-slate-450 leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSubTab === 'seo_company' && (
              <div className="p-5 space-y-4 flex-1 bg-slate-900 flex flex-col justify-center">
                <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest text-center">COMPANY HEADLINES</p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2.5 text-[9px] text-slate-300">
                  <div className="font-bold text-white border-b border-white/5 pb-1.5">{company.name || 'Company Name'}</div>
                  <div>📞 {company.phone || 'Phone'}</div>
                  <div>✉ {company.email || 'Email'}</div>
                  <div>📍 {company.address || 'Address'}</div>
                </div>
              </div>
            )}

            <div className="bg-slate-950 border-t border-slate-900 px-5 py-3.5 flex justify-between items-center text-[8px] text-slate-500 shrink-0">
              <span>{company.name || 'CameraRent'} Mock Footer</span>
              <span className="flex gap-2">
                <a href="#fb" className="hover:underline">Facebook</a>
                <a href="#ig" className="hover:underline">Instagram</a>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
