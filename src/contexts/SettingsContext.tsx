import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AqiLevel, Metric, Thresholds, UnitSystem, BreakpointTable } from '@/types';

// AQI Breakpoint Tables - Arduino Constants
const AQI_RANGES = {
  AQI_R1_LOW: 0, AQI_R1_HIGH: 50,
  AQI_R2_LOW: 51, AQI_R2_HIGH: 100,
  AQI_R3_LOW: 101, AQI_R3_HIGH: 150,
  AQI_R4_LOW: 151, AQI_R4_HIGH: 200,
  AQI_R5_LOW: 201, AQI_R5_HIGH: 300,
  AQI_R6_LOW: 301, AQI_R6_HIGH: 500
};

const PM25_RANGES = {
  PM25_R1_LOW: 0, PM25_R1_HIGH: 12.0,
  PM25_R2_LOW: 12.1, PM25_R2_HIGH: 35.4,
  PM25_R3_LOW: 35.5, PM25_R3_HIGH: 55.4,
  PM25_R4_LOW: 55.5, PM25_R4_HIGH: 150.4,
  PM25_R5_LOW: 150.5, PM25_R5_HIGH: 250.4,
  PM25_R6_LOW: 250.5, PM25_R6_HIGH: 350.4
};

const PM10_RANGES = {
  PM10_R1_LOW: 0, PM10_R1_HIGH: 54,
  PM10_R2_LOW: 55, PM10_R2_HIGH: 154,
  PM10_R3_LOW: 155, PM10_R3_HIGH: 254,
  PM10_R4_LOW: 255, PM10_R4_HIGH: 354,
  PM10_R5_LOW: 355, PM10_R5_HIGH: 424,
  PM10_R6_LOW: 425, PM10_R6_HIGH: 604
};

const HCHO_RANGES = {
  HCHO_R1_LOW: 0, HCHO_R1_HIGH: 30,
  HCHO_R2_LOW: 31, HCHO_R2_HIGH: 50,
  HCHO_R3_LOW: 51, HCHO_R3_HIGH: 100,
  HCHO_R4_LOW: 101, HCHO_R4_HIGH: 200,
  HCHO_R5_LOW: 201, HCHO_R5_HIGH: 300,
  HCHO_R6_LOW: 301, HCHO_R6_HIGH: 500
};

const VOC_RANGES = {
  VOC_R1_LOW: 0, VOC_R1_HIGH: 50,
  VOC_R2_LOW: 51, VOC_R2_HIGH: 100,
  VOC_R3_LOW: 101, VOC_R3_HIGH: 150,
  VOC_R4_LOW: 151, VOC_R4_HIGH: 200,
  VOC_R5_LOW: 201, VOC_R5_HIGH: 300,
  VOC_R6_LOW: 301, VOC_R6_HIGH: 500
};

const NOX_RANGES = {
  NOx_R1_LOW: 0, NOx_R1_HIGH: 50,
  NOx_R2_LOW: 51, NOx_R2_HIGH: 100,
  NOx_R3_LOW: 101, NOx_R3_HIGH: 150,
  NOx_R4_LOW: 151, NOx_R4_HIGH: 200,
  NOx_R5_LOW: 201, NOx_R5_HIGH: 300,
  NOx_R6_LOW: 301, NOx_R6_HIGH: 500
};

// Default UAE thresholds for ROSAIQ device parameters
const defaultThresholds: Record<Metric, Thresholds> = {
    pm03: { good: 0, moderate: 50000, poor: 100000 },
    pm1: { good: 0, moderate: 30000, poor: 60000 },
    pm25: { good: 50.4, moderate: 60.4, poor: 75.4 },
    pm5: { good: 0, moderate: 100, poor: 200 },
    pm10: { good: 75.0, moderate: 150.0, poor: 250.0 },
    co2: { good: 700, moderate: 1000, poor: 1500 },
    hcho: { good: 30.0, moderate: 80.0, poor: 120.0 },
    voc: { good: 100.0, moderate: 200.0, poor: 300.0 },
    nox: { good: 100.0, moderate: 200.0, poor: 300.0 },
    temperature: { good: 18, moderate: 25, poor: 35 },
    humidity: { good: 40, moderate: 60, poor: 80 },
    pressure: { good: 1000, moderate: 1020, poor: 1040 },
    co: { good: 4.4, moderate: 9.4, poor: 12.4 },
    no2: { good: 53, moderate: 100, poor: 360 },
    o3: { good: 54, moderate: 70, poor: 85 },
    so2: { good: 35, moderate: 75, poor: 185 },
    noise: { good: 40, moderate: 55, poor: 70 },
    radiation: { good: 0.1, moderate: 0.5, poor: 1.0 },
    wind_speed: { good: 5, moderate: 15, poor: 25 },
    wind_direction: { good: 0, moderate: 180, poor: 360 },
    iaqi: { good: 50, moderate: 100, poor: 150 }
};

