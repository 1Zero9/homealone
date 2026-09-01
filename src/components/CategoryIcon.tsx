import React from 'react';
import {
  Tv,
  Music,
  Film,
  Bot,
  Sparkles,
  Code2,
  Image,
  Zap,
  Wifi,
  Droplets,
  Building2,
  ShieldCheck,
  Dumbbell,
  HeartHandshake,
  Cloud,
  Terminal,
  Search,
  Database,
  Smartphone,
  Tv2,
  Package,
  CreditCard,
  Layers,
  HelpCircle,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Tv,
  Music,
  Film,
  Bot,
  Sparkles,
  Code2,
  Image,
  Zap,
  Wifi,
  Droplets,
  Building2,
  ShieldCheck,
  Dumbbell,
  HeartHandshake,
  Cloud,
  Terminal,
  Search,
  Database,
  Smartphone,
  Tv2,
  Package,
  CreditCard,
  Layers,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  size = 20,
  color,
  ...props
}) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent size={size} color={color} className={className} {...props} />;
};
