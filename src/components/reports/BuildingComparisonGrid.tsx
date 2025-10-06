import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle } from 'lucide-react';

interface BuildingComparisonGridProps {
  buildings: Array<{
    buildingId: string;
    buildingName: string;
    avgAqi: number;
    aqiColor: string;
    dominantPollutant: string;
    alertCount: number;
    status: string;
    classroomCount: number;
  }>;
}

export function BuildingComparisonGrid({ buildings }: BuildingComparisonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map(building => (
        <Card 
          key={building.buildingId} 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{building.buildingName}</h3>
            </div>
            {building.alertCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {building.alertCount}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">AQI:</span>
              <span 
                className="text-3xl font-bold"
                style={{ color: building.aqiColor }}
              >
                {building.avgAqi.toFixed(0)}
              </span>
              <Badge variant="outline">{building.status}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dominant Pollutant:</span>
              <span className="font-medium">{building.dominantPollutant}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Classrooms:</span>
              <span className="font-medium">{building.classroomCount}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
