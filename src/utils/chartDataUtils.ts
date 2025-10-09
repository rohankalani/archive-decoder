import { AveragedSensorData, TimePeriod } from '@/hooks/useHistoricalSensorData';

export interface SensorDataPoint {
  timestamp: string;
  pm25?: number;
  pm10?: number;
  pm03?: number;
  pm1?: number;
  pm5?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  hcho?: number;
  nox?: number;
  no2?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  pc10?: number;
}

export interface ProcessedChartData {
  time: string;
  overallAqi: number;
  pm25Aqi: number;
  pm10Aqi: number;
  hchoAqi: number;
  vocAqi: number;
  noxAqi: number;
  temperature: number;
  humidity: number;
  co2: number;
  voc: number;
  hcho: number;
  nox: number;
  pm25: number;
  pm10: number;
  pm03: number;
  pm1: number;
  pm5: number;
  pc03: number;
  pc05: number;
  pc1: number;
  pc25: number;
  pc5: number;
  pc10: number;
}

// ROSAIQ Arduino AQI Breakpoints - Exact values from firmware
const AQI_RANGES = {
  R1: { low: 0, high: 50 },
  R2: { low: 51, high: 100 },
  R3: { low: 101, high: 150 },
  R4: { low: 151, high: 200 },
  R5: { low: 201, high: 300 },
  R6: { low: 301, high: 500 }
};

const PM25_RANGES = {
  R1: { low: 0, high: 50.4 },
  R2: { low: 50.5, high: 60.4 },
  R3: { low: 60.5, high: 75.4 },
  R4: { low: 75.5, high: 150.4 },
  R5: { low: 150.5, high: 250.4 },
  R6: { low: 250.5, high: 500.4 }
};

const PM10_RANGES = {
  R1: { low: 0, high: 75.0 },
  R2: { low: 75.1, high: 150.0 },
  R3: { low: 150.1, high: 250.0 },
  R4: { low: 250.1, high: 350.0 },
  R5: { low: 350.1, high: 420.0 },
  R6: { low: 420.1, high: 600.0 }
};

const HCHO_RANGES = {
  R1: { low: 0, high: 30.0 },
  R2: { low: 30.1, high: 80.0 },
  R3: { low: 80.1, high: 120.0 },
  R4: { low: 120.1, high: 200.0 },
  R5: { low: 200.1, high: 300.0 },
  R6: { low: 300.1, high: 500.0 }
};

const VOC_RANGES = {
  R1: { low: 0, high: 100.0 },
  R2: { low: 100.1, high: 200.0 },
  R3: { low: 200.1, high: 300.0 },
  R4: { low: 300.1, high: 400.0 },
  R5: { low: 400.1, high: 450.0 },
  R6: { low: 450.1, high: 500.0 }
};

const NOX_RANGES = {
  R1: { low: 0, high: 100.0 },
  R2: { low: 100.1, high: 200.0 },
  R3: { low: 200.1, high: 300.0 },
  R4: { low: 300.1, high: 400.0 },
  R5: { low: 400.1, high: 450.0 },
  R6: { low: 450.1, high: 500.0 }
};

// AQI color function based on ROSAIQ 6-level system
export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return 'hsl(120, 85%, 35%)';        // Good - Darker Green
  if (aqi <= 100) return 'hsl(45, 100%, 40%)';      // Moderate - Darker Yellow/Gold
  if (aqi <= 150) return 'hsl(30, 100%, 45%)';      // Unhealthy for Sensitive - Darker Orange
  if (aqi <= 200) return 'hsl(0, 100%, 45%)';       // Unhealthy - Darker Red
  if (aqi <= 300) return 'hsl(280, 90%, 35%)';      // Very Unhealthy - Darker Purple
  return 'hsl(320, 100%, 25%)';                     // Hazardous - Maroon
}

// Arduino AQI calculation formula matching device firmware
function calculateAqi(reading: number, aqiLow: number, aqiHigh: number, bpLow: number, bpHigh: number): number {
  const aqiIndex = ((aqiHigh - aqiLow) / (bpHigh - bpLow)) * (reading - bpLow) + aqiLow;
  return Math.min(500, Math.round(aqiIndex));
}

