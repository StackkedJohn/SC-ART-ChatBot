import { Badge } from '@/components/ui/badge';

interface LevelBadgeProps {
  level: number;
  levelName: string;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
}

export function LevelBadge({ level, levelName, size = 'md', showLevel = true }: LevelBadgeProps) {
  // Determine level color gradient
  const getLevelColor = (level: number) => {
    if (level >= 8) return 'from-purple-600 to-pink-600'; // Master Artist
    if (level >= 6) return 'from-orange-600 to-red-600'; // Expert
    if (level >= 4) return 'from-blue-600 to-cyan-600'; // Intermediate
    return 'from-green-600 to-emerald-600'; // Apprentice
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses[size]} font-semibold bg-gradient-to-r ${getLevelColor(
        level
      )} text-white border-none inline-flex items-center gap-1.5`}
    >
      {showLevel && <span className="font-bold">L{level}</span>}
      <span>{levelName}</span>
    </Badge>
  );
}
