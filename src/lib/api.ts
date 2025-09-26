// Re-export from api-client for backward compatibility
import { apiClient } from './api-client';

export * from './api-client';

export const deviceApi = {
  getAll: (filters?: Record<string, unknown>) => 
    apiClient.getDevices(filters),
  
  getById: (id: string) => 
    apiClient.getDeviceById(id),
};

export const sensorReadingApi = {
  getForDevice: (deviceId: string, limit?: number) =>
    apiClient.getSensorReadings(deviceId, undefined, limit),
  
  create: (data: Record<string, unknown>) =>
    apiClient.createSensorReading(data as any),
  
  getHistorical: (deviceId: string, sensorType: string, hours: number) =>
    apiClient.getSensorReadings(deviceId, sensorType, hours * 2),
};

export const alertApi = {
  getActive: () =>
    apiClient.getAlerts(false),
  
  create: (data: Record<string, unknown>) =>
    apiClient.createAlert(data as any),
  
  resolve: (id: string, resolvedBy: string) =>
    apiClient.resolveAlert(id, resolvedBy),
};