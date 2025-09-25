// --- Device & Location Data ---

export interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  address?: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'air-quality';
  location: Location;
  isOnline: boolean;
  lastSeen: string; // ISO timestamp
  batteryLevel?: number; // 0-100
  signalStrength?: number; // dBm
  version: string;
  sensors: string[]; // ['pm25', 'pm10', 'co2', 'hcho', 'voc', 'nox']
}

// --- Sensor Data - ROSAIQ ULTRADETEKT 03M ---

export type Metric = 'pm03' | 'pm1' | 'pm25' | 'pm5' | 'pm10' | 'co2' | 'hcho' | 'voc' | 'nox' | 'temperature' | 'humidity' | 'pressure' | 'co' | 'no2' | 'o3' | 'so2' | 'noise' | 'radiation' | 'wind_speed' | 'wind_direction' | 'iaqi';
export type AqiMetric = 'pm25_aqi' | 'pm10_aqi' | 'co_aqi' | 'no2_aqi' | 'o3_aqi' | 'so2_aqi';

export interface SensorReading {
    metric: Metric | AqiMetric;
    value: number;
    unit: string;
    quality?: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
    timestamp: string; // ISO timestamp
}

export interface RealtimeData {
  deviceId: string;
  timestamp: string; // ISO timestamp
  readings: SensorReading[];
  aqi: number;
  overallQuality: AqiLevel;
}

export interface HistoricalDataPoint {
    timestamp: string; // ISO timestamp
    value: number;
    quality?: string;
}

export interface HistoricalData {
    deviceId: string;
    metric: Metric | AqiMetric;
    timeRange: string; // e.g., "24h", "7d", "30d"
    data: HistoricalDataPoint[];
}

// --- Chart & Display ---

export type ChartAggregation = '1h' | '8h' | '1d';

// --- Settings & Quality ---

export interface Thresholds {
    good: number;
    moderate: number;
    poor: number;
}

export type AqiLevel = 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

export interface UAEThresholds {
  good: [number, number];
  moderate: [number, number]; 
  unhealthySensitive: [number, number];
  unhealthy: [number, number];
  veryUnhealthy: [number, number];
  hazardous: [number, number];
}

export type UnitSystem = 'metric' | 'imperial';

// [Concentration Low, Concentration High, AQI Low, AQI High]
export type Breakpoint = [number, number, number, number];
export type BreakpointTable = Breakpoint[];


// --- Alerts ---

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'device-offline' | 'low-battery' | 'threshold-exceeded';
export type AlertStatus = 'active' | 'resolved';

export interface Alert {
    id: string;
    deviceId: string;
    deviceName: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    timestamp: string; // ISO timestamp
    status: AlertStatus;
    resolvedAt?: string; // ISO timestamp
    acknowledgedAt?: string; // ISO timestamp
}

// --- Reports ---

export interface ReportData {
    generatedAt: string;
    period: string;
    devices: {
        total: number;
        online: number;
        offline: number;
    };
    measurements: {
        total: number;
        averagePerHour: number;
    };
    alerts: {
        total: number;
        critical: number;
        warning: number;
        info: number;
    };
    quality: {
        averageAqi: number;
        predominantLevel: AqiLevel;
        trends: {
            pm25: 'improving' | 'stable' | 'worsening';
            pm10: 'improving' | 'stable' | 'worsening';
            overall: 'improving' | 'stable' | 'worsening';
        };
    };
    topDevices: {
        deviceId: string;
        deviceName: string;
        location: string;
        averageAqi: number;
        measurements: number;
    }[];
    hourlyAverages: {
        hour: number;
        pm25: number;
        pm10: number;
        aqi: number;
    }[];
}

// --- Well Report (Filter Performance) ---

export interface FilterPerformanceData {
    timestamp: string;
    pressureDrop: number; // Pa
    flowRate: number; // m³/h
    efficiency: number; // %
    powerConsumption: number; // kW
    maintenanceScore: number; // 0-100
}

export interface WellReportData {
    generatedAt: string;
    filterId: string;
    filterName: string;
    installationDate: string;
    lastMaintenance: string;
    nextMaintenanceDue: string;
    currentStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    performanceHistory: FilterPerformanceData[];
    totalCost: number;
    energyCostPerDay: number;
    replacementCostSavings: number;
    recommendations: string[];
    summary: string;
}