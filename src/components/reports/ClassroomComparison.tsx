import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building, ThermometerSun, Wind, Activity, TrendingUp, AlertTriangle, Users, Star, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface ClassroomData {
  classroomId: string;
  classroomName: string;
  building: string;
  floor: number;
  totalReadings: number;
  averageAqi: number;
  operatingHoursAqi: number;
  afterHoursAqi: number;
  averageCO2: number;
  operatingHoursCO2: number;
  afterHoursCO2: number;
  averageTemperature: number;
  operatingHoursTemp: number;
  afterHoursTemp: number;
  roomUsageHours: number;
  roomEfficiencyScore: number;
  ventilationScore: number;
  hvacEfficiencyRating: string;
  temperatureStability: number;
  alertCount: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
}

interface ClassroomComparisonProps {
  classrooms: ClassroomData[];
  operatingHours: { start: number; end: number };
}

export function ClassroomComparison({ classrooms, operatingHours }: ClassroomComparisonProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success border-success/30 bg-success/10';
      case 'good': return 'text-secondary border-secondary/30 bg-secondary/10';
      case 'needs_attention': return 'text-warning border-warning/30 bg-warning/10';
      case 'critical': return 'text-danger border-danger/30 bg-danger/10';
      default: return 'text-muted-foreground border-muted/30 bg-muted/10';
    }
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-success', bg: 'bg-success/20' };
    if (score >= 80) return { grade: 'A', color: 'text-success', bg: 'bg-success/20' };
    if (score >= 70) return { grade: 'B+', color: 'text-secondary', bg: 'bg-secondary/20' };
    if (score >= 60) return { grade: 'B', color: 'text-secondary', bg: 'bg-secondary/20' };
    if (score >= 50) return { grade: 'C', color: 'text-warning', bg: 'bg-warning/20' };
    return { grade: 'D', color: 'text-danger', bg: 'bg-danger/20' };
  };

  // Calculate executive insights
  const totalClassrooms = classrooms.length;
  const averageEfficiency = classrooms.reduce((sum, c) => sum + c.roomEfficiencyScore, 0) / totalClassrooms;
  const topPerformer = classrooms.reduce((best, current) => 
    current.roomEfficiencyScore > best.roomEfficiencyScore ? current : best
  );
  const needsAttention = classrooms.filter(c => c.status === 'needs_attention' || c.status === 'critical');
  const totalAlerts = classrooms.reduce((sum, c) => sum + c.alertCount, 0);

  // Prepare chart data
  const comparisonData = classrooms.map(c => ({
    name: c.classroomName,
    efficiency: c.roomEfficiencyScore,
    aqi: c.operatingHoursAqi,
    co2: c.operatingHoursCO2,
    temperature: c.operatingHoursTemp,
    ventilation: c.ventilationScore
  }));

  const temperatureInsightData = classrooms.map(c => ({
    name: c.classroomName,
    operatingTemp: c.operatingHoursTemp,
    afterHoursTemp: c.afterHoursTemp,
    stability: c.temperatureStability
  }));

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Executive Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card hover-lift border-primary/30 bg-gradient-to-br from-primary/10 to-primary/20 glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-primary-glow">📊 Campus Overview</CardTitle>
              <Building className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">{totalClassrooms}</div>
              <p className="text-xs text-primary/70">Active Classrooms Monitored</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/20 glow-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-secondary-glow">🏆 Top Performer</CardTitle>
              <Star className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-secondary mb-1">{topPerformer.classroomName}</div>
              <p className="text-xs text-secondary/70">{topPerformer.roomEfficiencyScore}% Efficiency</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-accent/30 bg-gradient-to-br from-accent/10 to-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-accent">📈 Average Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">{averageEfficiency.toFixed(1)}%</div>
              <p className="text-xs text-accent/70">Campus Space Utilization</p>
            </CardContent>
          </Card>

          <Card className={`glass-card hover-lift border-warning/30 bg-gradient-to-br from-warning/10 to-warning/20 ${needsAttention.length > 0 ? 'animate-pulse-glow' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-warning-glow">⚠️ Needs Attention</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning mb-2">{needsAttention.length}</div>
              <p className="text-xs text-warning/70">Classrooms Requiring Action</p>
            </CardContent>
          </Card>
        </div>

        {/* Classroom Performance Comparison Chart */}
        <Card className="glass-card hover-lift border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              📊 Classroom Performance Analytics
            </CardTitle>
            <CardDescription>
              Real-time efficiency and air quality comparison across all monitored classrooms during operating hours ({operatingHours.start}:00-{operatingHours.end}:00)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="efficiency" fill="hsl(var(--primary))" name="Efficiency %" />
                <Bar dataKey="aqi" fill="hsl(var(--secondary))" name="AQI" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Intelligence Analysis */}
        <Card className="glass-card hover-lift border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 glow-accent">
                <ThermometerSun className="w-5 h-5 text-accent" />
              </div>
              🌡️ Temperature Intelligence & HVAC Efficiency
            </CardTitle>
            <CardDescription>
              Operating hours vs after-hours temperature patterns revealing HVAC optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart data={temperatureInsightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operatingTemp" name="Operating Hours °C" />
                <YAxis dataKey="afterHoursTemp" name="After Hours °C" />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? `${value.toFixed(1)}°C` : value,
                    name === 'operatingTemp' ? 'Operating Hours' : 'After Hours'
                  ]}
                  labelFormatter={(label) => `Classroom: ${label}`}
                />
                <Scatter dataKey="stability" fill="hsl(var(--chart-1))" name="Temperature Stability" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Classroom Rankings */}
        <Card className="glass-card hover-lift border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20 glow-secondary">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              🏆 Classroom Performance Rankings & Insights
            </CardTitle>
            <CardDescription>
              Detailed analysis including temperature insights and operating vs after-hours performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classrooms
                .sort((a, b) => b.roomEfficiencyScore - a.roomEfficiencyScore)
                .map((classroom, index) => {
                  const grade = getPerformanceGrade(classroom.roomEfficiencyScore);
                  return (
                    <div
                      key={classroom.classroomId}
                      className={`p-6 rounded-xl glass-card border ${getStatusColor(classroom.status)} hover-lift transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                            <div>
                              <h3 className="text-lg font-semibold">{classroom.classroomName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {classroom.building} • Floor {classroom.floor}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl ${grade.bg} ${grade.color} font-bold text-lg shadow-lg`}>
                          Grade {grade.grade}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Operating Hours Performance */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            📅 Operating Hours ({operatingHours.start}:00-{operatingHours.end}:00)
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Air quality and temperature during active class hours</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>AQI:</span>
                              <Badge variant="secondary">{classroom.operatingHoursAqi.toFixed(0)}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>CO₂:</span>
                              <span className="font-medium">{classroom.operatingHoursCO2.toFixed(0)} ppm</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Temperature:</span>
                              <span className="font-medium">{classroom.operatingHoursTemp.toFixed(1)}°C</span>
                            </div>
                          </div>
                        </div>

                        {/* After Hours Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            🌙 After Hours Activity
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Late evening and weekend usage patterns and air quality</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>AQI:</span>
                              <Badge variant="outline">{classroom.afterHoursAqi.toFixed(0)}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>CO₂:</span>
                              <span className="font-medium">{classroom.afterHoursCO2.toFixed(0)} ppm</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Temperature:</span>
                              <span className="font-medium">{classroom.afterHoursTemp.toFixed(1)}°C</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            📈 Performance Metrics
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Room efficiency, temperature stability, and HVAC performance</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Efficiency:</span>
                                <span className="font-medium">{classroom.roomEfficiencyScore}%</span>
                              </div>
                              <Progress value={classroom.roomEfficiencyScore} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Ventilation:</span>
                                <span className="font-medium">{classroom.ventilationScore}/100</span>
                              </div>
                              <Progress value={classroom.ventilationScore} className="h-2" />
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Temp Stability:</span>
                              <span className="font-medium">{classroom.temperatureStability.toFixed(1)}°C</span>
                            </div>
                          </div>
                        </div>

                        {/* Smart Recommendations */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            💡 Smart Recommendations
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>AI-generated optimization suggestions based on data patterns</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h4>
                          <div className="space-y-1">
                            {classroom.recommendations.slice(0, 3).map((rec, idx) => (
                              <div key={idx} className="text-xs p-2 rounded bg-muted/30 border border-muted/50">
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {classroom.alertCount > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                          <div className="flex items-center gap-2 text-sm font-medium text-warning">
                            <AlertTriangle className="h-4 w-4" />
                            {classroom.alertCount} active alerts requiring attention
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}