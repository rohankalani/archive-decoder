import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Database, 
  Globe, 
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';

interface PerformanceMetricsProps {
  lastFetch?: Date | null;
  totalDevices?: number;
  queryTime?: number;
  cacheHit?: boolean;
}

export const PerformanceMetrics = memo(({ 
  lastFetch, 
  totalDevices = 0, 
  queryTime = 0,
  cacheHit = false 
}: PerformanceMetricsProps) => {
  const formatLastFetch = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / 1000 / 60),
      'minute'
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Devices:</span>
            <span className="font-medium">{totalDevices}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Query:</span>
            <span className="font-medium">{queryTime}ms</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Last fetch:</span>
            <span className="font-medium">{formatLastFetch(lastFetch)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Cache:</span>
            <Badge variant={cacheHit ? "default" : "secondary"} className="text-xs">
              {cacheHit ? "Hit" : "Miss"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <CheckCircle className="h-3 w-3 text-success" />
          <span className="text-xs text-success font-medium">Optimized Query Active</span>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';