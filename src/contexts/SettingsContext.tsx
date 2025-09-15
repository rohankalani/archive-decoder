import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Thresholds, Metric, UnitSystem, AqiLevel, BreakpointTable, Breakpoint } from '../types';

// Default AQI breakpoint tables for different pollutants
const DEFAULT_PM25_BREAKPOINTS: BreakpointTable = [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500]
];

const DEFAULT_PM10_BREAKPOINTS: BreakpointTable = [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500]
];

const DEFAULT_CO_BREAKPOINTS: BreakpointTable = [
    [0.0, 4.4, 0, 50],
    [4.5, 9.4, 51, 100],
    [9.5, 12.4, 101, 150],
    [12.5, 15.4, 151, 200],
    [15.5, 30.4, 201, 300],
    [30.5, 40.4, 301, 400],
    [40.5, 50.4, 401, 500]
];

interface SettingsContextType {
    // Thresholds
    thresholds: Record<Metric, Thresholds>;
    updateThresholds: (metric: Metric, newThresholds: Thresholds) => void;
    
    // IAQI Thresholds (0-500 scale)
    iaqiThresholds: number[];
    updateIaqiThresholds: (newThresholds: number[]) => void;
    
    // AQI Breakpoints
    breakpointTables: Record<string, BreakpointTable>;
    updateBreakpointTable: (pollutant: string, table: BreakpointTable) => void;
    
    // Unit system
    unitSystem: UnitSystem;
    setUnitSystem: (system: UnitSystem) => void;
    
    // Quality calculation functions
    getMetricQuality: (metric: Metric, value: number) => AqiLevel;
    getQualityFromAqi: (aqi: number) => AqiLevel;
    calculateAqi: (pollutant: string, concentration: number) => number;
}

const defaultThresholds: Record<Metric, Thresholds> = {
    pm25: { good: 12, moderate: 35.4, poor: 55.4 },
    pm10: { good: 54, moderate: 154, poor: 254 },
    pm1: { good: 10, moderate: 25, poor: 50 },
    temperature: { good: 18, moderate: 25, poor: 35 },
    humidity: { good: 40, moderate: 60, poor: 80 },
    pressure: { good: 1000, moderate: 1020, poor: 1040 },
    co2: { good: 400, moderate: 1000, poor: 2000 },
    co: { good: 4.4, moderate: 9.4, poor: 12.4 },
    no2: { good: 53, moderate: 100, poor: 360 },
    o3: { good: 54, moderate: 70, poor: 85 },
    so2: { good: 35, moderate: 75, poor: 185 },
    noise: { good: 40, moderate: 55, poor: 70 },
    radiation: { good: 0.1, moderate: 0.5, poor: 1.0 },
    wind_speed: { good: 5, moderate: 15, poor: 25 },
    wind_direction: { good: 0, moderate: 180, poor: 360 },
    voc: { good: 65, moderate: 220, poor: 660 },
    iaqi: { good: 50, moderate: 100, poor: 150 }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [thresholds, setThresholds] = useState<Record<Metric, Thresholds>>(defaultThresholds);
    const [iaqiThresholds, setIaqiThresholds] = useState<number[]>([50, 100, 150, 200, 300, 400]);
    const [breakpointTables, setBreakpointTables] = useState<Record<string, BreakpointTable>>({
        pm25: DEFAULT_PM25_BREAKPOINTS,
        pm10: DEFAULT_PM10_BREAKPOINTS,
        co: DEFAULT_CO_BREAKPOINTS
    });
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    const updateThresholds = (metric: Metric, newThresholds: Thresholds) => {
        setThresholds(prev => ({
            ...prev,
            [metric]: newThresholds
        }));
    };

    const updateIaqiThresholds = (newThresholds: number[]) => {
        setIaqiThresholds(newThresholds);
    };

    const updateBreakpointTable = (pollutant: string, table: BreakpointTable) => {
        setBreakpointTables(prev => ({
            ...prev,
            [pollutant]: table
        }));
    };

    const getMetricQuality = useCallback((metric: Metric, value: number): AqiLevel => {
        const threshold = thresholds[metric];
        if (value <= threshold.good) return 'Good';
        if (value <= threshold.moderate) return 'Moderate';
        if (value <= threshold.poor) return 'Unhealthy for Sensitive Groups';
        if (value <= threshold.poor * 1.5) return 'Unhealthy';
        if (value <= threshold.poor * 2) return 'Very Unhealthy';
        return 'Hazardous';
    }, [thresholds]);

    const getQualityFromAqi = useCallback((aqi: number): AqiLevel => {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }, []);

    const calculateAqi = useCallback((pollutant: string, concentration: number): number => {
        const table = breakpointTables[pollutant];
        if (!table) return 0;

        // Find the appropriate breakpoint
        for (const [cLow, cHigh, aqiLow, aqiHigh] of table) {
            if (concentration >= cLow && concentration <= cHigh) {
                // Linear interpolation
                return Math.round(((aqiHigh - aqiLow) / (cHigh - cLow)) * (concentration - cLow) + aqiLow);
            }
        }

        // If concentration is above the highest breakpoint, use the last one
        const lastBreakpoint = table[table.length - 1];
        return lastBreakpoint[3]; // Return the highest AQI value
    }, [breakpointTables]);

    return (
        <SettingsContext.Provider value={{
            thresholds,
            updateThresholds,
            iaqiThresholds,
            updateIaqiThresholds,
            breakpointTables,
            updateBreakpointTable,
            unitSystem,
            setUnitSystem,
            getMetricQuality,
            getQualityFromAqi,
            calculateAqi
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};