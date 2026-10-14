import {
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

const PURPOSE_LABELS: Record<string, string> = {
  debt_consolidation: 'Debt consolidation',
  home_improvement: 'Home improvement',
  education: 'Education',
  medical: 'Medical',
  other: 'Other',
  new_vehicle: 'New vehicle',
  used_vehicle: 'Used vehicle',
};

const PURPOSE_ICONS: Record<string, LucideIcon> = {
  debt_consolidation: RefreshCw,
  home_improvement: Home,
  education: GraduationCap,
  medical: HeartPulse,
  other: MoreHorizontal,
  new_vehicle: Car,
  used_vehicle: Car,
};

const humanizePurposeId = (purposeId: string): string =>
  purposeId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getPurposeLabel = (purposeId: string): string =>
  PURPOSE_LABELS[purposeId] ?? humanizePurposeId(purposeId);

export const getPurposeIcon = (purposeId: string): LucideIcon =>
  PURPOSE_ICONS[purposeId] ?? MoreHorizontal;
