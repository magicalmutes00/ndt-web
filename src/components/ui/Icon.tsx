import {
  Atom,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Clock,
  Droplets,
  Eye,
  Globe,
  GraduationCap,
  HardDrive,
  Magnet,
  Microscope,
  Radiation,
  Shield,
  Target,
  Users,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ICON_NAMES, type IconName } from "../../../shared/content/schema.js";

/**
 * String -> component registry for admin-selectable icons.
 *
 * This replaces the positional arrays the sections used to keep (`courseIcons`,
 * `statIcons`, ...). Those were index-matched to their data, so reordering a
 * list or adding a seventh course silently produced the wrong icon or crashed.
 * Looking icons up by name makes the data self-describing and lets the admin
 * change an icon without a code change.
 */
export const iconRegistry: Record<IconName, LucideIcon> = {
  waves: Waves,
  radioactive: Radiation,
  droplets: Droplets,
  magnet: Magnet,
  eye: Eye,
  zap: Zap,
  award: Award,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  microscope: Microscope,
  users: Users,
  building: Building2,
  clock: Clock,
  certificate: Award,
  "hard-drive": HardDrive,
  "book-open": BookOpen,
  wrench: Wrench,
  shield: Shield,
  target: Target,
  globe: Globe,
  check: Check,
};

/** Atom is registered as a bonus choice but is not part of the schema enum. */
export const extraIcons: Record<string, LucideIcon> = { atom: Atom };

const FALLBACK: LucideIcon = Shield;

/** Never throws on an unknown name — a stale value renders a default icon. */
export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return FALLBACK;
  if (name in iconRegistry) return iconRegistry[name as IconName];
  if (name in extraIcons) return extraIcons[name];
  return FALLBACK;
}

export interface IconProps {
  name: string | undefined | null;
  className?: string;
  strokeWidth?: number;
}

/** Thin wrapper so content-driven icons render exactly like hand-picked ones. */
export function Icon({ name, className, strokeWidth }: IconProps) {
  const Component = resolveIcon(name);
  return <Component className={className} strokeWidth={strokeWidth} />;
}

/** Options for the icon picker in the dashboard. */
export const iconChoices: { value: IconName; label: string }[] = ICON_NAMES.map((name) => ({
  value: name,
  label: name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
}));