interface SettingsContextType {
    thresholds: Record<Metric, Thresholds>;
    unitSystem: UnitSystem;
    updateThresholds: (newThresholds: Record<Metric, Thresholds>) => void;
    updateUnitSystem: (system: UnitSystem) => void;
    resetToDefaults: () => void;
    getMetricQuality: (metric: Metric, value: number) => string;
    getQualityFromAqi: (aqi: number) => AqiLevel;
    getQualityColor: (level: AqiLevel) => string;
    calculateAqi: (pollutant: string, concentration: number) => number;
    calculatePM25Aqi: (value: number) => number;
    calculatePM10Aqi: (value: number) => number;
    calculateHCHOAqi: (value: number) => number;
    calculateVOCAqi: (value: number) => number;
    calculateNOxAqi: (value: number) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [thresholds, setThresholds] = useState<Record<Metric, Thresholds>>(defaultThresholds);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    const updateThresholds = (newThresholds: Record<Metric, Thresholds>) => {
        setThresholds(newThresholds);
    };

    const updateUnitSystem = (system: UnitSystem) => {
        setUnitSystem(system);
    };

    const resetToDefaults = () => {
        setThresholds(defaultThresholds);
    };

    const getMetricQuality = (metric: Metric, value: number): string => {
        const threshold = thresholds[metric];
        if (!threshold) return 'Good';
        
        if (value >= threshold.poor) return 'Poor';
        if (value >= threshold.moderate) return 'Moderate';
        return 'Good';
    };

    const getQualityFromAqi = (aqi: number): AqiLevel => {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    };

    const getQualityColor = (level: AqiLevel): string => {
        switch (level) {
            case 'Good': return 'hsl(120, 100%, 40%)';
            case 'Moderate': return 'hsl(60, 100%, 50%)';
            case 'Unhealthy for Sensitive Groups': return 'hsl(30, 100%, 50%)';
            case 'Unhealthy': return 'hsl(0, 100%, 50%)';
            case 'Very Unhealthy': return 'hsl(300, 100%, 40%)';
            case 'Hazardous': return 'hsl(320, 100%, 25%)';
            default: return 'hsl(120, 100%, 40%)';
        }
    };

    // Arduino AQI calculation formula
    const calculateAqi = (reading: number, aqiLow: number, aqiHigh: number, bpLow: number, bpHigh: number): number => {
        const aqiIndex = ((aqiHigh - aqiLow) / (bpHigh - bpLow)) * (reading - bpLow) + aqiLow;
        return Math.min(500, Math.round(aqiIndex));
    };

    const calculatePM25Aqi = (value: number): number => {
        if (value < PM25_RANGES.PM25_R2_LOW) return calculateAqi(value, AQI_RANGES.AQI_R1_LOW, AQI_RANGES.AQI_R1_HIGH, PM25_RANGES.PM25_R1_LOW, PM25_RANGES.PM25_R1_HIGH);
        if (value < PM25_RANGES.PM25_R3_LOW) return calculateAqi(value, AQI_RANGES.AQI_R2_LOW, AQI_RANGES.AQI_R2_HIGH, PM25_RANGES.PM25_R2_LOW, PM25_RANGES.PM25_R2_HIGH);
        if (value < PM25_RANGES.PM25_R4_LOW) return calculateAqi(value, AQI_RANGES.AQI_R3_LOW, AQI_RANGES.AQI_R3_HIGH, PM25_RANGES.PM25_R3_LOW, PM25_RANGES.PM25_R3_HIGH);
        if (value < PM25_RANGES.PM25_R5_LOW) return calculateAqi(value, AQI_RANGES.AQI_R4_LOW, AQI_RANGES.AQI_R4_HIGH, PM25_RANGES.PM25_R4_LOW, PM25_RANGES.PM25_R4_HIGH);
        if (value < PM25_RANGES.PM25_R6_LOW) return calculateAqi(value, AQI_RANGES.AQI_R5_LOW, AQI_RANGES.AQI_R5_HIGH, PM25_RANGES.PM25_R5_LOW, PM25_RANGES.PM25_R5_HIGH);
        return calculateAqi(value, AQI_RANGES.AQI_R6_LOW, AQI_RANGES.AQI_R6_HIGH, PM25_RANGES.PM25_R6_LOW, PM25_RANGES.PM25_R6_HIGH);
    };

