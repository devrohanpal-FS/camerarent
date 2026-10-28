import { prisma } from '../db';

export async function checkProductAvailability(
  productId: string,
  startDate: Date,
  endDate: Date,
  requestedQuantity: number = 1,
  excludeOrderId?: string
): Promise<{ available: boolean; reason?: string }> {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  if (start > end) {
    return { available: false, reason: 'Rental start date must be before the end date.' };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { totalStock: true, name: true },
  });

  if (!product) {
    return { available: false, reason: 'Product not found.' };
  }

  const totalStock = product.totalStock;

  const overlappingBlackout = await prisma.productAvailabilityBlackout.findFirst({
    where: {
      productId,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  if (overlappingBlackout) {
    return {
      available: false,
      reason: `Product is unavailable due to maintenance/blackout: ${overlappingBlackout.reason || 'Maintenance'}.`,
    };
  }

  const bookings = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: { not: 'CANCELLED' },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  const day = new Date(start);
  while (day <= end) {
    let bookedQty = 0;
    for (const booking of bookings) {
      const bStart = new Date(booking.startDate);
      bStart.setUTCHours(0, 0, 0, 0);
      const bEnd = new Date(booking.endDate);
      bEnd.setUTCHours(23, 59, 59, 999);
      if (day >= bStart && day <= bEnd) {
        bookedQty += booking.quantity;
      }
    }

    if (bookedQty + requestedQuantity > totalStock) {
      const left = totalStock - bookedQty;
      return {
        available: false,
        reason: `Only ${left >= 0 ? left : 0} items left in stock on ${day.toISOString().split('T')[0]} (Total: ${totalStock}, Rented: ${bookedQty}).`,
      };
    }

    day.setUTCDate(day.getUTCDate() + 1);
  }

  return { available: true };
}

export async function getUnavailableDates(productId: string): Promise<string[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { totalStock: true },
  });

  if (!product) return [];
  const totalStock = product.totalStock;

  const blackouts = await prisma.productAvailabilityBlackout.findMany({
    where: { productId },
  });

  const bookings = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: { not: 'CANCELLED' },
      },
    },
  });

  const candidateDates = new Set<string>();

  const addRangeToSet = (start: Date, end: Date) => {
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setUTCHours(0, 0, 0, 0);

    while (current <= last) {
      candidateDates.add(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  };

  blackouts.forEach((b) => addRangeToSet(b.startDate, b.endDate));
  bookings.forEach((b) => addRangeToSet(b.startDate, b.endDate));

  const unavailableDates = new Set<string>();

  for (const dateStr of candidateDates) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    
    const isBlackout = blackouts.some((b) => {
      const bStart = new Date(b.startDate);
      bStart.setUTCHours(0, 0, 0, 0);
      const bEnd = new Date(b.endDate);
      bEnd.setUTCHours(23, 59, 59, 999);
      return date >= bStart && date <= bEnd;
    });

    if (isBlackout) {
      unavailableDates.add(dateStr);
      continue;
    }

    let bookedQty = 0;
    for (const booking of bookings) {
      const bStart = new Date(booking.startDate);
      bStart.setUTCHours(0, 0, 0, 0);
      const bEnd = new Date(booking.endDate);
      bEnd.setUTCHours(23, 59, 59, 999);
      if (date >= bStart && date <= bEnd) {
        bookedQty += booking.quantity;
      }
    }

    if (bookedQty >= totalStock) {
      unavailableDates.add(dateStr);
    }
  }

  return Array.from(unavailableDates).sort();
}
