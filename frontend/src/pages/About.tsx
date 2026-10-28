import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCmsStore } from '../store/cmsStore';
import {
  ShieldCheck,
  Award,
  Camera,
  Users,
  MapPin,
  CheckCircle2,
  Star,
  Sparkles,
  Film,
  Sliders,
  ArrowRight,
  Quote,
  Building2,
  Clock,
  Check,
  ChevronRight
} from 'lucide-react';

export default function About() {
  const { fetchCms } = useCmsStore();

  useEffect(() => {
    fetchCms();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchCms]);

  const stats = [
    { value: '10+', label: 'Years on Set', subtext: 'In film & AV production' },
    { value: '500+', label: 'Projects Supported', subtext: 'TVCs, tele-films & indie films' },
    { value: '1,200+', label: 'Verified Gear Units', subtext: 'Bodies, lenses, lights & grip' },
    { value: '100%', label: 'Pre-Flight Calibrated', subtext: 'Zero on-set surprises' }
  ];

  const milestones = [
    {
      year: '2014',
      title: 'Foundation of Mount Everest Media',
      description:
        'Established in Gautam Nagar, South Delhi as a specialized film production support and audio-visual gear rental facility catering to indie filmmakers and television crews.'
    },
    {
      year: '2018',
      title: 'Expansion into High-End Cinema Rigs',
      description:
        'Added large-format cinema lines (Sony FX/Venice, RED, Blackmagic) and premium cinema prime lenses (Zeiss CP.3, Cooke, Angenieux) to support commercial and documentary productions.'
    },
    {
      year: '2022',
      title: 'National Recognition from Aputure India',
      description:
        'Awarded "Top Rated Lighting Rental" by Aputure India in recognition of meticulous equipment maintenance and an extensive inventory of high-CRI fixtures.'
    },
    {
      year: '2026',
      title: 'CameraRent Digital Platform Launch',
      description:
        'Launched CameraRent to bring instant inventory booking, digital KYC, verified transparent pricing, and 24/7 on-set dispatch to creators across Delhi-NCR and India.'
    }
  ];

  const corePillars = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-600" />,
      title: '24-Point Sensor & Optical Check',
      description:
        'Every camera sensor is vacuum-cleaned and test-shot for hot pixels and micro-dust. Lenses undergo optical alignment and back-focus verification before packaging in heavy-duty flight cases.'
    },
    {
      icon: <Award className="w-6 h-6 text-amber-500" />,
      title: 'Aputure-Authorized Lighting Hub',
      description:
        'Officially recognized for pristine lighting fixtures. From Aputure 1200D Pro and 600C Pro to Nanlite and Godox strobes, all gear is firmware-updated and color-metered (CRI 96+).'
    },
    {
      icon: <MapPin className="w-6 h-6 text-emerald-600" />,
      title: 'Strategic South Delhi Hub (Gautam Nagar)',
      description:
        'Located at the heart of Delhi’s film and media district (74, Basement, Gautam Nagar), enabling rapid same-day dispatch and emergency gear delivery to Delhi, Noida Film City, and Gurugram.'
    },
    {
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      title: '24/7 On-Call Production Support',
      description:
        'Camera emergencies happen at 3 AM on night shoots. Our certified technicians are available around the clock to walk you through settings or arrange immediate replacement units.'
    }
  ];

  const gearCategories = [
    {
      title: 'Cinema & Broadcast Bodies',
      items: ['Sony FX3 / FX6 / FX9 Cinema Line', 'Sony VENICE Full-Frame System', 'Blackmagic Pocket Cinema 6K Pro', 'RED Komodo & V-Raptor Packages', 'Sony A7S III & Alpha Series'],
      link: '/catalog?category=cameras'
    },
    {
      title: 'Optics & Cinema Glass',
      items: ['Zeiss CP.3 Cinema Primes', 'Sony G Master Full Lens Suite', 'Cooke Anamorphic / Full Frame', 'Angenieux Cine Zooms', 'Sirui 1.33x & 1.6x Anamorphics'],
      link: '/catalog?category=lenses'
    },
    {
      title: 'Precision Lighting & Power',
      items: ['Aputure Electro Storm & 1200D Pro', 'Aputure LS 600C Pro Full Color', 'Nanlite Forza & Pavotube Arrays', 'Godox AD600 Pro Outdoor Strobes', 'Heavy-Duty C-Stands & Grip Combos'],
      link: '/catalog?category=lights'
    },
    {
      title: 'Sound, Gimbals & Wireless Monitoring',
      items: ['Sennheiser MKH 416 & Wireless Lavs', 'DJI Ronin RS3 / RS4 Pro Combos', 'Lilliput 14-inch & SmallHD Monitors', 'Hollyland & Teradek Wireless Video', 'Tentacle Sync E Timecode Kits'],
      link: '/catalog?category=audio'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 space-y-16 pb-24 font-sans selection:bg-brand-500 selection:text-white">

      <section className="relative bg-gradient-to-b from-slate-950 via-[#130a38] to-slate-950 text-white overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-brand-200 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AN INTEGRATED MEDIA ENTERPRISE • MOUNT EVEREST MEDIA × CAMERARENT</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
              Powering India's Storytellers With <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">Cinema-Grade Equipment</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Rooted in South Delhi's film district of Gautam Nagar, Mount Everest Media has supported independent films, tele-films, and commercial shoots for over a decade. CameraRent is our verified digital marketplace bringing this production ecosystem straight to your set.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-900/40 hover:shadow-brand-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Camera className="w-4 h-4" />
              <span>Explore Equipment Catalog</span>
            </Link>
            <a
              href="#founder-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all hover:border-white/30"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Meet Our Founder</span>
            </a>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-brand-400/40 transition-colors text-center"
              >
                <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">{s.value}</div>
                <div className="text-xs sm:text-sm font-bold text-brand-300 mt-1">{s.label}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">{s.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">

          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 bg-gradient-to-br from-slate-900 via-[#1a123d] to-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-200 w-full max-w-sm flex items-center justify-center">
              <img
                src="/images/logo/Mount-Everest-MediaLogo.png"
                alt="Mount Everest Media Official Logo"
                className="max-h-20 w-auto object-contain"
                loading="lazy"
              />
            </div>

            <div className="text-center space-y-2 z-10">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Delhi Film & AV Heritage
              </span>
              <h3 className="text-xl font-black text-white">Mount Everest Media</h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-medium">
                Production equipment hire, line production support, tele-films, commercial TVCs, and documentaries in New Delhi.
              </p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>Gautam Nagar, Delhi</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Verified Hub
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-widest">
                <Film className="w-4 h-4" />
                <span>The Story of Our Foundation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                Built by Working Filmmakers, for Production Crews Who Demand Perfection
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Mount Everest Media was established in Gautam Nagar, New Delhi—one of the prime operational hearts of North India’s broadcast, independent cinema, and advertising film communities. Over the past decade, we have served as the trusted equipment backbone for directors of photography (DoPs), gaffers, and line producers filming everything from hard-hitting documentaries to high-fashion commercial spots and tele-serials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Comprehensive Production Support</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  End-to-end hardware for feature shoots: high-frame-rate cameras, cinema primes, monitors, wireless follow-focus, and heavy-duty grip.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>The CameraRent Digital Evolution</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  CameraRent transforms Mount Everest Media's physical warehouse into an interactive digital rental platform with instant availability calendars.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>HQ: 74, Basement, Gautam Nagar, New Delhi</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section id="founder-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-[#1b1045] to-slate-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden border border-slate-800 shadow-2xl">
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative group max-w-sm w-full">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-purple-500 to-brand-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500" />

                <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-white/20 shadow-2xl">
                  <img
                    src="/images/founder/Founder.png"
                    alt="Lakshman Kumar — Founder & Managing Director"
                    className="w-full h-auto object-cover object-top transition duration-500 group-hover:scale-102"
                    loading="lazy"
                  />

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 pt-10 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-[11px] font-black text-amber-300 tracking-wider uppercase mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>Founder & Managing Director</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Laxman Kamti</h3>
                    <p className="text-xs text-slate-300 font-medium">Mount Everest Media & CameraRent</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  <span>Leadership Spotlight</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                  "Cinematic storytelling begins with equipment you can trust with your eyes closed."
                </h2>
              </div>

              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <Quote className="w-8 h-8 text-amber-400/40 -mb-2" />
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed italic font-normal">
                  "For more than ten years in Gautam Nagar, we have worked side-by-side with cinematographers, documentary crews, and student directors. In film, there is no such thing as a second chance when a sensor overheats or a light ballasts flickers in the middle of a golden-hour shot.
                </p>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed italic font-normal">
                  We established Mount Everest Media and built CameraRent with a single goal: to make verified, meticulously calibrated cinema gear readily accessible to every creator in Delhi-NCR without the traditional red tape."
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <div>
                    <span className="font-extrabold text-white text-sm">Laxman Kamti</span>
                    <span className="block text-xs text-brand-300">New Delhi, India</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest block font-bold">EXPERIENCE</span>
                    <span className="text-xs font-bold text-amber-300">30+ Years On Set</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hands-on Tech</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Personal inspection of cinema cameras, sensors, and lighting grids.</p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Creator-Centric</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Fair day/week slabs with student & indie filmmaker discounts.</p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>24/7 Hotline</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Direct on-call technical assistance for any on-set emergencies.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 lg:p-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>National Industry Honor</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Awarded "Top Rated Lighting Rental" by Aputure India
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  In recognition of well-maintained inventory covering a comprehensive array of Aputure lighting fixtures, light-shaping accessories, and wireless lighting software.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Official Aputure India Citation</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Presented directly to <strong>Mount Everest Media, Delhi</strong> by the authority of Aputure India for exceptional equipment hygiene, optical upkeep, and technical reliability on production sets.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Sliders className="w-4 h-4 text-brand-700" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Broadcast-Grade Color Accuracy</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Our lighting inventory maintains CRI ≥ 96 and TLCI ≥ 98 ratings, guaranteeing pure skin tones without post-production color grading nightmares or color shifts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Sidus Link Mesh Network Integration</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      All units are firmware-calibrated to integrate instantaneously into multi-fixture Bluetooth mesh setups, enabling lightning-fast wireless gaffing on set.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/catalog?category=lights"
                  className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider group"
                >
                  <span>Explore Our Aputure & Cinema Lighting Fleet</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-center">
              <div className="relative group max-w-md w-full">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition duration-500" />

                <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-4 border-white shadow-2xl">
                  <img
                    src="/images/founder/unnamed.webp"
                    alt="Aputure Top Rated Lighting Rental Award Presented to Mount Everest Media Delhi"
                    className="w-full h-auto object-cover transition duration-700 group-hover:scale-102"
                    loading="lazy"
                  />
                  <div className="p-4 bg-slate-950 text-white text-center space-y-1">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      Authority of Aputure India
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      Lakshman Kumar receiving the Top Rated Lighting Rental Award at Mount Everest Media Hub
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Why Delhi Filmmakers Choose Us
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The Four Tenets of CameraRent Rigor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Every camera kit, lens set, and light is handled with the exact precision expected on an international feature set.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all space-y-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                {pillar.icon}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{pillar.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden border border-slate-800">
          <div className="relative z-10 space-y-8">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Ready For Immediate Dispatch
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Our Comprehensive Production Fleet
                </h2>
              </div>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-300 hover:text-white uppercase tracking-wider transition"
              >
                <span>Browse All 1,200+ Units</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {gearCategories.map((cat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-brand-400/40 transition">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">{cat.title}</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {cat.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <Link
                      to={cat.link}
                      className="text-[11px] font-bold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1 group"
                    >
                      <span>View Category</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            A Decade of Film Evolution
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            From Gautam Nagar Hub to All-India Digital Logistics
          </h2>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 md:before:left-1/2 before:w-0.5 before:bg-slate-200">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
            >
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-600 border-4 border-white shadow-md flex items-center justify-center text-white text-[10px] font-black z-10">
                {idx + 1}
              </div>

              <div className="ml-12 md:ml-0 md:w-[45%] bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5">
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">{m.year}</span>
                <h4 className="text-sm font-extrabold text-slate-900">{m.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-br from-slate-900 via-[#1f1157] to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <MapPin className="w-4 h-4" />
              <span>Studio Pickup Hub & Office</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Visit Mount Everest Media in Gautam Nagar, New Delhi
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
              Need to test a camera rig before your shoot, verify optical character on lens projection, or pick up a rush lighting kit? Drop by our South Delhi production warehouse or contact Lakshman Kumar and the gear engineering team.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                <span className="font-extrabold text-white text-sm block">Mount Everest Media Studio Hub</span>
                <p className="text-slate-400">74, Basement, Gautam Nagar (Near Bada Gurudwara)</p>
                <p className="text-slate-400">New Delhi - 110049, India</p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                <span className="font-extrabold text-white text-sm block">Operating Hours & Support</span>
                <p className="text-slate-400">Warehouse: Mon – Sat (9:00 AM – 9:00 PM)</p>
                <p className="text-amber-300 font-semibold">24/7 On-Set Emergency Crew Hotline</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
            <Link
              to="/catalog"
              className="w-full text-center px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-brand-900 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Browse Equipment Catalog
            </Link>
            <Link
              to="/contact"
              className="w-full text-center px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs uppercase tracking-wider transition-all"
            >
              Contact Gear Specialists
            </Link>
            <Link
              to="/policies"
              className="w-full text-center px-6 py-2.5 text-xs text-slate-400 hover:text-white transition"
            >
              View KYC & Damage Protection Policies →
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
