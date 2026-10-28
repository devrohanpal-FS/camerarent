import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useCmsStore } from '../store/cmsStore';

export default function Faq() {
  const { contents } = useCmsStore();

  const faqList = contents.faqs || [
    {
      question: "How does the date-based availability calendar check work?",
      answer: "Our system runs an active double-booking collision check. When you query a date range, it checks all active bookings (orders where status is not cancelled) and manual vendor maintenance blackouts. Unavailable dates are highlighted with a line-through in the date dropdown picker, guaranteeing you will never experience double-booked gear on set."
    },
    {
      question: "Why is my KYC verification required, and how long does it take?",
      answer: "Because camera packages and anamorphic lenses are high-value equipment, we require a one-time profile verification. You can upload a photo of your Government ID card (Aadhar, PAN, or Passport) in your Customer Dashboard. Our admin desk reviews and approves document files in under 2 hours during active shift hours."
    },
    {
      question: "When do I get my security deposit returned?",
      answer: "Security deposits are held as authorization holds on card checkout. Once the rental duration concludes and the vendor confirms there is no sensor burn, water damage, or optical scratches, we cancel the hold. The funds appear back in your account within 24 hours depending on your bank's release timeline."
    },
    {
      question: "Can I extend my rental duration mid-shoot?",
      answer: "Yes, you can request extensions in your Dashboard, provided another crew has not already booked the same product unit for overlapping dates. If the gear is available, you will pay the pro-rated daily rates to secure the extension."
    },
    {
      question: "Do you offer equipment delivery, or is it pick-up only?",
      answer: "We support both. During checkout, you can select 'Local Pickup' to collect directly from the supplier's operations hub, or select 'Coordinated Delivery' to have verified courier vans deliver the shock-absorbent camera cases directly to your set."
    },
    {
      question: "What happens if a lens gets scratched or gear breaks on set?",
      answer: "If damage occurs, please notify the vendor immediately via WhatsApp or our support helpline. If you purchased our optional Damage Waiver protection, your maximum liability is capped at $150. Otherwise, the vendor will assess repair diagnostics and debit costs from your security deposit hold."
    }
  ];

  const company = contents.company_details || {
    email: 'support@camerarent.com',
    phone: '+91 (022) 555-0199'
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 bg-slate-50">
      
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full border border-brand-200 uppercase tracking-wider">
          Help Desk
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-500">
          Find fast answers to common questions about logistics, deposits, and verification policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {faqList.map((item: any, idx: number) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3 hover:border-brand-300 transition duration-300">
            <div className="flex gap-2 items-start text-brand-600">
              <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-slate-800 leading-normal">{item.question}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-7">
              {item.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-6 text-center text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
        Still have questions or need assistance with a custom bulk rental package? Contact our dispatch crew at <a href={`mailto:${company.email}`} className="text-brand-600 hover:underline font-bold">{company.email}</a> or phone {company.phone}.
      </div>

    </div>
  );
}