export function calculatePM25Aqi(value: number): number {
  if (value < PM25_RANGES.R2.low) return calculateAqi(value, AQI_RANGES.R1.low, AQI_RANGES.R1.high, PM25_RANGES.R1.low, PM25_RANGES.R1.high);
  if (value < PM25_RANGES.R3.low) return calculateAqi(value, AQI_RANGES.R2.low, AQI_RANGES.R2.high, PM25_RANGES.R2.low, PM25_RANGES.R2.high);
  if (value < PM25_RANGES.R4.low) return calculateAqi(value, AQI_RANGES.R3.low, AQI_RANGES.R3.high, PM25_RANGES.R3.low, PM25_RANGES.R3.high);
  if (value < PM25_RANGES.R5.low) return calculateAqi(value, AQI_RANGES.R4.low, AQI_RANGES.R4.high, PM25_RANGES.R4.low, PM25_RANGES.R4.high);
  if (value < PM25_RANGES.R6.low) return calculateAqi(value, AQI_RANGES.R5.low, AQI_RANGES.R5.high, PM25_RANGES.R5.low, PM25_RANGES.R5.high);
  return calculateAqi(value, AQI_RANGES.R6.low, AQI_RANGES.R6.high, PM25_RANGES.R6.low, PM25_RANGES.R6.high);
}

export function calculatePM10Aqi(value: number): number {
  if (value < PM10_RANGES.R2.low) return calculateAqi(value, AQI_RANGES.R1.low, AQI_RANGES.R1.high, PM10_RANGES.R1.low, PM10_RANGES.R1.high);
  if (value < PM10_RANGES.R3.low) return calculateAqi(value, AQI_RANGES.R2.low, AQI_RANGES.R2.high, PM10_RANGES.R2.low, PM10_RANGES.R2.high);
  if (value < PM10_RANGES.R4.low) return calculateAqi(value, AQI_RANGES.R3.low, AQI_RANGES.R3.high, PM10_RANGES.R3.low, PM10_RANGES.R3.high);
  if (value < PM10_RANGES.R5.low) return calculateAqi(value, AQI_RANGES.R4.low, AQI_RANGES.R4.high, PM10_RANGES.R4.low, PM10_RANGES.R4.high);
  if (value < PM10_RANGES.R6.low) return calculateAqi(value, AQI_RANGES.R5.low, AQI_RANGES.R5.high, PM10_RANGES.R5.low, PM10_RANGES.R5.high);
  return calculateAqi(value, AQI_RANGES.R6.low, AQI_RANGES.R6.high, PM10_RANGES.R6.low, PM10_RANGES.R6.high);
}

export function calculateHCHOAqi(value: number): number {
  if (value < HCHO_RANGES.R2.low) return calculateAqi(value, AQI_RANGES.R1.low, AQI_RANGES.R1.high, HCHO_RANGES.R1.low, HCHO_RANGES.R1.high);
  if (value < HCHO_RANGES.R3.low) return calculateAqi(value, AQI_RANGES.R2.low, AQI_RANGES.R2.high, HCHO_RANGES.R2.low, HCHO_RANGES.R2.high);
  if (value < HCHO_RANGES.R4.low) return calculateAqi(value, AQI_RANGES.R3.low, AQI_RANGES.R3.high, HCHO_RANGES.R3.low, HCHO_RANGES.R3.high);
  if (value < HCHO_RANGES.R5.low) return calculateAqi(value, AQI_RANGES.R4.low, AQI_RANGES.R4.high, HCHO_RANGES.R4.low, HCHO_RANGES.R4.high);
  if (value < HCHO_RANGES.R6.low) return calculateAqi(value, AQI_RANGES.R5.low, AQI_RANGES.R5.high, HCHO_RANGES.R5.low, HCHO_RANGES.R5.high);
  return calculateAqi(value, AQI_RANGES.R6.low, AQI_RANGES.R6.high, HCHO_RANGES.R6.low, HCHO_RANGES.R6.high);
}

export function calculateVOCAqi(value: number): number {
  if (value < VOC_RANGES.R2.low) return calculateAqi(value, AQI_RANGES.R1.low, AQI_RANGES.R1.high, VOC_RANGES.R1.low, VOC_RANGES.R1.high);
  if (value < VOC_RANGES.R3.low) return calculateAqi(value, AQI_RANGES.R2.low, AQI_RANGES.R2.high, VOC_RANGES.R2.low, VOC_RANGES.R2.high);
  if (value < VOC_RANGES.R4.low) return calculateAqi(value, AQI_RANGES.R3.low, AQI_RANGES.R3.high, VOC_RANGES.R3.low, VOC_RANGES.R3.high);
  if (value < VOC_RANGES.R5.low) return calculateAqi(value, AQI_RANGES.R4.low, AQI_RANGES.R4.high, VOC_RANGES.R4.low, VOC_RANGES.R4.high);
  if (value < VOC_RANGES.R6.low) return calculateAqi(value, AQI_RANGES.R5.low, AQI_RANGES.R5.high, VOC_RANGES.R5.low, VOC_RANGES.R5.high);
  return calculateAqi(value, AQI_RANGES.R6.low, AQI_RANGES.R6.high, VOC_RANGES.R6.low, VOC_RANGES.R6.high);
}

