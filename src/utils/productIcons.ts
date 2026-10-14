import { Car, CircleDollarSign, Wallet, type LucideIcon } from 'lucide-react';

const PRODUCT_ICONS: Record<string, LucideIcon> = {
  personal_loan: Wallet,
  vehicle_loan: Car,
};

export const getProductIcon = (productId: string): LucideIcon =>
  PRODUCT_ICONS[productId] ?? CircleDollarSign;
