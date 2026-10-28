import { PrismaClient } from '@prisma/client';
import { checkProductAvailability } from './services/availability.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- CameraRent Availability Engine Test Suite ---');
  
  const product = await prisma.product.findFirst();
  if (!product) {
    console.error('No products found to test. Run seeding first.');
    process.exit(1);
  }
  console.log(`Testing Product: ${product.name} (ID: ${product.id})`);

  await prisma.product.update({
    where: { id: product.id },
    data: { totalStock: 3 }
  });
  console.log(`Updated Product: ${product.name} totalStock to 3`);

  const startBooked = new Date('2026-08-01T00:00:00.000Z');
  const endBooked = new Date('2026-08-05T23:59:59.999Z');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found. Run seeding first.');
    process.exit(1);
  }

  const mockOrder = await prisma.order.create({
    data: {
      orderNumber: 'CR-TEST-9999',
      userId: user.id,
      status: 'APPROVED',
      totalRentalCost: 400.0,
      totalDeposit: 500.0,
      totalTax: 72.0,
      grandTotal: 972.0,
      deliveryAddress: 'Test Studio A',
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: mockOrder.id,
      productId: product.id,
      quantity: 2,
      startDate: startBooked,
      endDate: endBooked,
      dailyRate: 80.0,
      weeklyRate: 400.0,
      depositAmount: 500.0,
      totalCost: 800.0
    }
  });
  console.log(`Mock active booking created for: Aug 1 to Aug 5, 2026 (Qty: 2, leaving 1 available)`);

  const resA = await checkProductAvailability(product.id, new Date('2026-08-02'), new Date('2026-08-04'), 1);
  assert(resA.available === true, `Case A failed: Requesting 1 unit in overlap range should be available. Reason: ${resA.reason}`);

  const resB = await checkProductAvailability(product.id, new Date('2026-08-02'), new Date('2026-08-04'), 2);
  assert(resB.available === false, 'Case B failed: Requesting 2 units in overlap range should be unavailable.');

  const resC = await checkProductAvailability(product.id, new Date('2026-07-30'), new Date('2026-08-02'), 2);
  assert(resC.available === false, 'Case C failed: Left overlap requesting 2 units should be unavailable.');

  const resD = await checkProductAvailability(product.id, new Date('2026-07-30'), new Date('2026-08-02'), 1);
  assert(resD.available === true, `Case D failed: Left overlap requesting 1 unit should be available. Reason: ${resD.reason}`);

  const resE = await checkProductAvailability(product.id, new Date('2026-07-25'), new Date('2026-07-31'), 3);
  assert(resE.available === true, `Case E failed: Before booking range requesting 3 units should be available. Reason: ${resE.reason}`);

  const resF = await checkProductAvailability(product.id, new Date('2026-08-02'), new Date('2026-08-04'), 3, mockOrder.id);
  assert(resF.available === true, `Case F failed: Overlapping range requesting 3 units should be available when current order is excluded.`);

  const blackout = await prisma.productAvailabilityBlackout.create({
    data: {
      productId: product.id,
      startDate: new Date('2026-08-06T00:00:00.000Z'),
      endDate: new Date('2026-08-07T23:59:59.999Z'),
      reason: 'Sensor cleaning',
    }
  });

  const resG = await checkProductAvailability(product.id, new Date('2026-08-06'), new Date('2026-08-07'), 1);
  assert(resG.available === false, 'Case G failed: Blackout range should be unavailable.');

  console.log('\n✔ All tests passed successfully! Pool-based availability engine behaves perfectly.');

  await prisma.productAvailabilityBlackout.deleteMany({ where: { id: blackout.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: mockOrder.id } });
  await prisma.order.deleteMany({ where: { id: mockOrder.id } });
}

function assert(condition: boolean, errMsg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${errMsg}`);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
