import {
  Hotel, Utensils, Truck, Stethoscope, Store, Compass, Users, Briefcase, Landmark, Coffee, Fuel,
  LayoutGrid, Church, ShoppingBasket, Award, Medal, Share2, GraduationCap, Tag, Building2, MapPin,
  type LucideIcon,
} from "lucide-react";

/** Các icon được phép chọn cho lĩnh vực (tên lucide-react) */
export const SECTOR_ICONS: Record<string, LucideIcon> = {
  Hotel, Utensils, Truck, Stethoscope, Store, Compass, Users, Briefcase, Landmark, Coffee, Fuel,
  LayoutGrid, Church, ShoppingBasket, Award, Medal, Share2, GraduationCap, Tag, Building2, MapPin,
};

export function SectorIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = SECTOR_ICONS[name] ?? MapPin;
  return <Icon className={className} style={style} />;
}
