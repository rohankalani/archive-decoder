import { ClassroomData } from '@/hooks/useSimplifiedReportData';

interface ClassroomHeatmapProps {
  classrooms: ClassroomData[];
}

export default function ClassroomHeatmap({ classrooms }: ClassroomHeatmapProps) {
  const getColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-500';
    if (aqi <= 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (classrooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No classroom data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {classrooms.map((classroom) => (
        <div
          key={classroom.id}
          className="relative aspect-square rounded-lg border p-3 flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-shadow"
        >
          <div className={`absolute inset-0 ${getColor(classroom.aqi)} opacity-10 rounded-lg`} />
          <div className="relative z-10 text-center">
            <p className="text-xs font-medium truncate w-full">{classroom.name}</p>
            <p className="text-xs text-muted-foreground">{classroom.roomNumber}</p>
            <p className={`text-2xl font-bold mt-2 ${getTextColor(classroom.aqi)}`}>
              {classroom.aqi}
            </p>
            <p className="text-xs text-muted-foreground">AQI</p>
          </div>
        </div>
      ))}
    </div>
  );
}
