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

// AQI Breakpoints following EPA standards
const PM25_BREAKPOINTS = [
  { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
  { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
  { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
  { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
  { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
  { low: 250.5, high: 350.4, aqiLow: 301, aqiHigh: 400 },
  { low: 350.5, high: 500.4, aqiLow: 401, aqiHigh: 500 }
];

const PM10_BREAKPOINTS = [
  { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
  { low: 55, high: 154, aqiLow: 51, aqiHigh: 100 },
  { low: 155, high: 254, aqiLow: 101, aqiHigh: 150 },
  { low: 255, high: 354, aqiLow: 151, aqiHigh: 200 },
  { low: 355, high: 424, aqiLow: 201, aqiHigh: 300 },
  { low: 425, high: 504, aqiLow: 301, aqiHigh: 400 },
  { low: 505, high: 604, aqiLow: 401, aqiHigh: 500 }
];

// Simplified breakpoints for other pollutants
const VOC_BREAKPOINTS = [
  { low: 0, high: 100, aqiLow: 0, aqiHigh: 50 },
  { low: 101, high: 200, aqiLow: 51, aqiHigh: 100 },
  { low: 201, high: 400, aqiLow: 101, aqiHigh: 150 },
  { low: 401, high: 800, aqiLow: 151, aqiHigh: 200 },
  { low: 801, high: 1200, aqiLow: 201, aqiHigh: 300 }
];

const HCHO_BREAKPOINTS = [
  { low: 0, high: 10, aqiLow: 0, aqiHigh: 50 },
  { low: 11, high: 30, aqiLow: 51, aqiHigh: 100 },
  { low: 31, high: 60, aqiLow: 101, aqiHigh: 150 },
  { low: 61, high: 120, aqiLow: 151, aqiHigh: 200 },
  { low: 121, high: 200, aqiLow: 201, aqiHigh: 300 }
];

const NOX_BREAKPOINTS = [
  { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
  { low: 51, high: 100, aqiLow: 51, aqiHigh: 100 },
  { low: 101, high: 200, aqiLow: 101, aqiHigh: 150 },
  { low: 201, high: 400, aqiLow: 151, aqiHigh: 200 },
  { low: 401, high: 800, aqiLow: 201, aqiHigh: 300 }
];

function calculateAqiFromBreakpoints(concentration: number, breakpoints: typeof PM25_BREAKPOINTS): number {
  if (concentration <= 0) return 0;
  
  for (const bp of breakpoints) {
    if (concentration >= bp.low && concentration <= bp.high) {
      return Math.round(
        ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (concentration - bp.low) + bp.aqiLow
      );
    }
  }
  
  // If concentration exceeds all breakpoints, return max AQI
  return 500;
}

export function calculatePM25Aqi(pm25: number): number {
  return calculateAqiFromBreakpoints(pm25, PM25_BREAKPOINTS);
}

export function calculatePM10Aqi(pm10: number): number {
  return calculateAqiFromBreakpoints(pm10, PM10_BREAKPOINTS);
}

export function calculateVOCAqi(voc: number): number {
  return calculateAqiFromBreakpoints(voc, VOC_BREAKPOINTS);
}

export function calculateHCHOAqi(hcho: number): number {
  return calculateAqiFromBreakpoints(hcho, HCHO_BREAKPOINTS);
}

export function calculateNOxAqi(nox: number): number {
  return calculateAqiFromBreakpoints(nox, NOX_BREAKPOINTS);
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
    const timeLabel = time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
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
    
    const overallAqi = Math.max(pm25Aqi, pm10Aqi, hchoAqi, vocAqi, noxAqi);

    // Generate particle data deterministically
    const basePM03 = deviceSensorData.pm03 || 8;
    const basePM1 = deviceSensorData.pm1 || 12;
    const basePM5 = deviceSensorData.pm5 || 18;
    const basePC03 = deviceSensorData.pc03 || 25000;
    const basePC05 = deviceSensorData.pc05 || 12000;
    const basePC1 = deviceSensorData.pc1 || 5000;
    const basePC25 = deviceSensorData.pc25 || 1200;
    const basePC5 = deviceSensorData.pc5 || 150;
    const basePC10 = deviceSensorData.pc10 || 30;

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
      pm03: Math.max(0, getDeterministicVariation(item.timestamp, basePM03, 0.2)),
      pm1: Math.max(0, getDeterministicVariation(item.timestamp, basePM1, 0.2)),
      pm5: Math.max(0, getDeterministicVariation(item.timestamp, basePM5, 0.2)),
      pc03: Math.max(0, getDeterministicVariation(item.timestamp, basePC03, 0.3)),
      pc05: Math.max(0, getDeterministicVariation(item.timestamp, basePC05, 0.3)),
      pc1: Math.max(0, getDeterministicVariation(item.timestamp, basePC1, 0.3)),
      pc25: Math.max(0, getDeterministicVariation(item.timestamp, basePC25, 0.3)),
      pc5: Math.max(0, getDeterministicVariation(item.timestamp, basePC5, 0.3)),
      pc10: Math.max(0, getDeterministicVariation(item.timestamp, basePC10, 0.3))
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