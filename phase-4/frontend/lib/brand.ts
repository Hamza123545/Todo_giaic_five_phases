import { HardHat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const BRAND_CONFIG = {
  name: 'Todo Console',
  shortName: 'Console',
  logo: HardHat as LucideIcon,
  logoSize: 28, // w-7 h-7 in Tailwind
} as const;

