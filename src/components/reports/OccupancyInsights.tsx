import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OccupancyInsightsProps {
  occupancyInsights: {
    averageCO2: number;
    peakOccupancyHours: Array<{ hour: number; avgCO2: number; estimatedOccupancy: number }>;
    classroomUtilization: number;
    busyDays: Array<{ day: string; avgCO2: number; occupancyScore: number }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    spaceEfficiency: {
      underutilizedRooms: number;
      overCrowdedPeriods: number;
      optimalCapacityPercentage: number;
    };
  };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function OccupancyInsights({ occupancyInsights }: OccupancyInsightsProps) {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const getCO2Status = (co2Level: number) => {
    if (co2Level < 600) return { status: 'Excellent', color: 'bg-green-500' };
    if (co2Level < 1000) return { status: 'Good', color: 'bg-blue-500' };
    if (co2Level < 1500) return { status: 'Moderate', color: 'bg-yellow-500' };
    return { status: 'Poor', color: 'bg-red-500' };
  };

  const spaceEfficiencyData = [
    { name: 'Optimal', value: occupancyInsights.spaceEfficiency.optimalCapacityPercentage, color: COLORS[0] },
    { name: 'Under-utilized', value: occupancyInsights.spaceEfficiency.underutilizedRooms, color: COLORS[1] },
    { name: 'Overcrowded', value: occupancyInsights.spaceEfficiency.overCrowdedPeriods, color: COLORS[2] },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CO₂ Level</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {occupancyInsights.averageCO2.toFixed(0)} ppm
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getCO2Status(occupancyInsights.averageCO2).color}`} />
              <p className="text-xs text-muted-foreground">
                {getCO2Status(occupancyInsights.averageCO2).status} air quality
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space Utilization</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {occupancyInsights.classroomUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Classroom efficiency rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatHour(occupancyInsights.peakOccupancyHours[0]?.hour || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {occupancyInsights.peakOccupancyHours[0]?.estimatedOccupancy || 0} estimated people
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimal Capacity</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {occupancyInsights.spaceEfficiency.optimalCapacityPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Time at ideal occupancy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Peak Occupancy Hours
            </CardTitle>
            <CardDescription>
              CO₂ levels and estimated occupancy throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyInsights.peakOccupancyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour}
                  fontSize={12}
                />
                <YAxis yAxisId="co2" orientation="left" fontSize={12} />
                <YAxis yAxisId="occupancy" orientation="right" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgCO2' ? `${value} ppm` : `${value} people`,
                    name === 'avgCO2' ? 'CO₂ Level' : 'Est. Occupancy'
                  ]}
                  labelFormatter={(hour) => `Time: ${formatHour(hour as number)}`}
                />
                <Bar 
                  yAxisId="co2" 
                  dataKey="avgCO2" 
                  fill="hsl(var(--chart-1))" 
                  name="avgCO2"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="occupancy" 
                  dataKey="estimatedOccupancy" 
                  fill="hsl(var(--chart-2))" 
                  name="estimatedOccupancy"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Space Efficiency Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Space Efficiency Analysis
            </CardTitle>
            <CardDescription>
              Distribution of room utilization states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  data={spaceEfficiencyData}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {spaceEfficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Busiest Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Activity Pattern
            </CardTitle>
            <CardDescription>
              Daily occupancy scores based on CO₂ levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {occupancyInsights.busyDays.map((day, index) => (
              <div key={day.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{day.day}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{day.occupancyScore.toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {day.avgCO2.toFixed(0)} ppm avg
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Class Hours vs Off Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Class Hours vs Off-Hours Comparison
            </CardTitle>
            <CardDescription>
              Air quality comparison during active and inactive periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Class Hours (8AM - 6PM)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {occupancyInsights.airQualityDuringClasses.classHours.avgCO2.toFixed(0)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">ppm CO₂</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {occupancyInsights.airQualityDuringClasses.classHours.avgAQI.toFixed(0)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">AQI</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Off-Hours</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {occupancyInsights.airQualityDuringClasses.offHours.avgCO2.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">ppm CO₂</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {occupancyInsights.airQualityDuringClasses.offHours.avgAQI.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">AQI</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}