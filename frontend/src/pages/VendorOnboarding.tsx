import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

export default function VendorOnboarding() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 bg-slate-50">
      
      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="bg-white/20 border border-white/10 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Partner Program
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-sans">
            Rent Out Your Production Gear
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            List cameras, lenses, and support kits on CameraRent. Earn steady revenue from vetted filmmakers.
          </p>
        </div>
        <Link
          to="/signup"
          className="z-10 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-lg transition duration-200 cursor-pointer flex items-center gap-1.5"
        >
          Register as Vendor <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 text-center">Why Partner with CameraRent?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">10% Low Commission</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We charge a flat 10% transaction fee only when you successfully rent out equipment. No fixed monthly listing subscriptions.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Deposit Protected</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every client booking places a security deposit authorization on checkout, guaranteeing you are protected against damaged gear or late returns.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Automation Tools</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage equipment availability, calendar blackouts, client handovers, and weekly payouts via your custom vendor portal.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-800">Onboarding Rules & Guidelines</h3>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            To maintain the highest quality standards, all vendors must adhere to the following rules:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
            <li><strong>Gear Calibration:</strong> Lenses must be free of mold, internal dust, and back-focus alignment issues. Sensor glass must be fully clean before dispatch.</li>
            <li><strong>Serial Numbers:</strong> Every listed product listing must have its unique manufacturer serial number logged to facilitate correct asset assignment.</li>
            <li><strong>Verification:</strong> Payments are wired directly to your verified business bank account every Tuesday for rentals completed during the previous week.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
