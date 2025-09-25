import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AqiLevel, Metric, Thresholds, UnitSystem, BreakpointTable } from '@/types';

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

    const calculateAqi = (pollutant: string, concentration: number): number => {
        // Simplified AQI calculation for demo
        const quality = getMetricQuality(pollutant as Metric, concentration);
        switch (quality) {
            case 'Good': return Math.min(50, Math.round(concentration));
            case 'Moderate': return Math.min(100, 51 + Math.round(concentration * 0.5));
            case 'Poor': return Math.min(200, 101 + Math.round(concentration * 0.3));
            default: return 50;
        }
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
            calculateAqi
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