import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SITEMAP_PATH = '/Users/rohitpal/.gemini/antigravity-ide/brain/29d843bb-96e8-4f34-84dc-6c48a0eadd24/.system_generated/steps/53/content.md';

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8243;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .trim();
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- Starting GP Camera Rental Scraper ---');

  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`Sitemap file not found at: ${SITEMAP_PATH}`);
    process.exit(1);
  }

  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');

  const urlBlocks = sitemapContent.match(/<url>[\s\S]+?<\/url>/g) || [];
  console.log(`Found ${urlBlocks.length} product entries in sitemap.`);

  const hashedPassword = bcrypt.hashSync('password123', 10);
  let gpUser = await prisma.user.findUnique({
    where: { email: 'gp@camerarent.com' }
  });

  if (!gpUser) {
    gpUser = await prisma.user.create({
      data: {
        email: 'gp@camerarent.com',
        password: hashedPassword,
        name: 'GP Camera Rental Owner',
        role: 'VENDOR',
        kycStatus: 'APPROVED',
      }
    });
    console.log('Created GP Camera Rental User');
  }

  let gpVendor = await prisma.vendor.findUnique({
    where: { email: 'info@gpcamerarental.com' }
  });

  if (!gpVendor) {
    gpVendor = await prisma.vendor.create({
      data: {
        name: 'GP Camera Rental',
        email: 'info@gpcamerarental.com',
        phone: '+918826265915',
        commissionRate: 15.0,
        isActive: true,
        userId: gpUser.id,
      }
    });
    console.log('Created GP Camera Rental Vendor profile');
  }

  const categories = await prisma.category.findMany();
  const categoryMapBySlug = new Map<string, string>();
  for (const cat of categories) {
    categoryMapBySlug.set(cat.slug, cat.id);
  }
  console.log('Loaded Categories:', Array.from(categoryMapBySlug.keys()));

  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < urlBlocks.length; i++) {
    const block = urlBlocks[i];

    const locMatch = block.match(/<loc><!\[CDATA\[(https:\/\/gpcamerarental\.com\/product\/[^\]]+)\]\]><\/loc>/) ||
                     block.match(/<loc>(https:\/\/gpcamerarental\.com\/product\/[^<]+)<\/loc>/);
    if (!locMatch) {
      skippedCount++;
      continue;
    }

    const productUrl = locMatch[1];
    const slugMatch = productUrl.match(/\/product\/([^/]+)\/?$/);
    if (!slugMatch) {
      skippedCount++;
      continue;
    }
    const slug = slugMatch[1];

    const existing = await prisma.product.findFirst({
      where: { slug }
    });
    if (existing) {
      console.log(`[${i + 1}/${urlBlocks.length}] Product already exists (slug: ${slug}). Skipping.`);
      successCount++;
      continue;
    }

    const imageMatches = block.match(/<image:loc><!\[CDATA\[(https:\/\/gpcamerarental\.com\/wp-content\/uploads\/[^\]]+)\]\]><\/image:loc>/g) ||
                         block.match(/<image:loc>(https:\/\/gpcamerarental\.com\/wp-content\/uploads\/[^<]+)<\/image:loc>/g) || [];
    
    const imageUrls = imageMatches.map(m => {
      const match = m.match(/https:\/\/gpcamerarental\.com\/wp-content\/uploads\/[^\]<]+/);
      return match ? match[0] : '';
    }).filter(url => url !== '');

    console.log(`[${i + 1}/${urlBlocks.length}] Scraping: ${productUrl}`);

    try {
      const response = await fetch(productUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch page: ${productUrl}. Status: ${response.status}`);
        continue;
      }

      const html = await response.text();

      let parsedName = '';
      let parsedCategories: string[] = [];

      const ga4wMatch = html.match(/"product":\s*({[\s\S]+?}),\s*"products"/);
      if (ga4wMatch) {
        try {
          const productObj = JSON.parse(ga4wMatch[1]);
          parsedName = productObj.name;
          if (productObj.categories) {
            parsedCategories = productObj.categories.map((c: any) => c.name);
          }
        } catch (e) {
        }
      }

      if (!parsedName) {
        const titleMatch = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]+?)<\/h1>/i);
        parsedName = titleMatch ? cleanHtml(titleMatch[1]) : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      if (parsedCategories.length === 0) {
        const breadcrumbMatch = html.match(/<nav class="woocommerce-breadcrumb"[\s\S]+?<\/nav>/i);
        if (breadcrumbMatch) {
          const catMatches = breadcrumbMatch[0].match(/<a href="[^"]+product-category\/[^"]+">([^<]+)<\/a>/g) || [];
          parsedCategories = catMatches.map(m => {
            const match = m.match(/>([^<]+)</);
            return match ? match[1] : '';
          }).filter(c => c !== '');
        }
      }

      let description = '';
      const descBlockMatch = html.match(/<div[^>]*class="[^"]*woocommerce-Tabs-panel--description[^"]*"[^>]*>([\s\S]+?)<\/div>/i);
      if (descBlockMatch) {
        description = cleanHtml(descBlockMatch[1]);
      } else {
        const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/i);
        description = metaDescMatch ? cleanHtml(metaDescMatch[1]) : `Premium rental equipment: ${parsedName}`;
      }

      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }

      const specRows = html.match(/<tr class="pair_3u9fnESIQrtuEu6ye_zM4k"[^>]*>([\s\S]+?)<\/tr>/gi) || [];
      const specsObj: Record<string, string> = {};
      for (const row of specRows) {
        const labelMatch = row.match(/<td class="label_3bLwbW8ibvYc5tUwpKVQsL[^"]*"[^>]*>([\s\S]+?)<\/td>/i);
        const valueMatch = row.match(/<td class="value_11Av1yGkVYn9TX48mQeu9v[^"]*"[^>]*>([\s\S]+?)<\/td>/i);
        if (labelMatch && valueMatch) {
          const label = cleanHtml(labelMatch[1]);
          const value = cleanHtml(valueMatch[1]);
          if (label && value) {
            specsObj[label] = value;
          }
        }
      }

      if (Object.keys(specsObj).length === 0) {
        specsObj['Model'] = parsedName;
        specsObj['Condition'] = 'Excellent / Premium';
      }

      const targetCategorySlug = mapCategorySlug(parsedCategories);
      const categoryId = categoryMapBySlug.get(targetCategorySlug) || categoryMapBySlug.get('accessories')!;

      const { dailyRate, weeklyRate, depositAmount } = calculateRates(parsedName, targetCategorySlug);

      await prisma.product.create({
        data: {
          name: parsedName,
          slug,
          description,
          specs: JSON.stringify(specsObj),
          dailyRate,
          weeklyRate,
          depositAmount,
          images: imageUrls.length > 0 ? imageUrls.join(',') : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
          vendorId: gpVendor.id,
          categoryId,
          subcategory: parsedCategories[0] || null,
          totalStock: 2,
        }
      });

      console.log(`Saved Product: ${parsedName} (Category: ${targetCategorySlug}, Rates: Rs. ${dailyRate}/day)`);
      successCount++;

      await delay(150);

    } catch (err: any) {
      console.error(`Error scraping ${productUrl}:`, err.message || err);
    }
  }

  console.log(`\nGP Camera Rental Scraper complete. Ingested: ${successCount}, Skipped: ${skippedCount}`);
}

function mapCategorySlug(wpCategories: string[]): string {
  const normalized = wpCategories.map(c => c.toLowerCase());
  
  if (normalized.includes('cameras') || normalized.includes('camera') || normalized.includes('slr') || normalized.includes('dslr') || normalized.includes('mirrorless') || normalized.includes('sony') || normalized.includes('canon') || normalized.includes('nikon')) {
    if (normalized.some(c => c.includes('lens') || c.includes('lenses'))) {
      return 'lenses';
    }
    if (normalized.includes('cameras') || normalized.includes('camera')) {
      return 'cameras';
    }
  }
  
  if (normalized.some(c => c.includes('lens') || c.includes('lenses') || c.includes('slr lenses'))) {
    return 'lenses';
  }
  if (normalized.includes('lights') || normalized.includes('led light') || normalized.includes('aputure') || normalized.includes('light')) {
    return 'lights';
  }
  if (normalized.includes('mic') || normalized.includes('zoom') || normalized.includes('audio') || normalized.includes('transmitter') || normalized.includes('sennheiser')) {
    return 'audio';
  }
  if (normalized.includes('tripods-and-gimbals') || normalized.includes('support') || normalized.includes('gimbal') || normalized.includes('tripod') || normalized.includes('manfrotto')) {
    return 'support';
  }
  
  return 'accessories';
}

function calculateRates(name: string, category: string): { dailyRate: number; weeklyRate: number; depositAmount: number } {
  const lowercaseName = name.toLowerCase();
  let dailyRate = 1000;

  if (category === 'cameras') {
    if (lowercaseName.includes('fx3') || lowercaseName.includes('a7s iii') || lowercaseName.includes('red') || lowercaseName.includes('arri') || lowercaseName.includes('c300') || lowercaseName.includes('a7s3')) {
      dailyRate = 3500;
    } else if (lowercaseName.includes('r5') || lowercaseName.includes('a7 iv') || lowercaseName.includes('a7r') || lowercaseName.includes('5d mark iv')) {
      dailyRate = 2500;
    } else if (lowercaseName.includes('a7 iii') || lowercaseName.includes('r6') || lowercaseName.includes('a6500') || lowercaseName.includes('a6400')) {
      dailyRate = 1500;
    } else {
      dailyRate = 1200;
    }
  } else if (category === 'lenses') {
    if (lowercaseName.includes('70-200') || lowercaseName.includes('art') || lowercaseName.includes('f/1.2') || lowercaseName.includes('f/1.4') || lowercaseName.includes('cinema') || lowercaseName.includes('24-70')) {
      dailyRate = 1200;
    } else {
      dailyRate = 800;
    }
  } else if (category === 'lights') {
    if (lowercaseName.includes('600d') || lowercaseName.includes('600x') || lowercaseName.includes('nova')) {
      dailyRate = 1800;
    } else if (lowercaseName.includes('300d') || lowercaseName.includes('300x') || lowercaseName.includes('amaran')) {
      dailyRate = 1000;
    } else {
      dailyRate = 800;
    }
  } else if (category === 'audio') {
    if (lowercaseName.includes('h6') || lowercaseName.includes('g4') || lowercaseName.includes('rode wireless')) {
      dailyRate = 800;
    } else {
      dailyRate = 500;
    }
  } else if (category === 'support') {
    if (lowercaseName.includes('ronin') || lowercaseName.includes('crane') || lowercaseName.includes('tripod carbon')) {
      dailyRate = 1000;
    } else {
      dailyRate = 600;
    }
  } else {
    if (lowercaseName.includes('gopro') || lowercaseName.includes('monitor') || lowercaseName.includes('wireless video')) {
      dailyRate = 800;
    } else {
      dailyRate = 400;
    }
  }

  return {
    dailyRate,
    weeklyRate: dailyRate * 6,
    depositAmount: dailyRate * 5,
  };
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
