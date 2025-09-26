import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, TrendingUp, Building, Gauge, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ActivityInsightsProps {
  activityInsights: {
    averageCO2: number;
    peakActivityHours: Array<{ hour: number; avgCO2: number; activityLevel: string; intensity: number }>;
    spaceUtilization: number;
    busyDays: Array<{ day: string; avgCO2: number; activityScore: number }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    spaceEfficiency: {
      lowActivityPeriods: number;
      highActivityPeriods: number;
      optimalActivityPercentage: number;
    };
    ventilationEffectiveness: {
      recoveryTimeMinutes: number;
      maxCO2Reached: number;
      ventilationScore: number;
    };
  };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function ActivityInsights({ activityInsights }: ActivityInsightsProps) {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const getCO2Status = (co2Level: number) => {
    if (co2Level < 500) return { status: 'Low Activity', color: 'bg-green-500' };
    if (co2Level < 800) return { status: 'Moderate Activity', color: 'bg-blue-500' };
    if (co2Level < 1200) return { status: 'High Activity', color: 'bg-yellow-500' };
    return { status: 'Peak Activity', color: 'bg-red-500' };
  };

  const getVentilationGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const spaceEfficiencyData = [
    { name: 'Optimal Activity', value: activityInsights.spaceEfficiency.optimalActivityPercentage, color: COLORS[0] },
    { name: 'Low Activity', value: activityInsights.spaceEfficiency.lowActivityPeriods, color: COLORS[1] },
    { name: 'High Activity', value: activityInsights.spaceEfficiency.highActivityPeriods, color: COLORS[2] },
  ];

  const ventilationGrade = getVentilationGrade(activityInsights.ventilationEffectiveness.ventilationScore);

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
              {activityInsights.averageCO2.toFixed(0)} ppm
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getCO2Status(activityInsights.averageCO2).color}`} />
              <p className="text-xs text-muted-foreground">
                {getCO2Status(activityInsights.averageCO2).status}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space Utilization</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {activityInsights.spaceUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall space efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Activity Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatHour(activityInsights.peakActivityHours[0]?.hour || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activityInsights.peakActivityHours[0]?.activityLevel || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${ventilationGrade.bg} border-current`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventilation Grade</CardTitle>
            <Gauge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ventilationGrade.color}`}>
              {ventilationGrade.grade}
            </div>
            <p className="text-xs text-muted-foreground">
              {activityInsights.ventilationEffectiveness.ventilationScore}/100 Score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Activity Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Daily Activity Pattern
            </CardTitle>
            <CardDescription>
              CO₂ levels and activity intensity throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityInsights.peakActivityHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour}
                  fontSize={12}
                />
                <YAxis yAxisId="co2" orientation="left" fontSize={12} />
                <YAxis yAxisId="intensity" orientation="right" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgCO2' ? `${value} ppm` : `${value}%`,
                    name === 'avgCO2' ? 'CO₂ Level' : 'Activity Intensity'
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
                  yAxisId="intensity" 
                  dataKey="intensity" 
                  fill="hsl(var(--chart-2))" 
                  name="intensity"
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
              Space Efficiency Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of activity levels across time periods
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

        {/* Ventilation Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Ventilation Effectiveness
            </CardTitle>
            <CardDescription>
              HVAC system performance metrics and recovery analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">
                  {activityInsights.ventilationEffectiveness.recoveryTimeMinutes}
                </div>
                <div className="text-sm text-muted-foreground">Minutes Recovery Time</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-destructive">
                  {activityInsights.ventilationEffectiveness.maxCO2Reached.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Peak CO₂ (ppm)</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Performance</span>
                <Badge variant="secondary" className={`${ventilationGrade.color} font-bold`}>
                  Grade {ventilationGrade.grade}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Based on CO₂ management and recovery patterns
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Activity Rankings
            </CardTitle>
            <CardDescription>
              Daily activity scores based on CO₂ patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityInsights.busyDays.map((day, index) => (
              <div key={day.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{day.day}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{day.activityScore.toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {day.avgCO2.toFixed(0)} ppm avg
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Class Hours vs Off Hours Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Class Hours vs Off-Hours Analysis
          </CardTitle>
          <CardDescription>
            Comparative air quality during active and inactive periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">Class Hours (8AM - 6PM)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {activityInsights.airQualityDuringClasses.classHours.avgCO2.toFixed(0)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">ppm CO₂</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {activityInsights.airQualityDuringClasses.classHours.avgAQI.toFixed(0)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">AQI</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-4">Off-Hours</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {activityInsights.airQualityDuringClasses.offHours.avgCO2.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">ppm CO₂</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {activityInsights.airQualityDuringClasses.offHours.avgAQI.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">AQI</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}