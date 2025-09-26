/**
 * Reports and analytics mock data for Abu Dhabi University
 * Generates realistic performance metrics and air quality reports
 */

import { mockDataManager } from './index';
import { generateMockDevices, generateSensorReading } from './sensorData';

export interface MockReportData {
  id: string;
  title: string;
  description: string;
  period: {
    start: Date;
    end: Date;
  };
  deviceCount: number;
  totalReadings: number;
  averageAQI: number;
  alertsGenerated: number;
  alertsResolved: number;
  topIssues: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  buildingPerformance: Array<{
    buildingName: string;
    averageAQI: number;
    alertCount: number;
    deviceUptime: number;
  }>;
  trends: Array<{
    date: Date;
    pm25: number;
    pm10: number;
    co2: number;
    temperature: number;
    humidity: number;
    aqi: number;
  }>;
  recommendations: string[];
  generatedAt: Date;
}

// Calculate AQI from PM2.5 (simplified US EPA formula)
const calculateAQI = (pm25: number): number => {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round((50 / 23.4) * (pm25 - 12) + 50);
  if (pm25 <= 55.4) return Math.round((50 / 20) * (pm25 - 35.4) + 100);
  if (pm25 <= 150.4) return Math.round((50 / 95) * (pm25 - 55.4) + 150);
  if (pm25 <= 250.4) return Math.round((100 / 100) * (pm25 - 150.4) + 200);
  return Math.round((100 / 249.6) * (pm25 - 250.4) + 300);
};