    const calculatePM10Aqi = (value: number): number => {
        if (value < PM10_RANGES.PM10_R2_LOW) return calculateAqi(value, AQI_RANGES.AQI_R1_LOW, AQI_RANGES.AQI_R1_HIGH, PM10_RANGES.PM10_R1_LOW, PM10_RANGES.PM10_R1_HIGH);
        if (value < PM10_RANGES.PM10_R3_LOW) return calculateAqi(value, AQI_RANGES.AQI_R2_LOW, AQI_RANGES.AQI_R2_HIGH, PM10_RANGES.PM10_R2_LOW, PM10_RANGES.PM10_R2_HIGH);
        if (value < PM10_RANGES.PM10_R4_LOW) return calculateAqi(value, AQI_RANGES.AQI_R3_LOW, AQI_RANGES.AQI_R3_HIGH, PM10_RANGES.PM10_R3_LOW, PM10_RANGES.PM10_R3_HIGH);
        if (value < PM10_RANGES.PM10_R5_LOW) return calculateAqi(value, AQI_RANGES.AQI_R4_LOW, AQI_RANGES.AQI_R4_HIGH, PM10_RANGES.PM10_R4_LOW, PM10_RANGES.PM10_R4_HIGH);
        if (value < PM10_RANGES.PM10_R6_LOW) return calculateAqi(value, AQI_RANGES.AQI_R5_LOW, AQI_RANGES.AQI_R5_HIGH, PM10_RANGES.PM10_R5_LOW, PM10_RANGES.PM10_R5_HIGH);
        return calculateAqi(value, AQI_RANGES.AQI_R6_LOW, AQI_RANGES.AQI_R6_HIGH, PM10_RANGES.PM10_R6_LOW, PM10_RANGES.PM10_R6_HIGH);
    };

    const calculateHCHOAqi = (value: number): number => {
        if (value < HCHO_RANGES.HCHO_R2_LOW) return calculateAqi(value, AQI_RANGES.AQI_R1_LOW, AQI_RANGES.AQI_R1_HIGH, HCHO_RANGES.HCHO_R1_LOW, HCHO_RANGES.HCHO_R1_HIGH);
        if (value < HCHO_RANGES.HCHO_R3_LOW) return calculateAqi(value, AQI_RANGES.AQI_R2_LOW, AQI_RANGES.AQI_R2_HIGH, HCHO_RANGES.HCHO_R2_LOW, HCHO_RANGES.HCHO_R2_HIGH);
        if (value < HCHO_RANGES.HCHO_R4_LOW) return calculateAqi(value, AQI_RANGES.AQI_R3_LOW, AQI_RANGES.AQI_R3_HIGH, HCHO_RANGES.HCHO_R3_LOW, HCHO_RANGES.HCHO_R3_HIGH);
        if (value < HCHO_RANGES.HCHO_R5_LOW) return calculateAqi(value, AQI_RANGES.AQI_R4_LOW, AQI_RANGES.AQI_R4_HIGH, HCHO_RANGES.HCHO_R4_LOW, HCHO_RANGES.HCHO_R4_HIGH);
        if (value < HCHO_RANGES.HCHO_R6_LOW) return calculateAqi(value, AQI_RANGES.AQI_R5_LOW, AQI_RANGES.AQI_R5_HIGH, HCHO_RANGES.HCHO_R5_LOW, HCHO_RANGES.HCHO_R5_HIGH);
        return calculateAqi(value, AQI_RANGES.AQI_R6_LOW, AQI_RANGES.AQI_R6_HIGH, HCHO_RANGES.HCHO_R6_LOW, HCHO_RANGES.HCHO_R6_HIGH);
    };

