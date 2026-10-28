import React, { useState } from 'react';
import {
  FileText,
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
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Search,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TERMS_CONDITIONS, KEY_POLICY_HIGHLIGHTS, type TermItem } from '../data/termsAndConditions';

export default function Policies() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
        return <FileText className="w-5 h-5 text-[#2a1872]" />;
    }
  };

  const filteredTerms = TERMS_CONDITIONS.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const faqs = [
    {
      q: 'How is 1 shift counted if delivery is at 10:00 AM?',
      a: '1 shift is 8 hours from delivery time (10:00 AM to 6:00 PM). If shooting extends past 8:00 PM (more than 10 total hours), additional time is billed on an hourly overtime basis.'
    },
    {
      q: 'What is the advance payment requirement to book gear?',
      a: '50% of the total equipment hire value must be paid at the time of booking to reserve the date and gear. The remaining 50% balance is payable when returning the equipment.'
    },
    {
      q: 'Does an attendant accompany the camera gear?',
      a: 'Yes, one trained technical attendant from Namita Kamti accompanies the equipment throughout the shoot to assist with gear verification and technical handling.'
    },
    {
      q: 'What are the charges if my shoot is outside Delhi?',
      a: 'Standard charges apply to local Delhi hiring. For outstation shoots outside Delhi NCR, an additional 50% surcharge is levied on standard equipment rates.'
    },
    {
      q: 'Who pays for cab / cartage to the shooting location?',
      a: 'If equipment is dispatched to your specific shoot location, all actual conveyance/cartage charges are borne by the hirer and settled directly in cash with the attendant.'
    },
    {
      q: 'What happens if I need to cancel my booking?',
      a: 'If cancelled with at least 48 hours prior notice, only nominal charges of 10% apply. If cancelled with less notice or on shoot day, cancellation charges equal to a minimum of 1 full shift will be payable.'
    }
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#1f1157] to-[#2a1872] p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Official Camera & Equipment Rental Terms
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Terms & Conditions
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
            Please read these terms carefully before booking equipment. By confirming a booking with <strong>Namita Kamti / CameraRent</strong>, the hirer agrees to be bound by the 10 contractual terms set out below.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1f1157] font-bold text-xs shadow-md hover:bg-slate-100 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#2a1872]" />
              <span>Print / Save Copy</span>
            </button>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition"
            >
              Browse Equipment
            </Link>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {KEY_POLICY_HIGHLIGHTS.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition space-y-1 sm:space-y-1.5"
          >
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              {item.label}
            </span>
            <span className="text-lg sm:text-2xl font-black text-[#2a1872] block">
              {item.value}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-700 leading-normal">
              {item.subtext}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All 10 Clauses' },
            { id: 'timings', label: 'Shifts & Support' },
            { id: 'payment', label: 'Advance & Cancellations' },
            { id: 'custody', label: 'Care & Damages' },
            { id: 'travel', label: 'Delhi & Outstation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2a1872] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clauses (e.g. 50%, shift, cash)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a1872]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTerms.map((term: TermItem) => (
          <div
            key={term.id}
            id={`clause-${term.id}`}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:border-[#7c5ce6]/40 transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getIcon(term.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#2a1872] text-white">
                      Clause {term.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      {term.category}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                    {term.title}
                  </h2>
                </div>
              </div>

              {term.badge && (
                <div className="self-start sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#2a1872] border border-purple-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    {term.badge}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border-l-4 border-[#2a1872]">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Contractual Clause (As Printed in Rental Agreement)
              </div>
              <p className="text-sm sm:text-base font-serif italic text-slate-900 leading-relaxed">
                "{term.originalText}"
              </p>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white rounded-xl">
              <strong className="text-slate-800 shrink-0 font-semibold">
                Guidance Note:
              </strong>
              <span>{term.explanation}</span>
            </div>
          </div>
        ))}

        {filteredTerms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-800">No matching clause found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any terms matching "{searchQuery}". Try using broader terms like "booking", "damage", or "attendant".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="text-xs font-bold text-[#2a1872] underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Frequently Asked Questions About Rental Terms
            </h2>
            <p className="text-xs text-slate-500">
              Practical answers to the most common queries regarding shifts, payments, and equipment custody.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-lg font-bold text-[#2a1872] shrink-0">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-emerald-300 mb-1">
            Delhi Jurisdiction
          </div>
          <h3 className="text-lg font-bold text-white">
            Have questions about custom multi-day or outstation shoots?
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Our team is available 7 days a week to review logistics, custom shift timings, or transportation needs for feature films and commercial shoots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7c5ce6] hover:bg-[#6c48e0] text-white text-xs font-bold shadow-lg transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
