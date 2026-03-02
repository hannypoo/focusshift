import { getCategoryColors } from '../lib/utils';

interface CategoryPillProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

export default function CategoryPill({ name, color, size = 'sm' }: CategoryPillProps) {
  const colors = getCategoryColors(color);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors.bgLight} ${colors.text} ${sizeClasses}`}>
      {name}
    </span>
  );
}