// Generate comprehensive monthly report
export const generateMonthlyReport = (month: number = new Date().getMonth()): MockReportData => {
  const year = new Date().getFullYear();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const devices = generateMockDevices();
  
  // Generate daily trends for the month
  const trends = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayMultiplier = mockDataManager.getUniversityScheduleMultiplier();
    const baseValues = {
      pm25: 15 + Math.random() * 20,
      pm10: 25 + Math.random() * 30,
      co2: 450 + Math.random() * 400,
      temperature: 23 + Math.random() * 4,
      humidity: 55 + Math.random() * 20
    };
    
    // Apply university schedule patterns
    const adjustedValues = {
      pm25: baseValues.pm25 * (0.7 + dayMultiplier * 0.6),
      pm10: baseValues.pm10 * (0.7 + dayMultiplier * 0.6),
      co2: baseValues.co2 * (0.6 + dayMultiplier * 0.8),
      temperature: baseValues.temperature + (Math.random() - 0.5) * 2,
      humidity: baseValues.humidity + (Math.random() - 0.5) * 10
    };
    
    trends.push({
      date: new Date(currentDate),
      ...adjustedValues,
      aqi: calculateAQI(adjustedValues.pm25)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate summary statistics
  const averageAQI = Math.round(trends.reduce((sum, day) => sum + day.aqi, 0) / trends.length);
  const totalReadings = trends.length * devices.length * 6; // 6 sensor types per device per day
  const alertsGenerated = Math.floor(totalReadings * 0.02); // 2% of readings trigger alerts
  const alertsResolved = Math.floor(alertsGenerated * 0.75); // 75% resolution rate
  
  // Building performance data
  const buildingPerformance = [
    {
      buildingName: 'Academic Building 1',
      averageAQI: averageAQI + Math.floor(Math.random() * 20 - 10),
      alertCount: Math.floor(alertsGenerated * 0.3),
      deviceUptime: 95 + Math.random() * 4
    },
    {
      buildingName: 'Engineering Building',
      averageAQI: averageAQI + Math.floor(Math.random() * 30 - 5), // Slightly higher due to labs
      alertCount: Math.floor(alertsGenerated * 0.4),
      deviceUptime: 93 + Math.random() * 5
    },
    {
      buildingName: 'Central Library',
      averageAQI: averageAQI - Math.floor(Math.random() * 15), // Better air quality
      alertCount: Math.floor(alertsGenerated * 0.15),
      deviceUptime: 98 + Math.random() * 2
    },
    {
      buildingName: 'Student Center',
      averageAQI: averageAQI + Math.floor(Math.random() * 25 - 5),
      alertCount: Math.floor(alertsGenerated * 0.15),
      deviceUptime: 96 + Math.random() * 3
    }
  ];
  
  // Top issues analysis
  const topIssues = [
    { type: 'High CO2 Levels', count: Math.floor(alertsGenerated * 0.4), severity: 'medium' },
    { type: 'PM2.5 Threshold Exceeded', count: Math.floor(alertsGenerated * 0.25), severity: 'high' },
    { type: 'Temperature Control', count: Math.floor(alertsGenerated * 0.2), severity: 'low' },
    { type: 'Humidity Issues', count: Math.floor(alertsGenerated * 0.1), severity: 'low' },
    { type: 'VOC Detection', count: Math.floor(alertsGenerated * 0.05), severity: 'high' }
  ];
  
  // Generate recommendations based on data
  const recommendations = [];
  
  if (averageAQI > 100) {
    recommendations.push('Consider upgrading HVAC filtration systems to reduce particulate matter');
  }
  if (topIssues[0].count > alertsGenerated * 0.3) {
    recommendations.push('Increase ventilation in high-occupancy areas during peak hours');
  }
  if (buildingPerformance.some(b => b.deviceUptime < 95)) {
    recommendations.push('Implement preventive maintenance schedule for air quality sensors');
  }
  recommendations.push('Schedule regular calibration of sensors in laboratory environments');
  recommendations.push('Consider installing air purifiers in high-traffic areas');
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    id: `report-${year}-${String(month + 1).padStart(2, '0')}`,
    title: `Air Quality Monthly Report - ${monthNames[month]} ${year}`,
    description: `Comprehensive air quality analysis for Abu Dhabi University Main Campus covering ${monthNames[month]} ${year}`,
    period: {
      start: startDate,
      end: endDate
    },
    deviceCount: devices.length,
    totalReadings,
    averageAQI,
    alertsGenerated,
    alertsResolved,
    topIssues,
    buildingPerformance,
    trends,
    recommendations,
    generatedAt: new Date()
  };
};

// Generate weekly summary report
export const generateWeeklyReport = (weeksAgo: number = 0): MockReportData => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
  const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000); // End of week (Saturday)
  
  const devices = generateMockDevices();
  
  // Generate daily trends for the week
  const trends = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const dayMultiplier = mockDataManager.getUniversityScheduleMultiplier();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    const baseValues = {
      pm25: 12 + Math.random() * 18,
      pm10: 20 + Math.random() * 25,
      co2: isWeekend ? 380 + Math.random() * 200 : 420 + Math.random() * 600,
      temperature: 22 + Math.random() * 5,
      humidity: 50 + Math.random() * 25
    };
    
    trends.push({
      date: new Date(currentDate),
      ...baseValues,
      aqi: calculateAQI(baseValues.pm25)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const averageAQI = Math.round(trends.reduce((sum, day) => sum + day.aqi, 0) / trends.length);
  const totalReadings = 7 * devices.length * 144; // Every 10 minutes for a week
  const alertsGenerated = Math.floor(totalReadings * 0.015); // 1.5% alert rate
  const alertsResolved = Math.floor(alertsGenerated * 0.8); // 80% resolution rate
  
  return {
    id: `weekly-report-${startDate.toISOString().split('T')[0]}`,
    title: `Weekly Air Quality Summary`,
    description: `Week of ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    period: { start: startDate, end: endDate },
    deviceCount: devices.length,
    totalReadings,
    averageAQI,
    alertsGenerated,
    alertsResolved,
    topIssues: [
      { type: 'High CO2 Levels', count: Math.floor(alertsGenerated * 0.5), severity: 'medium' },
      { type: 'PM2.5 Elevation', count: Math.floor(alertsGenerated * 0.3), severity: 'low' },
      { type: 'Temperature Variance', count: Math.floor(alertsGenerated * 0.2), severity: 'low' }
    ],
    buildingPerformance: [
      {
        buildingName: 'Academic Building 1',
        averageAQI: averageAQI - 5,
        alertCount: Math.floor(alertsGenerated * 0.25),
        deviceUptime: 97 + Math.random() * 2
      },
      {
        buildingName: 'Engineering Building', 
        averageAQI: averageAQI + 8,
        alertCount: Math.floor(alertsGenerated * 0.4),
        deviceUptime: 95 + Math.random() * 3
      },
      {
        buildingName: 'Central Library',
        averageAQI: averageAQI - 12,
        alertCount: Math.floor(alertsGenerated * 0.1),
        deviceUptime: 99 + Math.random() * 1
      }
    ],
    trends,
    recommendations: [
      'Monitor CO2 levels during high-occupancy periods',
      'Ensure proper ventilation in laboratory areas',
      'Continue regular maintenance schedule'
    ],
    generatedAt: new Date()
  };
};

export const mockReports = {
  generateMonthlyReport,
  generateWeeklyReport,
  calculateAQI
};