import React, { useState } from 'react';
import {
  X,
  Printer,
  Shield,
  Clock,
  CheckSquare,
  AlertTriangle,
  CalendarX,
  CreditCard,
  UserCheck,
  MapPin,
  Truck,
  Scale,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TERMS_CONDITIONS, KEY_POLICY_HIGHLIGHTS, type TermItem } from '../data/termsAndConditions';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false,
}: TermsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-indigo-600" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-emerald-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'CalendarX':
        return <CalendarX className="w-5 h-5 text-rose-600" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-amber-600" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-cyan-600" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-slate-700" />;
      default:
        return <FileText className="w-5 h-5 text-brand-600" />;
    }
  };

  const filteredTerms = TERMS_CONDITIONS.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        <div className="bg-gradient-to-r from-slate-900 via-[#1f1157] to-[#2a1872] text-white p-4 sm:p-7 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md mb-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Official Equipment Rental Agreement
              </div>
              <h2
                id="terms-modal-title"
                className="text-xl sm:text-2xl font-black tracking-tight"
              >
                Terms & Conditions
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Namita Kamti • CameraRent Equipment Hire Policy & Code of Conduct
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
                title="Print Terms"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-4 sm:mt-5">
            {KEY_POLICY_HIGHLIGHTS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2 sm:p-2.5 text-white"
              >
                <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  {item.label}
                </div>
                <div className="text-xs sm:text-base font-extrabold text-white mt-0.5">
                  {item.value}
                </div>
                <div className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                  {item.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold">
            {[
              { id: 'all', label: 'All 10 Clauses' },
              { id: 'timings', label: 'Shift & Hours' },
              { id: 'payment', label: 'Payments & Cancel' },
              { id: 'custody', label: 'Gear Care & Damage' },
              { id: 'travel', label: 'Outstation & Cartage' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${activeCategory === tab.id
                    ? 'bg-[#2a1872] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter clauses (e.g., shift, cash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Notice for Hirers:</span> By hiring equipment from Namita Kamti / CameraRent, you formally accept these standard conditions. Please review all 10 terms below carefully.
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredTerms.map((term: TermItem) => (
              <div
                key={term.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-[#7c5ce6]/40 transition group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {getIcon(term.icon)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#2a1872] text-white text-xs font-black flex items-center justify-center">
                          {term.id}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          {term.title}
                        </h3>
                      </div>

                      {term.badge && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {term.badge}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 border-l-4 border-[#2a1872] p-3 rounded-r-xl">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Clause {term.id} — Official Agreement Text
                      </div>
                      <p className="text-xs sm:text-sm font-serif italic text-slate-800 leading-relaxed">
                        "{term.originalText}"
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-700">Practical Note: </strong>
                      {term.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTerms.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No matching clause found for "{searchQuery}". Try searching for words like "shift", "advance", or "Delhi".
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            All legal disputes subject to Delhi Jurisdiction.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            {showAcceptButton && onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#2a1872] hover:bg-[#1f1157] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>I Understand & Agree</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
