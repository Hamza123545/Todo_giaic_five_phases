import { cn } from '@/lib/utils';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'flat';
  hover?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = false,
  onClick,
}: GlassCardProps) {
  const baseStyles = 'relative rounded-2xl backdrop-blur-xl border transition-all duration-300 p-6';

  const variantStyles = {
    default: 'glass-card',
    elevated: 'glass-card-elevated',
    flat: 'glass-card-flat',
  };

  const hoverStyles = hover
    ? 'hover:scale-[1.02] hover:shadow-2xl cursor-pointer'
    : '';

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

