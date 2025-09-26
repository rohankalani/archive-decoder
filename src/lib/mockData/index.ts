/**
 * Central Mock Data System for Abu Dhabi University
 * Provides consistent, realistic data for frontend development and testing
 */

import { mockLocations } from './locations';
import { mockSensorData } from './sensorData';
import { mockAlerts } from './alerts';
import { mockUsers } from './users';
import { mockReports } from './reports';
import { mockSettings } from './settings';

export interface MockDataConfig {
  useRealTime: boolean;
  enableSimulation: boolean;
  currentScenario: 'normal' | 'high_activity' | 'maintenance' | 'emergency';
  timeAcceleration: number; // 1x = real time, 24x = 1 day per hour
}

export class MockDataManager {
  private static instance: MockDataManager;
  private config: MockDataConfig;
  private startTime: Date;

  private constructor() {
    this.config = {
      useRealTime: true,
      enableSimulation: true,
      currentScenario: 'normal',
      timeAcceleration: 1
    };
    this.startTime = new Date();
  }

  static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager();
    }
    return MockDataManager.instance;
  }

  updateConfig(newConfig: Partial<MockDataConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getCurrentTime(): Date {
    if (this.config.timeAcceleration === 1) {
      return new Date();
    }
    const elapsed = Date.now() - this.startTime.getTime();
    return new Date(this.startTime.getTime() + elapsed * this.config.timeAcceleration);
  }

  // Get current scenario-based multipliers
  getScenarioMultipliers() {
    const time = this.getCurrentTime();
    const hour = time.getHours();
    const isWeekend = time.getDay() === 0 || time.getDay() === 6;
    
    switch (this.config.currentScenario) {
      case 'high_activity':
        return {
          activityLevel: 1.5,
          co2Multiplier: 1.3,
          particulateMultiplier: 1.2,
          alertProbability: 0.02
        };
      case 'maintenance':
        return {
          activityLevel: 0.3,
          co2Multiplier: 0.8,
          particulateMultiplier: 2.0, // Higher due to cleaning/construction
          alertProbability: 0.05
        };
      case 'emergency':
        return {
          activityLevel: 0.1,
          co2Multiplier: 0.5,
          particulateMultiplier: 1.8,
          alertProbability: 0.15
        };
      default: // normal
        const baseActivity = isWeekend ? 0.2 : 
          (hour >= 8 && hour <= 18) ? 1.0 : 0.3;
        return {
          activityLevel: baseActivity,
          co2Multiplier: 1.0,
          particulateMultiplier: 1.0,
          alertProbability: 0.01
        };
    }
  }

  // University-specific time patterns
  getUniversityScheduleMultiplier(): number {
    const time = this.getCurrentTime();
    const hour = time.getHours();
    const day = time.getDay();
    
    // Weekend
    if (day === 0 || day === 6) return 0.2;
    
    // Weekday schedule
    if (hour >= 7 && hour <= 9) return 0.8; // Arrival
    if (hour >= 9 && hour <= 12) return 1.2; // Morning classes  
    if (hour >= 12 && hour <= 13) return 0.6; // Lunch break
    if (hour >= 13 && hour <= 17) return 1.1; // Afternoon classes
    if (hour >= 17 && hour <= 19) return 0.7; // Departure
    if (hour >= 19 && hour <= 22) return 0.4; // Evening activities
    
    return 0.1; // Late night/early morning
  }
}

// Export all mock data modules
export {
  mockLocations,
  mockSensorData, 
  mockAlerts,
  mockUsers,
  mockReports,
  mockSettings
};

export const mockDataManager = MockDataManager.getInstance();