    const calculateVOCAqi = (value: number): number => {
        if (value < VOC_RANGES.VOC_R2_LOW) return calculateAqi(value, AQI_RANGES.AQI_R1_LOW, AQI_RANGES.AQI_R1_HIGH, VOC_RANGES.VOC_R1_LOW, VOC_RANGES.VOC_R1_HIGH);
        if (value < VOC_RANGES.VOC_R3_LOW) return calculateAqi(value, AQI_RANGES.AQI_R2_LOW, AQI_RANGES.AQI_R2_HIGH, VOC_RANGES.VOC_R2_LOW, VOC_RANGES.VOC_R2_HIGH);
        if (value < VOC_RANGES.VOC_R4_LOW) return calculateAqi(value, AQI_RANGES.AQI_R3_LOW, AQI_RANGES.AQI_R3_HIGH, VOC_RANGES.VOC_R3_LOW, VOC_RANGES.VOC_R3_HIGH);
        if (value < VOC_RANGES.VOC_R5_LOW) return calculateAqi(value, AQI_RANGES.AQI_R4_LOW, AQI_RANGES.AQI_R4_HIGH, VOC_RANGES.VOC_R4_LOW, VOC_RANGES.VOC_R4_HIGH);
        if (value < VOC_RANGES.VOC_R6_LOW) return calculateAqi(value, AQI_RANGES.AQI_R5_LOW, AQI_RANGES.AQI_R5_HIGH, VOC_RANGES.VOC_R5_LOW, VOC_RANGES.VOC_R5_HIGH);
        return calculateAqi(value, AQI_RANGES.AQI_R6_LOW, AQI_RANGES.AQI_R6_HIGH, VOC_RANGES.VOC_R6_LOW, VOC_RANGES.VOC_R6_HIGH);
    };

    const calculateNOxAqi = (value: number): number => {
        if (value < NOX_RANGES.NOx_R2_LOW) return calculateAqi(value, AQI_RANGES.AQI_R1_LOW, AQI_RANGES.AQI_R1_HIGH, NOX_RANGES.NOx_R1_LOW, NOX_RANGES.NOx_R1_HIGH);
        if (value < NOX_RANGES.NOx_R3_LOW) return calculateAqi(value, AQI_RANGES.AQI_R2_LOW, AQI_RANGES.AQI_R2_HIGH, NOX_RANGES.NOx_R2_LOW, NOX_RANGES.NOx_R2_HIGH);
        if (value < NOX_RANGES.NOx_R4_LOW) return calculateAqi(value, AQI_RANGES.AQI_R3_LOW, AQI_RANGES.AQI_R3_HIGH, NOX_RANGES.NOx_R3_LOW, NOX_RANGES.NOx_R3_HIGH);
        if (value < NOX_RANGES.NOx_R5_LOW) return calculateAqi(value, AQI_RANGES.AQI_R4_LOW, AQI_RANGES.AQI_R4_HIGH, NOX_RANGES.NOx_R4_LOW, NOX_RANGES.NOx_R4_HIGH);
        if (value < NOX_RANGES.NOx_R6_LOW) return calculateAqi(value, AQI_RANGES.AQI_R5_LOW, AQI_RANGES.AQI_R5_HIGH, NOX_RANGES.NOx_R5_LOW, NOX_RANGES.NOx_R5_HIGH);
        return calculateAqi(value, AQI_RANGES.AQI_R6_LOW, AQI_RANGES.AQI_R6_HIGH, NOX_RANGES.NOx_R6_LOW, NOX_RANGES.NOx_R6_HIGH);
    };

    return (
        <SettingsContext.Provider value={{
            thresholds,
            unitSystem,
            updateThresholds,
            updateUnitSystem,
            resetToDefaults,
            getMetricQuality,
            getQualityFromAqi,
            getQualityColor,
            calculateAqi: (pollutant: string, concentration: number) => {
                // Legacy function for backward compatibility
                const quality = getMetricQuality(pollutant as Metric, concentration);
                switch (quality) {
                    case 'Good': return Math.min(50, Math.round(concentration));
                    case 'Moderate': return Math.min(100, 51 + Math.round(concentration * 0.5));
                    case 'Poor': return Math.min(200, 101 + Math.round(concentration * 0.3));
                    default: return 50;
                }
            },
            calculatePM25Aqi,
            calculatePM10Aqi,
            calculateHCHOAqi,
            calculateVOCAqi,
            calculateNOxAqi
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}