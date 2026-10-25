import { z } from 'zod';

export const MAX_RENTAL_DAYS = 30; // Maximum allowed booking duration in days

/**
 * Zod schema for validating cart quantity strictly:
 * - Must be an integer between 1 and 10
 * - Accepts pure numbers (e.g. 2) or pure digit strings (e.g. "2")
 * - Rejects: negative numbers, 0, fractions (1.5), non-digits ("abc", "2abc", "1e1", "0x10", " 2 ", ""),
 *   null, undefined, booleans (true/false), arrays, objects, NaN, Infinity.
 */
export const quantitySchema = z
  .custom<number>((val) => {
    if (val === null || val === undefined || typeof val === 'boolean' || typeof val === 'object') {
      return false;
    }
    if (typeof val === 'number') {
      return Number.isInteger(val) && Number.isFinite(val) && val >= 1 && val <= 10;
    }
    if (typeof val === 'string') {
      // Must be pure digits only (no leading/trailing whitespace, signs, hex, or exponential notation)
      if (!/^\d+$/.test(val)) return false;
      const num = Number(val);
      return Number.isInteger(num) && num >= 1 && num <= 10;
    }
    return false;
  }, { message: 'Quantity must be a valid integer between 1 and 10' })
  .transform((val) => Number(val));

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  quantity: quantitySchema,
});

export const updateCartSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  quantity: quantitySchema.optional(),
});

/**
 * Validates start and end dates according to business rules:
 * - Must be valid parseable dates
 * - Start date cannot be in the past (before today midnight)
 * - End date must be on or after start date
 * - Total rental duration must not exceed MAX_RENTAL_DAYS
 */
export function validateRentalDates(startDateInput: string | Date, endDateInput: string | Date): {
  valid: boolean;
  error?: string;
  startDate?: Date;
  endDate?: Date;
  rentalDays?: number;
} {
  const start = new Date(startDateInput);
  const end = new Date(endDateInput);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format provided' };
  }

  // Validate start is not in the past
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (start < todayMidnight) {
    return { valid: false, error: 'Rental start date cannot be in the past' };
  }

  // Validate end date is on or after start date
  if (end < start) {
    return { valid: false, error: 'Rental start date must be before or on the end date' };
  }

  // Validate maximum rental length
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  if (diffDays > MAX_RENTAL_DAYS) {
    return {
      valid: false,
      error: `Rental duration cannot exceed ${MAX_RENTAL_DAYS} days (requested: ${diffDays} days)`,
    };
  }

  return { valid: true, startDate: start, endDate: end, rentalDays: diffDays };
}
