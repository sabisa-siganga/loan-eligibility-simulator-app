import { Car, CircleDollarSign, Wallet, type LucideIcon } from 'lucide-react';

/**
 * Known loan product identifiers mapped to Lucide icons for product cards and lists.
 */
const PRODUCT_ICONS: Record<string, LucideIcon> = {
  personal_loan: Wallet,
  vehicle_loan: Car,
};

/**
 * Resolve a Lucide icon for a product identifier.
 *
 * Prefer the known map; fall back to CircleDollarSign for unknown products
 * so the user interface always has a sensible default icon.
 */
export const getProductIcon = (productId: string): LucideIcon =>
  PRODUCT_ICONS[productId] ?? CircleDollarSign;
