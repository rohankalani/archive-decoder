import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClassroomHeatMapData } from '@/hooks/useGeneralReportData';
import { Layers } from 'lucide-react';

interface ClassroomHeatMapProps {
  heatMapData: ClassroomHeatMapData[];
}

export const ClassroomHeatMap = ({ heatMapData }: ClassroomHeatMapProps) => {
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-success hover:bg-success/80';
    if (aqi <= 100) return 'bg-warning hover:bg-warning/80';
    if (aqi <= 150) return 'bg-destructive hover:bg-destructive/80';
    return 'bg-destructive hover:bg-destructive/90';
  };

  const getAqiTextColor = (aqi: number) => {
    if (aqi <= 50) return 'text-success-foreground';
    if (aqi <= 100) return 'text-warning-foreground';
    return 'text-destructive-foreground';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'moderate':
        return 'Moderate';
      case 'unhealthy':
        return 'Unhealthy';
      case 'very_unhealthy':
        return 'Very Unhealthy';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Classroom Air Quality Heat Map
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visual representation of AQI across all floors and rooms
        </p>
      </CardHeader>
      <CardContent>
        {heatMapData.length > 0 ? (
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-foreground">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-success"></div>
                <span className="text-xs text-muted-foreground">Good (0-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-warning"></div>
                <span className="text-xs text-muted-foreground">Moderate (51-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-destructive"></div>
                <span className="text-xs text-muted-foreground">Unhealthy (101+)</span>
              </div>
            </div>

            {/* Heat Map Grid */}
            <div className="space-y-6">
              {heatMapData.map((floor) => (
                <div key={floor.floorId} className="space-y-3">
                  <h4 className="font-semibold text-foreground">{floor.floorName}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {floor.rooms.map((room) => (
                      <TooltipProvider key={room.roomId}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                ${getAqiColor(room.averageAqi)}
                                rounded-lg p-3 cursor-pointer transition-all
                                border border-border/50
                              `}
                            >
                              <p className={`text-xs font-medium ${getAqiTextColor(room.averageAqi)} truncate`}>
                                {room.roomName}
                              </p>
                              <p className={`text-lg font-bold ${getAqiTextColor(room.averageAqi)}`}>
                                {room.averageAqi}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">{room.roomName}</p>
                              <p className="text-sm">AQI: {room.averageAqi}</p>
                              <p className="text-sm">Status: {getStatusLabel(room.status)}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No classroom data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
