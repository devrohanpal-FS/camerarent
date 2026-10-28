import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, ExternalLink, Navigation, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useCmsStore } from '../store/cmsStore';

export default function ContactUs() {
  const { contents } = useCmsStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const officialAddress = "74, Lower Ground Floor, Gautam Nagar, New Delhi, Delhi 110049";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officialAddress)}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(officialAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const company = contents.company_details || {
    name: 'CameraRent Delhi NCR Hub',
    phone: '+91 98712 34567',
    email: 'support@camerarent.com',
    address: officialAddress
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(false);

    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full border border-brand-200 uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-brand-600" /> Delhi NCR Headquarters & Experience Hub
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-sans">
          Visit Our Studio & Equipment Hub
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Need hands-on gear inspection, custom production packages, or instant local shoot dispatch? Walk in or get in touch with our camera technicians.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-base md:text-lg font-bold">Physical Hub & Verification Desk</h2>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {officialAddress}
            </p>
            <p className="text-[11px] text-brand-300">
              Landmark: Near AIIMS Delhi & South Extension Metro Station (Pink Line)
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Navigation className="w-4 h-4" /> Open in Google Maps
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

        <div className="w-full h-[380px] sm:h-[450px] relative bg-slate-100">
          <iframe
            title="CameraRent Gautam Nagar Office Location"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-extrabold text-base text-slate-800 flex items-center justify-between">
              <span>Direct Contacts</span>
              <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Active Desk
              </span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Operational Hub Address</h3>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5 leading-snug">
                    {officialAddress}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gautam Nagar, South Delhi, PIN: 110049
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Hotline & WhatsApp Support</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Call or chat for instant camera pickup & availability.</p>
                  <a href="tel:+919871234567" className="text-xs text-brand-600 font-bold mt-1 block hover:underline">
                    +91 98712 34567 / +91 88001 23456
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Support & Billing Email</h3>
                  <p className="text-xs text-slate-500 mt-0.5">For enterprise invoices, production contracts & quotes.</p>
                  <a href="mailto:support@camerarent.com" className="text-xs text-blue-600 font-bold mt-1 block hover:underline">
                    {company.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
              <Clock className="w-5 h-5 text-brand-600 shrink-0" />
              <span>Studio & Dispatch Hours</span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed space-y-1">
              <p>• <strong>Monday – Saturday:</strong> 8:30 AM to 8:30 PM IST</p>
              <p>• <strong>Sunday:</strong> 9:00 AM to 6:00 PM IST</p>
              <p className="text-brand-600 font-semibold pt-1">
                ⚡ 24/7 emergency shoot dispatch available for registered production teams.
              </p>
            </div>
          </div>

        </div>

        <div className="lg:col-span-7 bg-white p-6 md:p-8 border border-slate-200/80 rounded-3xl shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="font-extrabold text-lg text-slate-900">Send an Instant Inquiry</h2>
            <p className="text-xs text-slate-500">Need specific cine lenses or multicam kits? Our technical dispatchers respond quickly.</p>
          </div>

          {submitted && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Message sent successfully! Our Delhi logistics desk has received your request.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Pal"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Shoot booking, corporate bulk discount, gear request..."
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Message / Gear List</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention required cameras, lenses, dates, shoot location, and pickup or delivery preference..."
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white min-h-[130px] transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Send Message to Delhi Hub'} <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
