/**
 * Unified Mock Data Context for Abu Dhabi University
 * Provides centralized mock data management with development/production toggle
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  mockDataManager, 
  mockLocations, 
  mockSensorData, 
  mockAlerts,
  mockUsers,
  mockReports,
  mockSettings 
} from '@/lib/mockData';

interface UnifiedMockDataContextType {
  // Configuration
  isUsingMockData: boolean;
  toggleMockData: () => void;
  currentScenario: string;
  setScenario: (scenario: 'normal' | 'high_activity' | 'maintenance' | 'emergency') => void;
  
  // Mock data
  devices: any[];
  locations: any;
  users: any[];
  notifications: any[];
  alerts: any[];
  reports: any[];
  emailSettings: any[];
  thresholds: any[];
  
  // Actions
  refreshMockData: () => void;
  generateNewData: () => void;
  simulateAlert: (deviceId: string, severity: string) => void;
}

const UnifiedMockDataContext = createContext<UnifiedMockDataContextType | undefined>(undefined);

export function UnifiedMockDataProvider({ children }: { children: ReactNode }) {
  const [isUsingMockData, setIsUsingMockData] = useState(() => {
    // Check if we're in development mode or if mock data is explicitly enabled
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('useMockData') === 'true';
  });
  
  const [currentScenario, setCurrentScenario] = useState<'normal' | 'high_activity' | 'maintenance' | 'emergency'>('normal');
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);

  // Initialize mock data
  const generateNewData = () => {
    if (!isUsingMockData) return;
    
    console.log('🔄 Generating new mock data for Abu Dhabi University...');
    
    // Update manager configuration
    mockDataManager.updateConfig({ 
      currentScenario,
      enableSimulation: true,
      useRealTime: true 
    });
    
    // Generate all mock data
    const newDevices = mockSensorData.generateMockDevices();
    const newUsers = mockUsers.generateMockUsers();
    const newNotifications = mockUsers.generateMockNotifications(newUsers);
    const newAlerts = mockAlerts.generateRecentAlerts(newDevices, 15);
    const newReports = [
      mockReports.generateMonthlyReport(),
      mockReports.generateWeeklyReport(),
      mockReports.generateWeeklyReport(1) // Previous week
    ];
    const newEmailSettings = mockSettings.generateEmailSettings();
    const newThresholds = mockSettings.generateAirQualityThresholds();
    
    setDevices(newDevices);
    setUsers(newUsers);
    setNotifications(newNotifications);
    setAlerts(newAlerts);
    setReports(newReports);
    setEmailSettings(newEmailSettings);
    setThresholds(newThresholds);
    
    console.log('✅ Mock data generated:', {
      devices: newDevices.length,
      users: newUsers.length,
      notifications: newNotifications.length,
      alerts: newAlerts.length,
      reports: newReports.length,
      settings: newEmailSettings.length,
      thresholds: newThresholds.length
    });
  };

  const refreshMockData = () => {
    generateNewData();
  };

  const toggleMockData = () => {
    const newValue = !isUsingMockData;
    setIsUsingMockData(newValue);
    localStorage.setItem('useMockData', newValue.toString());
    
    if (newValue) {
      generateNewData();
    } else {
      // Clear mock data when switching to real data
      setDevices([]);
      setUsers([]);
      setNotifications([]);
      setAlerts([]);
      setReports([]);
      setEmailSettings([]);
      setThresholds([]);
    }
  };

  const setScenario = (scenario: 'normal' | 'high_activity' | 'maintenance' | 'emergency') => {
    setCurrentScenario(scenario);
    mockDataManager.updateConfig({ currentScenario: scenario });
    
    // Generate scenario-specific alerts
    if (scenario !== 'normal') {
      const scenarioAlerts = mockAlerts.generateScenarioAlerts(
        scenario === 'high_activity' ? 'lab_incident' :
        scenario === 'maintenance' ? 'maintenance_dust' :
        'hvac_failure'
      );
      setAlerts(prev => [...scenarioAlerts, ...prev]);
    }
    
    // Refresh other data with new scenario
    generateNewData();
  };

  const simulateAlert = (deviceId: string, severity: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    
    const newAlert = {
      id: `alert-simulated-${Date.now()}`,
      device_id: deviceId,
      sensor_type: 'pm25',
      severity: severity as any,
      message: `Simulated ${severity} alert for ${device.name}`,
      value: severity === 'critical' ? 150 : severity === 'high' ? 75 : 35,
      threshold_value: severity === 'critical' ? 100 : severity === 'high' ? 50 : 25,
      is_resolved: false,
      created_at: new Date()
    };
    
    setAlerts(prev => [newAlert, ...prev]);
  };

  // Initialize on mount and when mock data is enabled (but not on every dependency change)
  useEffect(() => {
    if (isUsingMockData && devices.length === 0) { // Only generate if we don't have data
      generateNewData();
    }
  }, [isUsingMockData]); // Remove other dependencies to prevent continuous generation

  // Simulate real-time updates every 2 minutes when using mock data (reduced frequency)
  useEffect(() => {
    if (!isUsingMockData) return;
    
    const interval = setInterval(() => {
      // Update device battery levels and signal strength
      setDevices(prev => prev.map(device => ({
        ...device,
        battery_level: Math.max(10, device.battery_level - Math.random() * 2),
        signal_strength: -70 + Math.random() * 30,
        status: Math.random() > 0.02 ? 'online' : device.status // 2% chance of going offline
      })));
      
      // Occasionally generate new alerts (reduced frequency)
      if (Math.random() < 0.05) { // 5% chance every 2 minutes
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
        if (randomDevice) {
          const newAlerts = mockAlerts.generateRecentAlerts([randomDevice], 1);
          if (newAlerts.length > 0) {
            setAlerts(prev => [newAlerts[0], ...prev]);
          }
        }
      }
    }, 120000); // Changed from 30 seconds to 2 minutes

    return () => clearInterval(interval);
  }, [isUsingMockData, devices.length]); // Use devices.length instead of full devices array

  return (
    <UnifiedMockDataContext.Provider value={{
      isUsingMockData,
      toggleMockData,
      currentScenario,
      setScenario,
      devices,
      locations: mockLocations,
      users,
      notifications,
      alerts,
      reports,
      emailSettings,
      thresholds,
      refreshMockData,
      generateNewData,
      simulateAlert
    }}>
      {children}
    </UnifiedMockDataContext.Provider>
  );
}

export function useUnifiedMockData() {
  const context = useContext(UnifiedMockDataContext);
  if (context === undefined) {
    throw new Error('useUnifiedMockData must be used within a UnifiedMockDataProvider');
  }
  return context;
}