export function calculateNOxAqi(value: number): number {
  if (value < NOX_RANGES.R2.low) return calculateAqi(value, AQI_RANGES.R1.low, AQI_RANGES.R1.high, NOX_RANGES.R1.low, NOX_RANGES.R1.high);
  if (value < NOX_RANGES.R3.low) return calculateAqi(value, AQI_RANGES.R2.low, AQI_RANGES.R2.high, NOX_RANGES.R2.low, NOX_RANGES.R2.high);
  if (value < NOX_RANGES.R4.low) return calculateAqi(value, AQI_RANGES.R3.low, AQI_RANGES.R3.high, NOX_RANGES.R3.low, NOX_RANGES.R3.high);
  if (value < NOX_RANGES.R5.low) return calculateAqi(value, AQI_RANGES.R4.low, AQI_RANGES.R4.high, NOX_RANGES.R4.low, NOX_RANGES.R4.high);
  if (value < NOX_RANGES.R6.low) return calculateAqi(value, AQI_RANGES.R5.low, AQI_RANGES.R5.high, NOX_RANGES.R5.low, NOX_RANGES.R5.high);
  return calculateAqi(value, AQI_RANGES.R6.low, AQI_RANGES.R6.high, NOX_RANGES.R6.low, NOX_RANGES.R6.high);
}

