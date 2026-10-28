import json
import os

manifest_path = "frontend/public/images/products/manifest.json"
with open(manifest_path, "r") as f:
    products = json.load(f)

products = [p for p in products if p.get("slug") != "apple-imac-5k-retina" and "iMac" not in p.get("name", "")]

def get_product_details(p):
    name = p["name"]
    slug = p["slug"]
    cat = p["category"]
    qty = p.get("qty", 1)
    img = p.get("image", f"/images/products/{slug}.jpg")

    cat_name = "Cameras"
    subcat = "General"
    daily = 2000.0
    deposit = 10000.0
    specs = {}
    desc = f"Professional {name} available for daily and weekly rental. Inspected and calibrated for production."

    if cat == "cameras":
        cat_name = "Cameras"
        if "FX9" in name or "FS7" in name or "F5" in name or "PXW" in name or "PMW" in name or "FX6" in name or "KOMODO" in name or "Blackmagic" in name:
            subcat = "Cinema Camera"
            daily = 4500.0 if "FX6" in name or "FX3" in name else (6500.0 if "KOMODO" in name or "FX9" in name else 3500.0)
            deposit = daily * 5
            specs = {"type": "Cinema Camera", "sensor": "Full Frame / Super 35", "resolution": "4K / 6K Raw", "mount": "Sony E / Canon RF / PL"}
            desc = f"High-end cinema camera {name} equipped for feature films, commercials, and broadcast productions."
        elif "A7" in name or "R5" in name or "FX3" in name or "FX30" in name:
            subcat = "Mirrorless Camera"
            daily = 2500.0 if "A7S" in name or "R5" in name or "FX3" in name else 1800.0
            deposit = daily * 4
            specs = {"type": "Mirrorless Camera", "sensor": "Full Frame 4K/8K", "stabilization": "In-Body 5-Axis", "video": "4K 120p 10-bit"}
            desc = f"Ultra-compact hybrid camera {name} delivering superb low-light performance and high dynamic range."
        elif "5D" in name or "60D" in name:
            subcat = "DSLR Camera"
            daily = 1200.0 if "5D" in name else 700.0
            deposit = daily * 3
            specs = {"type": "DSLR Camera", "sensor": "Full Frame / APS-C", "mount": "Canon EF", "video": "Full HD / 4K"}
            desc = f"Workhorse DSLR {name} renowned for reliable stills and video capture."
        elif "GoPro" in name or "Insta360" in name:
            subcat = "Action & 360"
            daily = 800.0 if "13" in name or "12" in name or "MAX" in name else 600.0
            deposit = 3000.0
            specs = {"type": "Action Camera", "waterproof": "Up to 10m/33ft", "resolution": "5.3K 60fps / 4K 120fps", "stabilization": "HyperSmooth"}
            desc = f"Rugged compact action camera {name} perfect for POV, extreme sports, and high-framerate action shots."
        elif "Mavic" in name or "Drone" in name or "Helicam" in name:
            subcat = "Drones"
            daily = 4500.0 if "3" in name else 3000.0
            deposit = 15000.0
            specs = {"type": "Cinema Drone", "camera": "Hasselblad 4/3 CMOS", "flightTime": "Up to 43 mins", "transmission": "15km O3+"}
            desc = f"Professional aerial cinematography drone {name} with multi-focal camera system."

    elif cat == "lenses":
        cat_name = "Lenses"
        if "CP.2" in name or "CP.3" in name or "Cine" in name:
            subcat = "Cinema Primes"
            daily = 5000.0 if "Set" in name else 1500.0
            deposit = daily * 4
            specs = {"type": "Cine Prime", "coverage": "Full Frame", "gearing": "Standard 0.8 MOD", "mount": "PL / EF / E"}
            desc = f"Precision cine prime optics {name} featuring consistent color matching, smooth iris, and minimal breathing."
        elif "Sony" in name and "GM" in name:
            subcat = "Sony G Master"
            daily = 1500.0 if "70-200" in name or "100-400" in name or "400mm" in name or "24-70" in name else 1200.0
            if "400mm" in name: daily = 6000.0; deposit = 25000.0
            else: deposit = daily * 4
            specs = {"type": "G Master Prime/Zoom", "mount": "Sony E-Mount", "aperture": "f/1.4 - f/2.8", "optics": "XA Extreme Aspherical"}
            desc = f"Flagship Sony G Master optics {name} delivering unmatched sharpness, creamy bokeh, and fast autofocus."
        elif "Canon" in name and "RF" in name:
            subcat = "Canon RF Lenses"
            daily = 1600.0
            deposit = 6000.0
            specs = {"type": "RF Series Lens", "mount": "Canon RF", "stabilization": "Optical IS", "coating": "Air Sphere Coating"}
            desc = f"Next-generation Canon RF series lens {name} engineered for high resolution EOS R bodies."
        elif "Canon" in name:
            subcat = "Canon EF Lenses"
            daily = 1200.0
            deposit = 4500.0
            specs = {"type": "EF L Series", "mount": "Canon EF", "aperture": "f/1.2 - f/2.8", "focus": "USM Ultrasonic"}
            desc = f"Industry-standard Canon EF L-series lens {name} with exceptional optical clarity."
        elif "Probe" in name or "Macro" in name or "Tokina" in name or "Samyang" in name:
            subcat = "Specialty & Macro"
            daily = 2500.0 if "Probe" in name else 1000.0
            deposit = daily * 3
            specs = {"type": "Specialty Lens", "magnification": "2:1 Macro / Ultra Wide", "lighting": "Built-in LED (Probe)"}
            desc = f"Specialized optical tool {name} designed for unique perspectives, extreme closeups, and creative compositions."
        elif "Batis" in name:
            subcat = "Zeiss Batis"
            daily = 3500.0 if "Set" in name else 1000.0
            deposit = 12000.0
            specs = {"type": "Autofocus Prime", "mount": "Sony E-mount", "display": "OLED Distance Display"}
            desc = f"Zeiss Batis high-speed prime set with legendary T* anti-reflective coating."

    elif cat == "monitors":
        cat_name = "Monitors"
        subcat = "Production & Field Monitors"
        daily = 3500.0 if "19" in name or "21" in name else 1500.0
        deposit = daily * 4
        specs = {"brightness": "1000 - 3000 nits HDR", "inputs": "12G-SDI & HDMI 2.0", "recording": "ProRes RAW / 4K HDR"}
        desc = f"High-brightness calibrated monitor/recorder {name} for critical on-set focus and color exposure."

    elif cat == "tripods":
        cat_name = "Tripods"
        subcat = "Fluid Head Tripods"
        daily = 1500.0 if "Sachtler" in name or "100" in name else 1000.0
        deposit = daily * 3
        specs = {"bowl": "75mm / 100mm / 150mm", "payload": "Up to 25kg", "material": "Carbon Fiber / Heavy Steel"}
        desc = f"Rugged fluid head video tripod {name} for ultra-smooth pans, tilts, and reliable payload stability."

    elif cat == "gimbals":
        cat_name = "Support"
        subcat = "Gimbals & Stabilizers"
        daily = 3500.0 if "Ronin 2" in name or "EasyRig" in name or "Ready Rig" in name else 1800.0
        deposit = daily * 4
        specs = {"payload": "Up to 13.6kg / 4.5kg", "axes": "3-Axis Motorized Stabilization", "battery": "Extended runtime"}
        desc = f"Professional camera stabilization system {name} for smooth motion shots and reduced operator fatigue."

    elif cat == "sound":
        cat_name = "Audio"
        subcat = "Wireless & Field Audio"
        daily = 1800.0 if "664" in name or "552" in name else (1200.0 if "416" in name or "DJI" in name or "G4" in name else 800.0)
        deposit = daily * 3
        specs = {"connectivity": "UHF Wireless / XLR Balanced", "channels": "Multi-Channel Recording", "frequency": "True Diversity"}
        desc = f"Broadcast-quality audio capture gear {name} ensuring crystal-clear dialog on film sets and events."

    elif cat == "lights":
        cat_name = "Lights"
        subcat = "Continuous & RGB LED"
        daily = 4500.0 if "1200" in name else (3000.0 if "600" in name or "720" in name else 1500.0)
        deposit = daily * 3
        specs = {"output": "Daylight / Bi-Color / Full RGBWW", "cri": "96+ TLCI 98+", "control": "Sidus Link / DMX / App"}
        desc = f"High-output cinematic lighting fixture {name} providing pure color fidelity and versatile beam control."

    elif cat == "stands":
        cat_name = "Tripods"
        subcat = "Stands & Grip"
        daily = 500.0 if "C-Stand" in name or "Flag" in name else 800.0
        deposit = 2000.0
        specs = {"material": "Chrome Steel", "height": "Up to 40 inches / 12 feet", "grip": "Grip Head & Arm Included"}
        desc = f"Heavy-duty grip support {name} engineered to securely rig lights, modifiers, and flags on set."

    elif cat == "filters" or cat == "accessories" or cat == "editing":
        cat_name = "Accessories"
        subcat = "Power & Accessories" if cat == "accessories" else ("Optical Filters" if cat == "filters" else "Workstations")
        daily = 1200.0 if "iMac" in name or "Follow Focus" in name or "Transmitter" in name else 500.0
        deposit = daily * 3
        specs = {"compatibility": "Universal Cine / Production standard", "quality": "High-durability cinema grade"}
        desc = f"Essential production accessory {name} for seamless operation on set."

    weekly = daily * 6

    return {
        "name": name,
        "slug": slug,
        "description": desc,
        "specs": json.dumps(specs),
        "dailyRate": float(daily),
        "weeklyRate": float(weekly),
        "depositAmount": float(deposit),
        "images": img,
        "categoryName": cat_name,
        "subcategory": subcat,
        "totalStock": int(qty)
    }

