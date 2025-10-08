import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PollutantData {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'good' | 'moderate' | 'unhealthy' | 'critical';
  percentage: number;
}

interface PollutantBreakdownProps {
  pollutants: PollutantData[];
}

export function PollutantBreakdown({ pollutants }: PollutantBreakdownProps) {
  const getStatusColor = (status: PollutantData['status']) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: PollutantData['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pollutant Breakdown</CardTitle>
        <CardDescription>Average levels by pollutant type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pollutants.map((pollutant) => (
            <div key={pollutant.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{pollutant.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {pollutant.value.toFixed(1)} {pollutant.unit}
                  </Badge>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(pollutant.status)} text-white border-0`}
                >
                  {getStatusText(pollutant.status)}
                </Badge>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={pollutant.percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 {pollutant.unit}</span>
                  <span>{pollutant.percentage.toFixed(0)}% of max</span>
                  <span>{pollutant.max} {pollutant.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
