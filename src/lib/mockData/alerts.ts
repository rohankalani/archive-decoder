/**
 * Alert mock data for Abu Dhabi University
 * Generates realistic air quality alerts based on sensor data patterns
 */

import { mockDataManager } from './index';
import { generateMockDevices, generateSensorReading } from './sensorData';

export interface MockAlert {
  id: string;
  device_id: string;
  sensor_type: 'pm25' | 'pm10' | 'co2' | 'temperature' | 'humidity' | 'voc' | 'nox' | 'hcho';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold_value: number;
  is_resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;
  created_at: Date;
}

// Air quality thresholds for different alert levels
const alertThresholds = {
  pm25: {
    medium: 25,   // WHO guideline
    high: 50,     // Unhealthy for sensitive groups
    critical: 100 // Unhealthy
  },
  pm10: {
    medium: 50,
    high: 100,
    critical: 200
  },
  co2: {
    medium: 1000,  // Stuffy air
    high: 1500,    // Drowsy
    critical: 2000 // Poor air quality
  },
  temperature: {
    medium: 28,    // Slightly warm
    high: 30,      // Warm
    critical: 35   // Hot
  },
  humidity: {
    medium: 70,    // Slightly humid
    high: 80,      // Very humid
    critical: 90   // Extremely humid
  },
  voc: {
    medium: 0.5,
    high: 1.0,
    critical: 2.0
  },
  nox: {
    medium: 0.2,
    high: 0.4,
    critical: 0.8
  },
  hcho: {
    medium: 0.1,
    high: 0.2,
    critical: 0.4
  }
};

// Alert message templates
const alertMessages = {
  pm25: {
    medium: 'PM2.5 levels elevated - May affect sensitive individuals',
    high: 'High PM2.5 detected - Consider air filtration',
    critical: 'Critical PM2.5 levels - Immediate action required'
  },
  pm10: {
    medium: 'PM10 levels elevated - Monitor air quality',
    high: 'High PM10 detected - Check ventilation systems',
    critical: 'Critical PM10 levels - Area evacuation recommended'
  },
  co2: {
    medium: 'CO2 levels elevated - Increase ventilation',
    high: 'High CO2 detected - Poor air circulation',
    critical: 'Critical CO2 levels - Immediate ventilation required'
  },
  temperature: {
    medium: 'Temperature above comfort level',
    high: 'High temperature detected - Check HVAC system',
    critical: 'Critical temperature - Cooling system failure'
  },
  humidity: {
    medium: 'Humidity levels elevated',
    high: 'High humidity - Risk of mold growth',
    critical: 'Critical humidity levels - Dehumidification needed'
  },
  voc: {
    medium: 'Volatile organic compounds detected',
    high: 'High VOC levels - Check chemical storage',
    critical: 'Critical VOC exposure - Evacuate area'
  },
  nox: {
    medium: 'Nitrogen oxides detected',
    high: 'High NOx levels - Check equipment',
    critical: 'Critical NOx exposure - Safety concern'
  },
  hcho: {
    medium: 'Formaldehyde levels elevated',
    high: 'High formaldehyde detected',
    critical: 'Critical formaldehyde levels - Health hazard'
  }
};

// Generate realistic alerts based on current conditions
export const generateRecentAlerts = (devices: any[], count: number = 10): MockAlert[] => {
  const alerts: MockAlert[] = [];
  const now = mockDataManager.getCurrentTime();
  const multipliers = mockDataManager.getScenarioMultipliers();
  
  for (let i = 0; i < count; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const sensorTypes = Object.keys(alertThresholds) as Array<keyof typeof alertThresholds>;
    const sensorType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];
    
    // Generate a reading that might trigger an alert
    const reading = generateSensorReading(device, sensorType);
    const thresholds = alertThresholds[sensorType];
    
    let severity: MockAlert['severity'] = 'low';
    let threshold = 0;
    
    // Determine if this reading should trigger an alert based on scenario
    const shouldAlert = Math.random() < multipliers.alertProbability;
    
    if (shouldAlert) {
      if (reading.value > thresholds.critical) {
        severity = 'critical';
        threshold = thresholds.critical;
      } else if (reading.value > thresholds.high) {
        severity = 'high'; 
        threshold = thresholds.high;
      } else if (reading.value > thresholds.medium) {
        severity = 'medium';
        threshold = thresholds.medium;
      } else {
        // Force an alert for demonstration
        severity = 'medium';
        threshold = thresholds.medium;
        reading.value = threshold + Math.random() * 10;
      }
      
      const alertAge = Math.random() * 7 * 24 * 60 * 60 * 1000; // Up to 7 days old
      const createdAt = new Date(now.getTime() - alertAge);
      const isResolved = Math.random() < 0.7; // 70% of alerts are resolved
      
      alerts.push({
        id: `alert-${Date.now()}-${i}`,
        device_id: device.id,
        sensor_type: sensorType,
        severity,
        message: alertMessages[sensorType][severity],
        value: reading.value,
        threshold_value: threshold,
        is_resolved: isResolved,
        resolved_at: isResolved ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined,
        resolved_by: isResolved ? `user-${Math.floor(Math.random() * 5) + 1}` : undefined,
        created_at: createdAt
      });
    }
  }
  
  return alerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};

// Generate alerts for specific scenarios
export const generateScenarioAlerts = (scenario: string): MockAlert[] => {
  const devices = generateMockDevices();
  
  switch (scenario) {
    case 'lab_incident':
      return [
        {
          id: 'alert-lab-incident-1',
          device_id: devices.find(d => d.name.includes('Chemistry'))?.id || devices[0].id,
          sensor_type: 'voc',
          severity: 'critical',
          message: 'Critical VOC exposure detected in Chemistry Lab - Chemical spill suspected',
          value: 2.5,
          threshold_value: 2.0,
          is_resolved: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          id: 'alert-lab-incident-2',
          device_id: devices.find(d => d.name.includes('Chemistry'))?.id || devices[0].id,
          sensor_type: 'hcho',
          severity: 'high',
          message: 'High formaldehyde levels detected in Chemistry Lab',
          value: 0.35,
          threshold_value: 0.2,
          is_resolved: false,
          created_at: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        }
      ];
      
    case 'hvac_failure':
      return [
        {
          id: 'alert-hvac-failure-1',
          device_id: devices.find(d => d.name.includes('Lecture'))?.id || devices[0].id,
          sensor_type: 'co2',
          severity: 'high',
          message: 'High CO2 levels - HVAC system malfunction suspected',
          value: 1800,
          threshold_value: 1500,
          is_resolved: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: 'alert-hvac-failure-2',
          device_id: devices.find(d => d.name.includes('Lecture'))?.id || devices[0].id,
          sensor_type: 'temperature',
          severity: 'high',
          message: 'High temperature detected - Cooling system failure',
          value: 32,
          threshold_value: 30,
          is_resolved: false,
          created_at: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
        }
      ];
      
    case 'maintenance_dust':
      return [
        {
          id: 'alert-maintenance-1',
          device_id: devices.find(d => d.name.includes('Workshop'))?.id || devices[0].id,
          sensor_type: 'pm10',
          severity: 'medium',
          message: 'Elevated PM10 levels during maintenance activities',
          value: 75,
          threshold_value: 50,
          is_resolved: true,
          resolved_at: new Date(Date.now() - 30 * 60 * 1000),
          resolved_by: 'maintenance-team',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        }
      ];
      
    default:
      return generateRecentAlerts(devices, 5);
  }
};

export const mockAlerts = {
  generateRecentAlerts,
  generateScenarioAlerts,
  alertThresholds,
  alertMessages
};