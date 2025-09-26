import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Clock, TrendingUp, Building, Gauge, Shield, DollarSign, Home, Calendar, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ActivityInsightsProps {
  activityInsights: {
    averageCO2: number;
    realEstateMetrics: {
      roomUsageHours: number;
      peakOccupancyPeriod: { start: number; end: number; description: string };
      roomEfficiencyScore: number;
      actualOccupancyRate: number;
    };
    occupancyTimeline: Array<{ hour: number; avgCO2: number; occupancyLevel: string; isOccupied: boolean }>;
    airQualityDuringClasses: {
      classHours: { avgCO2: number; avgAQI: number };
      offHours: { avgCO2: number; avgAQI: number };
    };
    ventilationEffectiveness: {
      recoveryTimeMinutes: number;
      maxCO2Reached: number;
      ventilationScore: number;
    };
    facilitiesInsights: {
      energyCostPerHour: number;
      hvacEfficiencyRating: string;
      maintenanceStatus: string;
    };
  };
}

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export function ActivityInsights({ activityInsights }: ActivityInsightsProps) {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const getCO2Status = (co2Level: number) => {
    if (co2Level < 500) return { status: 'Unoccupied', color: 'bg-green-500' };
    if (co2Level < 800) return { status: 'Light Occupancy', color: 'bg-blue-500' };
    if (co2Level < 1200) return { status: 'Active Use', color: 'bg-yellow-500' };
    return { status: 'High Occupancy', color: 'bg-red-500' };
  };

  const getVentilationGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getRoomEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-secondary';
    if (score >= 40) return 'text-tertiary';
    return 'text-danger';
  };

  const ventilationGrade = getVentilationGrade(activityInsights.ventilationEffectiveness.ventilationScore);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Real Estate Intelligence Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift border-primary/30 bg-gradient-to-br from-primary/10 to-primary/20 glow-primary animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-primary-glow flex items-center gap-2">
              🏢 Room Usage Hours
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-primary/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Daily hours room is actively occupied based on CO₂ levels</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/20 animate-pulse-glow">
              <Home className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {activityInsights.realEstateMetrics.roomUsageHours.toFixed(1)}h
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${getCO2Status(activityInsights.averageCO2).color} animate-pulse`} />
              <p className="text-xs text-primary/70 font-medium">
                per day occupied
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/20 glow-secondary animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-secondary-glow flex items-center gap-2">
              📈 Room Efficiency Score
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-secondary/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How well the room space is utilized during scheduled hours</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="p-2 rounded-lg bg-secondary/20 animate-pulse-glow">
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent`}>
              {activityInsights.realEstateMetrics.roomEfficiencyScore}/100
            </div>
            <p className="text-xs text-secondary/70 font-medium">
              🎯 Utilization efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-tertiary/30 bg-gradient-to-br from-tertiary/10 to-tertiary/20 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-tertiary-glow flex items-center gap-2">
              ⏰ Peak Occupancy
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-tertiary/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Time period with highest room usage throughout the day</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="p-2 rounded-lg bg-tertiary/20 animate-pulse-glow">
              <Calendar className="h-4 w-4 text-tertiary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-tertiary to-tertiary-glow bg-clip-text text-transparent">
              {formatHour(activityInsights.realEstateMetrics.peakOccupancyPeriod.start)}-{formatHour(activityInsights.realEstateMetrics.peakOccupancyPeriod.end)}
            </div>
            <p className="text-xs text-tertiary/70 font-medium">
              {activityInsights.realEstateMetrics.peakOccupancyPeriod.description}
            </p>
          </CardContent>
        </Card>

        <Card className={`glass-card hover-lift border-accent/30 bg-gradient-to-br from-accent/10 to-accent/20 animate-fade-in`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-accent flex items-center gap-2">
              🏆 HVAC Performance
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-accent/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How effectively the ventilation system manages air quality and CO₂ recovery</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="p-2 rounded-lg bg-accent/20 animate-pulse-glow">
              <Gauge className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent`}>
              {ventilationGrade.grade}
            </div>
            <p className="text-xs text-accent/70 font-medium">
              {activityInsights.ventilationEffectiveness.ventilationScore}/100 Score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Occupancy Timeline */}
        <Card className="glass-card hover-lift border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🏢 Room Occupancy Timeline
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              Real occupancy patterns based on CO₂ readings throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityInsights.occupancyTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} ppm`,
                    'CO₂ Level'
                  ]}
                  labelFormatter={(hour) => `Time: ${formatHour(hour as number)}`}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="avgCO2" 
                  fill="hsl(var(--chart-1))" 
                  name="CO₂ Level"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real Estate Efficiency Metrics */}
        <Card className="glass-card hover-lift border-secondary/20 bg-gradient-to-br from-secondary/5 to-tertiary/5">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-tertiary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20 glow-secondary">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <span className="bg-gradient-to-r from-secondary to-tertiary bg-clip-text text-transparent">
                💡 Facilities Cost Intelligence
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              Real estate utilization and operational efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl glass-card border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/20 hover-lift">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-secondary-glow">💰 HVAC Cost per Usage Hour</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent">
                    ${activityInsights.facilitiesInsights.energyCostPerHour.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-secondary/70 font-medium">Based on {activityInsights.realEstateMetrics.roomUsageHours.toFixed(1)} hours daily usage</p>
              </div>

              <div className="p-4 rounded-xl glass-card border-tertiary/20 bg-gradient-to-br from-tertiary/10 to-tertiary/20 hover-lift">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-tertiary-glow">📊 Occupancy Rate</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-tertiary to-tertiary-glow bg-clip-text text-transparent">
                    {activityInsights.realEstateMetrics.actualOccupancyRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-tertiary/70 font-medium">Actual vs scheduled usage efficiency</p>
              </div>

              <div className="p-4 rounded-xl glass-card border-accent/20 bg-gradient-to-br from-accent/10 to-accent/20 hover-lift">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-accent">⚡ System Status</span>
                  <Badge className="bg-gradient-to-r from-success to-success-glow text-success-foreground">
                    {activityInsights.facilitiesInsights.hvacEfficiencyRating}
                  </Badge>
                </div>
                <p className="text-xs text-accent/70 font-medium">{activityInsights.facilitiesInsights.maintenanceStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Ventilation Performance */}
        <Card className="glass-card hover-lift border-accent/20 bg-gradient-to-br from-accent/5 to-tertiary/5">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-tertiary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 glow-accent">
                <Gauge className="w-5 h-5 text-accent" />
              </div>
              <span className="bg-gradient-to-r from-accent to-tertiary bg-clip-text text-transparent">
                🏆 HVAC Performance Intelligence
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              Advanced ventilation system metrics and efficiency scoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 rounded-xl glass-card border-primary/20 bg-gradient-to-br from-primary/10 to-primary/20 hover-lift">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
                  {activityInsights.ventilationEffectiveness.recoveryTimeMinutes}
                </div>
                <div className="text-sm font-medium text-primary/70">⏱️ Minutes Recovery Time</div>
              </div>
              <div className="text-center p-6 rounded-xl glass-card border-danger/20 bg-gradient-to-br from-danger/10 to-danger/20 hover-lift">
                <div className="text-3xl font-bold bg-gradient-to-r from-danger to-danger-glow bg-clip-text text-transparent mb-2">
                  {activityInsights.ventilationEffectiveness.maxCO2Reached.toFixed(0)}
                </div>
                <div className="text-sm font-medium text-danger/70">🔺 Peak CO₂ (ppm)</div>
              </div>
            </div>
            
            <div className="p-6 rounded-xl glass-card border-accent/20 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-foreground">🏆 Overall Performance</span>
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-glow text-accent-foreground font-bold text-lg shadow-lg glow-accent">
                  Grade {ventilationGrade.grade}
                </div>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Based on CO₂ management and recovery patterns - showing excellent ventilation system performance
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Real Estate Insights */}
        <Card className="glass-card hover-lift border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 glow-accent">
                <Building className="w-5 h-5 text-accent" />
              </div>
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                🎯 Space Optimization Recommendations
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              Executive insights for better space utilization and cost optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl glass-card border-success/20 bg-gradient-to-br from-success/10 to-success/20 hover-lift">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/20">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <span className="font-semibold text-success-glow">🏆 High Efficiency Room</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Room efficiency score of {activityInsights.realEstateMetrics.roomEfficiencyScore}/100 indicates excellent space utilization. 
                Occupied {activityInsights.realEstateMetrics.roomUsageHours.toFixed(1)} hours daily with optimal ventilation performance.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/20 hover-lift">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <DollarSign className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-secondary-glow">💡 Cost Optimization</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Peak usage during {formatHour(activityInsights.realEstateMetrics.peakOccupancyPeriod.start)}-{formatHour(activityInsights.realEstateMetrics.peakOccupancyPeriod.end)} allows for 
                optimized HVAC scheduling and potential energy savings of 15-20% during off-peak hours.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border-tertiary/20 bg-gradient-to-br from-tertiary/10 to-tertiary/20 hover-lift">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-tertiary/20">
                  <Shield className="w-4 h-4 text-tertiary" />
                </div>
                <span className="font-semibold text-tertiary-glow">🔧 Maintenance Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                HVAC system rated "{activityInsights.facilitiesInsights.hvacEfficiencyRating}" with {activityInsights.facilitiesInsights.maintenanceStatus}. 
                Recovery time of {activityInsights.ventilationEffectiveness.recoveryTimeMinutes} minutes shows excellent air quality management.
              </p>
            </div>
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
    </TooltipProvider>
  );
}