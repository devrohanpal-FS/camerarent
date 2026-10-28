import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getCorrectCategorySlug(name: string): string {
  const n = name.toLowerCase();

  const hasWord = (word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(n);
  };

  if (
    n.includes('lens') || 
    n.includes('lenses') || 
    n.includes('nikkor') || 
    n.includes('sigma') || 
    n.includes('tamron') || 
    n.includes('extender') || 
    n.includes('teleconverter')
  ) {
    return 'lenses';
  }

  if (
    n.includes('tripod') || 
    n.includes('gimbal') || 
    n.includes('crane') || 
    n.includes('ronin') || 
    n.includes('manfrotto') || 
    n.includes('sachtler') || 
    n.includes('monopod') || 
    n.includes('slider')
  ) {
    return 'support';
  }

  if (
    hasWord('mic') || 
    hasWord('mics') || 
    n.includes('microphone') || 
    n.includes('recorder') || 
    n.includes('audio') || 
    n.includes('sennheiser') || 
    n.includes('zoom h') || 
    n.includes('rode') ||
    n.includes('transmitter') ||
    n.includes('receiver')
  ) {
    return 'audio';
  }

  if (
    n.includes('light') || 
    n.includes('led') || 
    n.includes('aputure') || 
    n.includes('amaran') || 
    n.includes('godox') || 
    n.includes('flash') || 
    n.includes('strobe') ||
    n.includes('softbox') ||
    n.includes('umbrella')
  ) {
    return 'lights';
  }

  if (
    n.includes('camera') || 
    n.includes('cameras') || 
    n.includes('dslr') || 
    n.includes('mirrorless') || 
    n.includes('body') || 
    n.includes('eos') || 
    n.includes('alpha') || 
    n.includes('a6000') || 
    n.includes('a6300') || 
    n.includes('a6400') || 
    n.includes('a6500') || 
    hasWord('a7') || 
    hasWord('a7s') || 
    hasWord('a7r') || 
    hasWord('5d') || 
    n.includes('d7200') || 
    n.includes('d850') || 
    n.includes('d500') ||
    n.includes('d750') ||
    hasWord('fx3') ||
    hasWord('fx30') ||
    n.includes('blackmagic') ||
    hasWord('red')
  ) {
    return 'cameras';
  }

  return 'accessories';
}

async function main() {
  console.log('--- Fixing GP Camera Rental Product Categories ---');

  const categories = await prisma.category.findMany();
  const categoryMapBySlug = new Map<string, string>();
  for (const cat of categories) {
    categoryMapBySlug.set(cat.slug, cat.id);
  }

  const gpVendor = await prisma.vendor.findUnique({
    where: { email: 'info@gpcamerarental.com' }
  });

  if (!gpVendor) {
    console.error('GP Camera Rental vendor not found. Run scrape-gp-products.ts first.');
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    where: { vendorId: gpVendor.id },
    include: { category: true }
  });

  console.log(`Found ${products.length} products to re-classify.`);

  let updatedCount = 0;

  for (const p of products) {
    const targetSlug = getCorrectCategorySlug(p.name);
    const targetCategoryId = categoryMapBySlug.get(targetSlug);

    if (!targetCategoryId) {
      console.warn(`Category slug '${targetSlug}' not found in database for product: ${p.name}`);
      continue;
    }

    if (p.categoryId !== targetCategoryId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: targetCategoryId }
      });
      console.log(`Updated category for [${p.name}]: ${p.category.slug} -> ${targetSlug}`);
      updatedCount++;
    }
  }

  console.log(`Finished fixing categories. Updated ${updatedCount} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