parsed_products = [get_product_details(p) for p in products]

print(f"Generated seed data for {len(parsed_products)} products.")

ts_content = f'''import {{ PrismaClient }} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {{
  console.log('Start seeding complete catalog ({len(parsed_products)} products)...');

  // Clean the database
  await prisma.cmsContent.deleteMany({{}});
  await prisma.cancellationRequest.deleteMany({{}});
  await prisma.orderItem.deleteMany({{}});
  await prisma.order.deleteMany({{}});
  await prisma.cartItem.deleteMany({{}});
  await prisma.productAvailabilityBlackout.deleteMany({{}});
  await prisma.product.deleteMany({{}});
  await prisma.category.deleteMany({{}});
  await prisma.vendor.deleteMany({{}});
  await prisma.user.deleteMany({{}});

  console.log('Database cleaned.');

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // Create Users
  const adminUser = await prisma.user.create({{
    data: {{
      email: 'admin@camerarent.com',
      password: hashedPassword,
      name: 'Super Admin',
      phone: '+919876543210',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
    }},
  }});

  const customerUser = await prisma.user.create({{
    data: {{
      email: 'customer@gmail.com',
      password: hashedPassword,
      name: 'Rahul Sharma',
      phone: '+919812345678',
      role: 'CUSTOMER',
      kycStatus: 'APPROVED',
      kycDocUrl: 'https://placehold.co/600x400/png?text=Rahul+Sharma+ID',
    }},
  }});

  const vendorUser1 = await prisma.user.create({{
    data: {{
      email: 'apex@camerarent.com',
      password: hashedPassword,
      name: 'Apex Cinema Rentals',
      phone: '+919800112233',
      role: 'VENDOR',
      kycStatus: 'APPROVED',
    }},
  }});

  const vendorUser2 = await prisma.user.create({{
    data: {{
      email: 'studio@camerarent.com',
      password: hashedPassword,
      name: 'CameraRent Pro Studio',
      phone: '+919822334455',
      role: 'VENDOR',
      kycStatus: 'APPROVED',
    }},
  }});

  console.log('Users created.');

  // Create Vendors
  const vendor1 = await prisma.vendor.create({{
    data: {{
      name: 'CameraRent Verified Hub',
      email: 'info@camerarent.com',
      phone: '+919800112233',
      commissionRate: 15.0,
      isActive: true,
      userId: vendorUser1.id,
    }},
  }});

  const vendor2 = await prisma.vendor.create({{
    data: {{
      name: 'CameraRent Pro Studio',
      email: 'contact@camerarent.com',
      phone: '+919822334455',
      commissionRate: 12.0,
      isActive: true,
      userId: vendorUser2.id,
    }},
  }});

  console.log('Vendors created.');

  // Create Categories
  const categoriesData = [
    {{ name: 'Cameras', slug: 'cameras', description: 'Cinema, Mirrorless, DSLR and Action Cameras' }},
    {{ name: 'Lenses', slug: 'lenses', description: 'Sony GM, Canon RF/EF, Zeiss Cine Primes, and Zoom Lenses' }},
    {{ name: 'Lights', slug: 'lights', description: 'Aputure, Nanlite, Godox LED Spotlights and Tube Lights' }},
    {{ name: 'Audio', slug: 'audio', description: 'Sennheiser Wireless Lapels, Boom Mics, Mixers, and Recorders' }},
    {{ name: 'Monitors', slug: 'monitors', description: 'Atomos Sumo, Shogun, Ninja, and Studio HDR Production Monitors' }},
    {{ name: 'Support', slug: 'support', description: 'DJI RS4/RS3 Pro Gimbals, EasyRig, Dana Dolly, and Sliders' }},
    {{ name: 'Tripods', slug: 'tripods', description: 'Sachtler, Manfrotto Video Fluid Heads, C-Stands and Grip' }},
    {{ name: 'Accessories', slug: 'accessories', description: 'V-Mount Batteries, Sony TOUGH Cards, Cine Filters and Transmitters' }},
  ];

  const categoriesMap: {{ [key: string]: string }} = {{}};
  for (const cat of categoriesData) {{
    const createdCat = await prisma.category.create({{ data: cat }});
    categoriesMap[cat.name] = createdCat.id;
  }}

  console.log('Categories created.');

  // Create Products
  const rawProducts = {json.dumps(parsed_products, indent=2)};

  for (let i = 0; i < rawProducts.length; i++) {{
    const p = rawProducts[i];
    const catId = categoriesMap[p.categoryName] || categoriesMap['Cameras'];
    const chosenVendor = (i % 2 === 0) ? vendor1.id : vendor2.id;

    await prisma.product.create({{
      data: {{
        name: p.name,
        slug: p.slug,
        description: p.description,
        specs: p.specs,
        dailyRate: p.dailyRate,
        weeklyRate: p.weeklyRate,
        depositAmount: p.depositAmount,
        images: p.images,
        vendorId: chosenVendor,
        categoryId: catId,
        subcategory: p.subcategory,
        totalStock: p.totalStock,
      }}
    }});
  }}

  console.log(`Created ${{rawProducts.length}} products in database.`);

  // Create CMS Default Contents
  const cmsData = [
    {{
      key: 'header_nav',
      value: JSON.stringify([
        {{ label: 'Home', path: '/' }},
        {{ label: 'Explore Catalog', path: '/catalog' }},
        {{ label: 'About Us', path: '/about' }},
        {{ label: 'Policies', path: '/policies' }},
        {{ label: 'FAQs', path: '/faq' }},
        {{ label: 'Contact', path: '/contact' }}
      ])
    }},
    {{
      key: 'footer_content',
      value: JSON.stringify({{
        description: 'CameraRent is India\\'s premium multivendor online marketplace where production crews can rent verified cinema cameras, lenses, lights, and grip support directly from vetted rental houses.',
        copyright: '© 2026 CameraRent Inc. All rights reserved.',
        links: [
          {{ label: 'Privacy Policy', path: '/policies' }},
          {{ label: 'Terms of Use', path: '/policies' }}
        ]
      }})
    }},
    {{
      key: 'home_hero',
      value: JSON.stringify({{
        sparkText: "India's #1 Cine Equipment Rental Platform",
        titleLine1: 'Rent Production Gear',
        titleLine2: 'From Top Local Vendors',
        description: 'Instant booking for Sony Cinema FX, RED Komodo, Aputure Lights, Zeiss Primes, and Grip Kits with zero security deposit hassle.'
      }})
    }},
    {{
      key: 'home_cta',
      value: JSON.stringify({{
        badge: 'First Booking Offer',
        title: 'Claim 10% Off Your First Gear Booking',
        description: 'Rent cinema gear today. Verified inventory, pre-checked equipment, instant WhatsApp confirmation.',
        buttonText: 'Explore Complete Catalog',
        link: '/catalog'
      }})
    }},
    {{
      key: 'about_page',
      value: JSON.stringify({{
        title: 'About CameraRent',
        subtitle: 'Connecting filmmakers and creators with professional equipment rental houses.',
        description: 'CameraRent simplifies camera rental logistics across India. We enable cinematographers, production houses, and indie creators to instantly reserve high-end gear from local certified hubs.',
        content: 'We offer a secure, zero-hassle rental experience with pre-inspected inventory checklists, comprehensive damage protections, and transparent communication protocols.',
        bannerUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'
      }})
    }},
    {{
      key: 'services',
      value: JSON.stringify([
        {{ id: 's1', name: '24-Point Inspected Gear', description: 'Every camera sensor, lens glass, and microphone is cleaned, calibrated, and tested prior to dispatch.', iconName: 'ShieldCheck' }},
        {{ id: 's2', name: 'Rapid Digital Verification', description: 'Quick KYC approval enables instant booking without cumbersome physical paperwork.', iconName: 'Award' }},
        {{ id: 's3', name: 'Same-Day Production Delivery', description: 'Express delivery to your shoot location or studio with pre-packed flight cases.', iconName: 'Truck' }},
        {{ id: 's4', name: '24/7 On-Set Technical Support', description: 'Experienced camera technicians on call 24/7 for troubleshooting or instant replacements.', iconName: 'HelpCircle' }}
      ])
    }},
    {{
      key: 'testimonials',
      value: JSON.stringify([
        {{ id: 't1', name: 'Vikram Mehta', role: 'Director of Photography', comment: 'We rented 3x Sony FX3 rigs along with GM lenses for a 10-day web series shoot. The equipment was spotless and performed flawlessly.', rating: 5 }},
        {{ id: 't2', name: 'Ananya Roy', role: 'Commercial Producer', comment: 'Having real-time availability for Zeiss CP.3 and Aputure 600D on the platform saved us days of phone calls and vendor coordination.', rating: 5 }},
        {{ id: 't3', name: 'Karan Malhotra', role: 'Ad Filmmaker', comment: 'Best camera rental platform in India. Transparent rates, genuine gear, and smooth WhatsApp updates for every status change.', rating: 5 }}
      ])
    }},
    {{
      key: 'faqs',
      value: JSON.stringify([
        {{ id: 'fq1', question: 'How do I place a rental order?', answer: 'Select your camera or equipment, choose your rental start and end dates on the availability calendar, add to cart, and complete checkout. You will receive an instant WhatsApp confirmation.' }},
        {{ id: 'fq2', question: 'What documents are required for KYC?', answer: 'A valid government ID (Aadhaar / Driving License / Passport) and a business card or verified social profile for film/commercial creators.' }},
        {{ id: 'fq3', question: 'Can I extend my rental duration on set?', answer: 'Yes! You can request an extension directly through your Customer Dashboard or by contacting customer support before your scheduled return time.' }}
      ])
    }}
  ];

  for (const item of cmsData) {{
    await prisma.cmsContent.create({{ data: item }});
  }}

  console.log('CMS default contents created.');
  console.log('Seeding finished successfully.');
}}

main()
  .catch((e) => {{
    console.error(e);
    process.exit(1);
  }})
  .finally(async () => {{
    await prisma.$disconnect();
  }});
'''

with open("backend/prisma/seed.ts", "w") as f:
    f.write(ts_content)

print("Updated backend/prisma/seed.ts with full catalog.")
