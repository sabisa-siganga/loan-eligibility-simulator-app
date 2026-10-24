import {
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

/**
 * Known loan purpose identifiers mapped to short user-facing labels.
 */
const PURPOSE_LABELS: Record<string, string> = {
  debt_consolidation: 'Debt consolidation',
  home_improvement: 'Home improvement',
  education: 'Education',
  medical: 'Medical',
  other: 'Other',
  new_vehicle: 'New vehicle',
  used_vehicle: 'Used vehicle',
};

/**
 * Known loan purpose identifiers mapped to Lucide icons for purpose cards.
 */
const PURPOSE_ICONS: Record<string, LucideIcon> = {
  debt_consolidation: RefreshCw,
  home_improvement: Home,
  education: GraduationCap,
  medical: HeartPulse,
  other: MoreHorizontal,
  new_vehicle: Car,
  used_vehicle: Car,
};

/**
 * Build a readable label for an unknown purpose identifier.
 *
 * Split on underscores, capitalise each word, and join with spaces.
 */
const humanizePurposeId = (purposeId: string): string =>
  purposeId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/**
 * Resolve a loan purpose identifier to a display label.
 *
 * Prefer the known map; otherwise humanise the raw identifier so unexpected
 * endpoint values still render clearly.
 */
export const getPurposeLabel = (purposeId: string): string =>
  PURPOSE_LABELS[purposeId] ?? humanizePurposeId(purposeId);

/**
 * Resolve a Lucide icon for a loan purpose identifier.
 *
 * Prefer the known map; fall back to MoreHorizontal for unknown purposes.
 */
export const getPurposeIcon = (purposeId: string): LucideIcon =>
  PURPOSE_ICONS[purposeId] ?? MoreHorizontal;
