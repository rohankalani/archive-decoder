import { useMemo } from 'react';
import { SimplifiedReportData, useSimplifiedReportData } from './useSimplifiedReportData';

export interface EnhancedReportData extends SimplifiedReportData {
  previousPeriod: {
    avgAqi: number;
    totalAlerts: number;
    activeDevices: number;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'critical';
    title: string;
    description: string;
    metric?: string;
  }>;
  pollutants: Array<{
    name: string;
    value: number;
    max: number;
    unit: string;
    status: 'good' | 'moderate' | 'unhealthy' | 'critical';
    percentage: number;
  }>;
  alertTrends: Array<{
    date: string;
    critical: number;
    warning: number;
    info: number;
  }>;
}

export function useEnhancedReportData(startDate: Date, endDate: Date, includePreviousPeriod = false) {
  const currentPeriod = useSimplifiedReportData(startDate, endDate);
  
  // Calculate previous period dates
  const periodLength = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodLength);
  const previousEndDate = new Date(startDate.getTime() - 1);
  
  // Only fetch previous period if requested
  const previousPeriod = useSimplifiedReportData(
    includePreviousPeriod ? previousStartDate : endDate,
    includePreviousPeriod ? previousEndDate : endDate
  );

  const enhancedData = useMemo(() => {
    if (!currentPeriod.data) return null;

    const generateInsights = (): EnhancedReportData['insights'] => {
      const insights: EnhancedReportData['insights'] = [];
      const current = currentPeriod.data!;
      const previous = includePreviousPeriod ? previousPeriod.data : null;

      // AQI insights
      if (current.summary.avgAqi <= 50) {
        insights.push({
          type: 'success',
          title: 'Excellent Air Quality',
          description: `Campus average AQI is ${current.summary.avgAqi}, well within healthy levels.`,
          metric: `Target: ≤50 | Current: ${current.summary.avgAqi}`
        });
      } else if (current.summary.avgAqi > 100) {
        insights.push({
          type: 'critical',
          title: 'Unhealthy Air Quality Detected',
          description: `Average AQI of ${current.summary.avgAqi} requires immediate attention. Consider increasing ventilation.`,
          metric: `Safe threshold: 50 | Current: ${current.summary.avgAqi}`
        });
      } else if (current.summary.avgAqi > 50) {
        insights.push({
          type: 'warning',
          title: 'Moderate Air Quality',
          description: `AQI at ${current.summary.avgAqi}. Monitor sensitive groups and consider preventive measures.`,
          metric: `Good: ≤50 | Current: ${current.summary.avgAqi}`
        });
      }

      // Device performance insights
      const devicePerformance = (current.summary.activeDevices / current.summary.devicesCount) * 100;
      if (devicePerformance < 80) {
        insights.push({
          type: 'warning',
          title: 'Device Performance Issue',
          description: `Only ${devicePerformance.toFixed(0)}% of devices are active. Check offline devices for maintenance needs.`,
          metric: `Target: ≥95% | Current: ${devicePerformance.toFixed(0)}%`
        });
      } else if (devicePerformance >= 95) {
        insights.push({
          type: 'success',
          title: 'Optimal Device Performance',
          description: `${devicePerformance.toFixed(0)}% device uptime maintained. Excellent system reliability.`,
        });
      }

      // Alert insights
      if (current.summary.totalAlerts > 0) {
        if (previous && previous.summary.totalAlerts < current.summary.totalAlerts) {
          const increase = ((current.summary.totalAlerts - previous.summary.totalAlerts) / previous.summary.totalAlerts * 100);
          insights.push({
            type: 'warning',
            title: 'Alert Increase Detected',
            description: `Alerts increased by ${increase.toFixed(0)}% compared to previous period. Review alert patterns.`,
            metric: `Previous: ${previous.summary.totalAlerts} | Current: ${current.summary.totalAlerts}`
          });
        }
      } else {
        insights.push({
          type: 'success',
          title: 'No Alerts Triggered',
          description: 'All monitored parameters within acceptable ranges throughout the period.',
        });
      }

      // Building insights
      const problematicBuildings = current.buildings.filter(b => b.status === 'unhealthy');
      if (problematicBuildings.length > 0) {
        insights.push({
          type: 'critical',
          title: 'Buildings Need Attention',
          description: `${problematicBuildings.length} building(s) have unhealthy air quality: ${problematicBuildings.map(b => b.name).join(', ')}`,
          metric: `Affected buildings: ${problematicBuildings.length}/${current.buildings.length}`
        });
      }

      // CO2 insights
      if (current.co2Trends.length > 0) {
        const avgCO2 = current.co2Trends.reduce((sum, t) => sum + t.avgValue, 0) / current.co2Trends.length;
        if (avgCO2 > 1000) {
          insights.push({
            type: 'warning',
            title: 'Elevated CO2 Levels',
            description: `Average CO2 at ${Math.round(avgCO2)} ppm. Recommend improving ventilation during peak hours.`,
            metric: `Ideal: <800 ppm | Current avg: ${Math.round(avgCO2)} ppm`
          });
        }
      }

      return insights;
    };

    const generatePollutants = (): EnhancedReportData['pollutants'] => {
      const aqi = currentPeriod.data!.summary.avgAqi;
      const avgCO2 = currentPeriod.data!.co2Trends.length > 0
        ? currentPeriod.data!.co2Trends.reduce((sum, t) => sum + t.avgValue, 0) / currentPeriod.data!.co2Trends.length
        : 0;

      // Simulate pollutant data based on AQI
      return [
        {
          name: 'PM2.5',
          value: aqi * 0.4,
          max: 150,
          unit: 'µg/m³',
          status: aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'unhealthy' : 'critical',
          percentage: (aqi * 0.4 / 150) * 100
        },
        {
          name: 'PM10',
          value: aqi * 0.6,
          max: 250,
          unit: 'µg/m³',
          status: aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'unhealthy' : 'critical',
          percentage: (aqi * 0.6 / 250) * 100
        },
        {
          name: 'CO2',
          value: avgCO2,
          max: 2000,
          unit: 'ppm',
          status: avgCO2 <= 800 ? 'good' : avgCO2 <= 1000 ? 'moderate' : avgCO2 <= 1500 ? 'unhealthy' : 'critical',
          percentage: (avgCO2 / 2000) * 100
        },
        {
          name: 'VOC',
          value: aqi * 0.3,
          max: 500,
          unit: 'ppb',
          status: aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'unhealthy' : 'critical',
          percentage: (aqi * 0.3 / 500) * 100
        }
      ];
    };

    const generateAlertTrends = (): EnhancedReportData['alertTrends'] => {
      // Generate daily alert data for the period
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const trends: EnhancedReportData['alertTrends'] = [];
      
      for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          critical: Math.floor(Math.random() * 5),
          warning: Math.floor(Math.random() * 10),
          info: Math.floor(Math.random() * 15)
        });
      }
      
      return trends;
    };

    const previous = includePreviousPeriod ? previousPeriod.data : null;

    return {
      ...currentPeriod.data,
      previousPeriod: {
        avgAqi: previous?.summary.avgAqi || 0,
        totalAlerts: previous?.summary.totalAlerts || 0,
        activeDevices: previous?.summary.activeDevices || 0,
      },
      insights: generateInsights(),
      pollutants: generatePollutants(),
      alertTrends: generateAlertTrends()
    };
  }, [currentPeriod.data, previousPeriod.data, includePreviousPeriod, startDate.getTime(), endDate.getTime()]);

  return {
    data: enhancedData,
    isLoading: currentPeriod.isLoading || previousPeriod.isLoading,
    error: currentPeriod.error || previousPeriod.error,
    refetch: currentPeriod.refetch
  };
}
