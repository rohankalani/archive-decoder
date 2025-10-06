import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface ClassroomHeatMapProps {
  data: Array<{
    roomId: string;
    roomName: string;
    floorNumber: number;
    avgAqi: number;
    alertCount: number;
    dominantPollutant: string;
  }>;
}

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return 'hsl(120, 100%, 40%)';
  if (aqi <= 100) return 'hsl(60, 100%, 50%)';
  if (aqi <= 150) return 'hsl(30, 100%, 50%)';
  if (aqi <= 200) return 'hsl(0, 100%, 50%)';
  if (aqi <= 300) return 'hsl(300, 100%, 40%)';
  return 'hsl(320, 100%, 25%)';
};

export function ClassroomHeatMap({ data }: ClassroomHeatMapProps) {
  // Group by floor
  const floorMap = new Map<number, typeof data>();
  data.forEach(room => {
    if (!floorMap.has(room.floorNumber)) {
      floorMap.set(room.floorNumber, []);
    }
    floorMap.get(room.floorNumber)!.push(room);
  });

  const floors = Array.from(floorMap.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Classroom Air Quality Heat Map</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(120, 100%, 40%)' }} />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(60, 100%, 50%)' }} />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(30, 100%, 50%)' }} />
            <span>Unhealthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 100%, 50%)' }} />
            <span>Very Unhealthy</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-x-auto">
        {floors.map(([floorNum, rooms]) => (
          <div key={floorNum} className="min-w-max">
            <h4 className="text-sm font-medium mb-2">Floor {floorNum}</h4>
            <div className="flex gap-2 flex-wrap">
              {rooms.map(room => (
                <TooltipProvider key={room.roomId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-24 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 relative"
                        style={{ backgroundColor: getAqiColor(room.avgAqi) }}
                      >
                        {room.alertCount > 0 && (
                          <div className="absolute top-1 right-1">
                            <AlertCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-2xl font-bold text-white">
                          {room.avgAqi.toFixed(0)}
                        </span>
                        <span className="text-xs text-white/80 mt-1 text-center px-1">
                          {room.roomName.split(' ').pop()}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-semibold">{room.roomName}</p>
                        <p>AQI: {room.avgAqi.toFixed(0)}</p>
                        <p>Dominant: {room.dominantPollutant}</p>
                        <p>Alerts: {room.alertCount}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
