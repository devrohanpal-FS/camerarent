import React from 'react';
import { Link } from 'react-router-dom';
import FlipLogo from './FlipLogo';
import { useCmsStore } from '../store/cmsStore';

export default function Footer() {
  const { contents } = useCmsStore();

  const footer = contents.footer_content || {
    description: 'CameraRent is a premium multivendor online marketplace where production crews can rent verified camera bodies, anamorphic lenses, lights, and grip support directly from local vetted suppliers.',
    copyright: '© 2026 CameraRent Inc. All rights reserved.',
    links: [
      { label: 'Privacy Policy', path: '/policies' },
      { label: 'Terms of Use', path: '/policies' }
    ]
  };

  const company = contents.company_details || {
    name: 'CameraRent India',
    email: 'support@camerarent.com',
    address: 'Delhi, India IN'
  };

  const socials = contents.social_links || {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com'
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900 mt-auto w-full text-xs">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-slate-900">

        <div className="md:col-span-2 space-y-4">
          <div className="inline-block bg-white/95 px-3 py-1.5 rounded-2xl shadow-sm">
            <FlipLogo cardClassName="w-44 sm:w-52 h-10 sm:h-11" />
          </div>
          <p className="text-slate-500 leading-relaxed max-w-sm">
            {footer.description}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Equipment</h4>
          <ul className="space-y-2">
            <li><Link to="/catalog?category=cameras" className="hover:text-white transition">Cameras</Link></li>
            <li><Link to="/catalog?category=lenses" className="hover:text-white transition">Lenses</Link></li>
            <li><Link to="/catalog?category=lights" className="hover:text-white transition">Lights</Link></li>
            <li><Link to="/catalog?category=audio" className="hover:text-white transition">Audio</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2">
            <li><Link to="/terms-and-conditions" className="hover:text-white transition">Terms & Conditions</Link></li>
            <li><Link to="/policies" className="hover:text-white transition">Rental Policies</Link></li>
            <li><Link to="/faq" className="hover:text-white transition">Help FAQ</Link></li>
            <li><Link to="/vendor-onboarding" className="hover:text-white transition">Vendor Onboarding</Link></li>
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Contact Info</h4>
          <p className="text-slate-500">{company.name}</p>
          <p className="text-slate-500">{company.address}</p>
          <Link to="/contact" className="text-slate-300 font-semibold mt-1 block hover:text-brand-400">
            {company.email}
          </Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-600">
        <p>{footer.copyright}</p>
        <div className="flex gap-4">
          {Object.entries(socials).map(([key, val]) => (
            val ? (
              <a
                key={key}
                href={val as string}
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-400 capitalize"
              >
                {key}
              </a>
            ) : null
          ))}
        </div>
      </div>
    </footer>
  );
}