// Deterministic variation function using timestamp as seed
function getDeterministicVariation(timestamp: string, baseValue: number, variationPercent: number): number {
  // Create a simple hash from timestamp for deterministic randomness
  let hash = 0;
  for (let i = 0; i < timestamp.length; i++) {
    const char = timestamp.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Normalize hash to [-1, 1] range
  const normalizedHash = (hash % 2001) / 1000 - 1;
  
  return baseValue + (normalizedHash * baseValue * variationPercent);
}

export function generateDeterministicSensorData(
  historicalData: AveragedSensorData[],
  deviceSensorData: any,
  timePeriod: TimePeriod
): ProcessedChartData[] {
  if (!historicalData.length) return [];

  // Base values from current device readings
  const basePM25 = deviceSensorData.pm25 || 19.7;
  const basePM10 = deviceSensorData.pm10 || 32.1;
  const baseVOC = deviceSensorData.voc || 75;
  const baseHCHO = deviceSensorData.hcho || 20;
  const baseNOx = deviceSensorData.nox || 50;
  const baseTemp = deviceSensorData.temperature || 25.2;
  const baseHumidity = deviceSensorData.humidity || 55.9;
  const baseCO2 = deviceSensorData.co2 || 442;

  return historicalData.map((item) => {
    const time = new Date(item.timestamp);
    
    // Generate appropriate time labels based on period
    let timeLabel: string;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    
    switch (timePeriod) {
      case '10min':
        // Format: HH:MM:SS
        timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
        break;
      case '1hr':
        // Format: HH:MM (24-hour format)
        timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        break;
      case '8hr':
        // Format: MMM DD, HH:00
        const month = time.toLocaleDateString('en-US', { month: 'short' });
        const day = time.getDate();
        timeLabel = `${month} ${day}, ${hours.toString().padStart(2, '0')}:00`;
        break;
      case '24hr':
        // Format: MMM DD
        timeLabel = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      default:
        timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Use actual data if available, otherwise generate deterministic variations
    const pm25Value = item.pm25 ?? getDeterministicVariation(item.timestamp, basePM25, 0.2);
    const pm10Value = item.pm10 ?? getDeterministicVariation(item.timestamp, basePM10, 0.2);
    const vocValue = item.voc ?? getDeterministicVariation(item.timestamp, baseVOC, 0.3);
    const hchoValue = item.hcho ?? getDeterministicVariation(item.timestamp, baseHCHO, 0.4);
    const noxValue = item.nox ?? getDeterministicVariation(item.timestamp, baseNOx, 0.3);
    const tempValue = item.temperature ?? getDeterministicVariation(item.timestamp, baseTemp, 0.1);
    const humidityValue = item.humidity ?? getDeterministicVariation(item.timestamp, baseHumidity, 0.15);
    const co2Value = item.co2 ?? getDeterministicVariation(item.timestamp, baseCO2, 0.2);

    // Calculate AQI values using proper breakpoints
    const pm25Aqi = calculatePM25Aqi(pm25Value);
    const pm10Aqi = calculatePM10Aqi(pm10Value);
    const hchoAqi = calculateHCHOAqi(hchoValue);
    const vocAqi = calculateVOCAqi(vocValue);
    const noxAqi = calculateNOxAqi(noxValue);
    
    // Arduino MAX_AQI implementation - highest individual pollutant AQI
    const overallAqi = Math.max(pm25Aqi, pm10Aqi, hchoAqi, vocAqi, noxAqi);

    // Particle data - use actual data if available, otherwise generate deterministically
    const basePM03 = deviceSensorData.pm03 || 8;
    const basePM1 = deviceSensorData.pm1 || 12;
    const basePM5 = deviceSensorData.pm5 || 18;
    const basePC03 = deviceSensorData.pc03 || 25000;
    const basePC05 = deviceSensorData.pc05 || 12000;
    const basePC1 = deviceSensorData.pc1 || 5000;
    const basePC25 = deviceSensorData.pc25 || 1200;
    const basePC5 = deviceSensorData.pc5 || 150;
    const basePC10 = deviceSensorData.pc10 || 30;

    const pm03Value = item.pm03 ?? getDeterministicVariation(item.timestamp, basePM03, 0.2);
    const pm1Value = item.pm1 ?? getDeterministicVariation(item.timestamp, basePM1, 0.2);
    const pm5Value = item.pm5 ?? getDeterministicVariation(item.timestamp, basePM5, 0.2);
    const pc03Value = item.pc03 ?? getDeterministicVariation(item.timestamp, basePC03, 0.3);
    const pc05Value = item.pc05 ?? getDeterministicVariation(item.timestamp, basePC05, 0.3);
    const pc1Value = item.pc1 ?? getDeterministicVariation(item.timestamp, basePC1, 0.3);
    const pc25Value = item.pc25 ?? getDeterministicVariation(item.timestamp, basePC25, 0.3);
    const pc5Value = item.pc5 ?? getDeterministicVariation(item.timestamp, basePC5, 0.3);
    const pc10Value = item.pc10 ?? getDeterministicVariation(item.timestamp, basePC10, 0.3);

    return {
      time: timeLabel,
      overallAqi,
      pm25Aqi,
      pm10Aqi,
      hchoAqi,
      vocAqi,
      noxAqi,
      temperature: Math.max(0, tempValue),
      humidity: Math.max(0, Math.min(100, humidityValue)),
      co2: Math.max(400, co2Value),
      voc: Math.max(0, vocValue),
      hcho: Math.max(0, hchoValue),
      nox: Math.max(0, noxValue),
      pm25: Math.max(0, pm25Value),
      pm10: Math.max(0, pm10Value),
      pm03: Math.max(0, pm03Value),
      pm1: Math.max(0, pm1Value),
      pm5: Math.max(0, pm5Value),
      pc03: Math.max(0, pc03Value),
      pc05: Math.max(0, pc05Value),
      pc1: Math.max(0, pc1Value),
      pc25: Math.max(0, pc25Value),
      pc5: Math.max(0, pc5Value),
      pc10: Math.max(0, pc10Value)
    };
  });
}

export function calculateAverageAqiData(processedData: ProcessedChartData[]) {
  if (!processedData.length) {
    return {
      pm25Aqi: 0,
      pm10Aqi: 0,
      hchoAqi: 0,
      vocAqi: 0,
      noxAqi: 0,
      count: 0
    };
  }

  const totals = processedData.reduce((acc, item) => {
    acc.pm25Aqi += item.pm25Aqi;
    acc.pm10Aqi += item.pm10Aqi;
    acc.hchoAqi += item.hchoAqi;
    acc.vocAqi += item.vocAqi;
    acc.noxAqi += item.noxAqi;
    acc.count++;
    return acc;
  }, { pm25Aqi: 0, pm10Aqi: 0, hchoAqi: 0, vocAqi: 0, noxAqi: 0, count: 0 });

  return totals;
}