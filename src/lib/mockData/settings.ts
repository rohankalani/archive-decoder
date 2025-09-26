/**
 * Settings mock data for Abu Dhabi University
 * Email settings and air quality thresholds
 */

export interface MockEmailSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockAirQualityThreshold {
  id: string;
  sensor_type: 'pm25' | 'pm10' | 'co2' | 'temperature' | 'humidity' | 'voc' | 'nox' | 'hcho' | 'pm03' | 'pm1' | 'pm5';
  unit: string;
  region: string;
  good_max?: number;
  moderate_max?: number;
  unhealthy_sensitive_max?: number;
  unhealthy_max?: number;
  very_unhealthy_max?: number;
  hazardous_min?: number;
  created_at: Date;
  updated_at: Date;
}

// Generate email settings for Abu Dhabi University
export const generateEmailSettings = (): MockEmailSetting[] => {
  return [
    {
      id: 'email-setting-001',
      setting_key: 'smtp_host',
      setting_value: 'smtp.adu.ac.ae',
      description: 'SMTP server hostname for university email system',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-002',
      setting_key: 'smtp_port',
      setting_value: '587',
      description: 'SMTP server port (TLS)',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-003',
      setting_key: 'from_email',
      setting_value: 'airquality@adu.ac.ae',
      description: 'Default sender email address for notifications',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-004',
      setting_key: 'from_name',
      setting_value: 'ADU Air Quality System',
      description: 'Default sender name for notifications',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-005',
      setting_key: 'alert_recipients',
      setting_value: 'facilities@adu.ac.ae,safety@adu.ac.ae',
      description: 'Default recipients for critical alerts',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-006',
      setting_key: 'report_recipients',
      setting_value: 'admin@adu.ac.ae,env-safety@adu.ac.ae',
      description: 'Recipients for periodic reports',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    {
      id: 'email-setting-007',
      setting_key: 'enable_notifications',
      setting_value: 'true',
      description: 'Enable/disable email notifications',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    }
  ];
};

// Generate air quality thresholds for UAE/Abu Dhabi
export const generateAirQualityThresholds = (): MockAirQualityThreshold[] => {
  return [
    // PM2.5 thresholds (WHO/UAE standards)
    {
      id: 'threshold-pm25-001',
      sensor_type: 'pm25',
      unit: 'µg/m³',
      region: 'UAE',
      good_max: 15,
      moderate_max: 25,
      unhealthy_sensitive_max: 50,
      unhealthy_max: 75,
      very_unhealthy_max: 150,
      hazardous_min: 150,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // PM10 thresholds
    {
      id: 'threshold-pm10-001',
      sensor_type: 'pm10',
      unit: 'µg/m³',
      region: 'UAE',
      good_max: 25,
      moderate_max: 50,
      unhealthy_sensitive_max: 100,
      unhealthy_max: 150,
      very_unhealthy_max: 250,
      hazardous_min: 250,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // CO2 thresholds (indoor air quality)
    {
      id: 'threshold-co2-001',
      sensor_type: 'co2',
      unit: 'ppm',
      region: 'UAE',
      good_max: 600,
      moderate_max: 1000,
      unhealthy_sensitive_max: 1500,
      unhealthy_max: 2000,
      very_unhealthy_max: 5000,
      hazardous_min: 5000,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // Temperature thresholds (°C)
    {
      id: 'threshold-temp-001',
      sensor_type: 'temperature',
      unit: '°C',
      region: 'UAE',
      good_max: 24,
      moderate_max: 28,
      unhealthy_sensitive_max: 32,
      unhealthy_max: 35,
      very_unhealthy_max: 40,
      hazardous_min: 40,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // Humidity thresholds (%)
    {
      id: 'threshold-humidity-001',
      sensor_type: 'humidity',
      unit: '%',
      region: 'UAE',
      good_max: 60,
      moderate_max: 70,
      unhealthy_sensitive_max: 80,
      unhealthy_max: 85,
      very_unhealthy_max: 90,
      hazardous_min: 90,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // VOC thresholds (mg/m³)
    {
      id: 'threshold-voc-001',
      sensor_type: 'voc',
      unit: 'mg/m³',
      region: 'UAE',
      good_max: 0.3,
      moderate_max: 0.5,
      unhealthy_sensitive_max: 1.0,
      unhealthy_max: 2.0,
      very_unhealthy_max: 5.0,
      hazardous_min: 5.0,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // NOx thresholds (mg/m³)  
    {
      id: 'threshold-nox-001',
      sensor_type: 'nox',
      unit: 'mg/m³',
      region: 'UAE',
      good_max: 0.1,
      moderate_max: 0.2,
      unhealthy_sensitive_max: 0.4,
      unhealthy_max: 0.8,
      very_unhealthy_max: 1.5,
      hazardous_min: 1.5,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // HCHO thresholds (mg/m³)
    {
      id: 'threshold-hcho-001',
      sensor_type: 'hcho',
      unit: 'mg/m³',
      region: 'UAE',
      good_max: 0.08,
      moderate_max: 0.1,
      unhealthy_sensitive_max: 0.2,
      unhealthy_max: 0.4,
      very_unhealthy_max: 1.0,
      hazardous_min: 1.0,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    }
  ];
};

export const mockSettings = {
  generateEmailSettings,
  generateAirQualityThresholds
};