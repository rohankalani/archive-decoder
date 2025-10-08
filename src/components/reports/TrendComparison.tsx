import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendComparisonProps {
  currentValue: number;
  previousValue: number;
  title: string;
  unit?: string;
  description?: string;
  reverseColors?: boolean; // For metrics where lower is better
}

export function TrendComparison({
  currentValue,
  previousValue,
  title,
  unit = '',
  description,
  reverseColors = false
}: TrendComparisonProps) {
  const difference = currentValue - previousValue;
  const percentChange = previousValue !== 0 ? ((difference / previousValue) * 100) : 0;
  
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;
  const isNeutral = difference === 0;

  // Determine if change is positive (good) or negative (bad)
  const isGoodChange = reverseColors ? isDecrease : isIncrease;
  const isBadChange = reverseColors ? isIncrease : isDecrease;

  const trendColor = isNeutral ? 'text-muted-foreground' :
                     isGoodChange ? 'text-green-500' :
                     isBadChange ? 'text-red-500' : 'text-muted-foreground';

  const bgColor = isNeutral ? 'bg-muted/10' :
                  isGoodChange ? 'bg-green-500/10' :
                  isBadChange ? 'bg-red-500/10' : 'bg-muted/10';

  const TrendIcon = isNeutral ? Minus : isIncrease ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {currentValue}{unit}
          </div>
          <div className={`flex items-center gap-2 text-sm ${trendColor}`}>
            <div className={`p-1 rounded ${bgColor}`}>
              <TrendIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {isNeutral ? 'No change' : `${Math.abs(percentChange).toFixed(1)}%`}
            </span>
            <span className="text-muted-foreground">
              vs previous period
            </span>
          </div>
          {!isNeutral && (
            <div className="text-xs text-muted-foreground">
              {isIncrease ? '+' : ''}{difference.toFixed(1)}{unit} from {previousValue}{unit}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
