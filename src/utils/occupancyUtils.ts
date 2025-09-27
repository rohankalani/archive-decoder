/**
 * Enhanced occupancy detection utilities that account for CO2 decay over time
 */

export interface OccupancyReading {
  timestamp: Date;
  co2: number;
  temperature?: number;
  humidity?: number;
}

export interface OccupancyResult {
  estimatedOccupancy: number;
  confidence: number;
  isOccupied: boolean;
  co2Trend: 'rising' | 'falling' | 'stable';
}

// CO2 decay constants
const CO2_AMBIENT = 400; // Outdoor CO2 baseline (ppm)
const CO2_PER_PERSON = 25000; // CO2 production per person (ml/h)
const ROOM_VOLUME = 200; // Average classroom volume (m³)
const VENTILATION_RATE = 0.5; // Air changes per hour
const DECAY_CONSTANT = Math.log(2) / (VENTILATION_RATE * 60); // Per minute

/**
 * Calculate expected CO2 decay over time when room becomes unoccupied
 */
export function calculateCO2Decay(initialCO2: number, timeElapsed: number): number {
  // Exponential decay formula: C(t) = C_ambient + (C_initial - C_ambient) * e^(-λt)
  const decayedCO2 = CO2_AMBIENT + (initialCO2 - CO2_AMBIENT) * Math.exp(-DECAY_CONSTANT * timeElapsed);
  return Math.max(CO2_AMBIENT, decayedCO2);
}

/**
 * Enhanced occupancy detection with CO2 decay modeling
 */
export function detectOccupancy(readings: OccupancyReading[]): OccupancyResult {
  if (readings.length < 2) {
    return {
      estimatedOccupancy: 0,
      confidence: 0,
      isOccupied: false,
      co2Trend: 'stable'
    };
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const latestReading = sortedReadings[sortedReadings.length - 1];
  const previousReading = sortedReadings[sortedReadings.length - 2];
  
  // Calculate CO2 trend
  const co2Change = latestReading.co2 - previousReading.co2;
  const timeElapsed = (latestReading.timestamp.getTime() - previousReading.timestamp.getTime()) / (1000 * 60); // minutes
  
  let co2Trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (Math.abs(co2Change) > 10) { // Threshold for significant change
    co2Trend = co2Change > 0 ? 'rising' : 'falling';
  }

  // If CO2 is falling, check if it's consistent with natural decay
  if (co2Trend === 'falling') {
    const expectedDecayedCO2 = calculateCO2Decay(previousReading.co2, timeElapsed);
    const actualDecayRate = (previousReading.co2 - latestReading.co2) / timeElapsed;
    const expectedDecayRate = (previousReading.co2 - expectedDecayedCO2) / timeElapsed;
    
    // If actual decay is faster than expected, likely no occupants
    // If slower, there might still be occupants
    const decayRatio = actualDecayRate / Math.max(expectedDecayRate, 1);
    
    if (decayRatio > 0.8) {
      // CO2 is decaying naturally, adjust occupancy estimate downward
      const baseOccupancy = Math.max(0, (latestReading.co2 - CO2_AMBIENT) / 150); // 150ppm per person baseline
      const adjustedOccupancy = baseOccupancy * (1 - decayRatio * 0.5);
      
      return {
        estimatedOccupancy: Math.max(0, Math.round(adjustedOccupancy)),
        confidence: 0.8,
        isOccupied: adjustedOccupancy > 0.5,
        co2Trend
      };
    }
  }

  // Standard occupancy calculation for rising or stable CO2
  const currentHour = latestReading.timestamp.getHours();
  const isOperatingHours = currentHour >= 8 && currentHour <= 18;
  
  // Enhanced occupancy calculation
  let estimatedOccupancy = 0;
  let confidence = 0.5;

  if (latestReading.co2 > CO2_AMBIENT + 50) { // Significant elevation above baseline
    // Use multiple factors for occupancy estimation
    const co2Factor = Math.max(0, (latestReading.co2 - CO2_AMBIENT) / 150); // ~150ppm per person
    
    // Time-based adjustment
    const timeMultiplier = isOperatingHours ? 1.0 : 0.3; // Reduce confidence outside hours
    
    // Trend-based adjustment
    const trendMultiplier = co2Trend === 'rising' ? 1.2 : 
                           co2Trend === 'falling' ? 0.7 : 1.0;
    
    estimatedOccupancy = co2Factor * timeMultiplier * trendMultiplier;
    
    // Confidence based on CO2 level and trend consistency
    confidence = Math.min(0.95, 0.5 + (latestReading.co2 - CO2_AMBIENT) / 1000);
    if (co2Trend === 'rising' && isOperatingHours) confidence *= 1.2;
    if (co2Trend === 'falling' && !isOperatingHours) confidence *= 1.1;
  }

  return {
    estimatedOccupancy: Math.max(0, Math.round(estimatedOccupancy)),
    confidence: Math.min(0.95, confidence),
    isOccupied: estimatedOccupancy > 0.5,
    co2Trend
  };
}

/**
 * Calculate room occupancy percentage during operating hours
 * with enhanced CO2 decay modeling
 */
export function calculateEnhancedOccupancy(readings: OccupancyReading[], roomCapacity: number = 30): number {
  if (readings.length === 0) return 0;

  const operatingHourReadings = readings.filter(reading => {
    const hour = reading.timestamp.getHours();
    return hour >= 8 && hour <= 18;
  });

  if (operatingHourReadings.length === 0) return 0;

  let totalOccupancy = 0;
  let validReadings = 0;

  // Process readings in chronological order to track decay
  const sortedReadings = operatingHourReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 0; i < sortedReadings.length; i++) {
    const currentBatch = sortedReadings.slice(Math.max(0, i - 2), i + 1); // Use last 3 readings for context
    const occupancyResult = detectOccupancy(currentBatch);
    
    if (occupancyResult.confidence > 0.3) {
      totalOccupancy += occupancyResult.estimatedOccupancy;
      validReadings++;
    }
  }

  if (validReadings === 0) return 0;

  const averageOccupancy = totalOccupancy / validReadings;
  const occupancyPercentage = (averageOccupancy / roomCapacity) * 100;
  
  return Math.min(100, Math.max(0, occupancyPercentage));
}