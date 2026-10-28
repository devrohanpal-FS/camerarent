export const UPI_ID =
  import.meta.env.VITE_UPI_ID || 'camerarent.pay@icici';

export const DEFAULT_UPI_ID = UPI_ID;

export const COD_MAX_AMOUNT = 50000;

export const COD_ALLOWED_CITIES = [
  'Delhi NCR',
  'New Delhi',
  'Delhi',
  'Noida',
  'Gurugram',
  'Gurgaon',
  'Faridabad',
  'Ghaziabad',
];

export const QR_EXPIRY_MINUTES = 10;

export const UPI_COUNTDOWN_SECONDS = QR_EXPIRY_MINUTES * 60;

export const UPI_PAYEE_NAME = 'CameraRent';

export interface CodEligibilityInput {
  kycStatus?: string | null;
  city: string;
  grandTotal: number;
  items: Array<{
    product?: {
      name?: string;
      codDisabled?: boolean;
      specs?: string;
    };
  }>;
}

export interface CodEligibilityResult {
  eligible: boolean;
  reason: string | null;
  reasons: string[];
}

export function checkCodEligibility({
  kycStatus,
  city,
  grandTotal,
  items,
}: CodEligibilityInput): CodEligibilityResult {
  const reasons: string[] = [];

  if (kycStatus !== 'APPROVED') {
    reasons.push(
      `KYC status must be APPROVED (current status: ${
        kycStatus === 'PENDING' ? 'Pending' : 'Not uploaded'
      }).`
    );
  }

  const normalizedCity = (city || '').trim().toLowerCase();
  const isAllowedCity = COD_ALLOWED_CITIES.some(
    (allowed) =>
      allowed.toLowerCase() === normalizedCity ||
      normalizedCity.includes('delhi') ||
      normalizedCity.includes('ncr')
  );
  if (!isAllowedCity) {
    reasons.push(
      `Cash on Delivery is only available in ${COD_ALLOWED_CITIES[0]} (selected city: ${
        city || 'Outside Delhi NCR'
      }).`
    );
  }

  if (grandTotal > COD_MAX_AMOUNT) {
    reasons.push(
      `Order total (₹${Math.round(grandTotal).toLocaleString(
        'en-IN'
      )}) exceeds the ₹${COD_MAX_AMOUNT.toLocaleString(
        'en-IN'
      )} Cash on Delivery limit.`
    );
  }

  const disabledProduct = items.find((item) => {
    if (item.product?.codDisabled) return true;
    if (item.product?.specs) {
      try {
        const parsed = JSON.parse(item.product.specs);
        if (parsed && parsed.codDisabled === true) return true;
      } catch {
      }
    }
    return false;
  });

  if (disabledProduct) {
    reasons.push(
      `${
        disabledProduct.product?.name || 'An item in your cart'
      } has Cash on Delivery disabled (codDisabled).`
    );
  }

  return {
    eligible: reasons.length === 0,
    reason: reasons.length > 0 ? reasons[0] : null,
    reasons,
  };
}
