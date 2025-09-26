import { supabase } from '@/integrations/supabase/client';
import { AppError, DatabaseError, NotFoundError, ValidationError, handleAsyncError, logger } from './errors';
import { validateAndSanitize } from './validation';
import { z } from 'zod';

// ============= Types =============

export interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

// ============= Generic API Client =============

export class ApiClient {
  private static instance: ApiClient;
  private baseRetryDelay = 1000;
  private maxRetries = 3;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // ============= Specific API Methods =============

  public async getDevices(filters?: Record<string, unknown>): Promise<any[]> {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async (): Promise<any[]> => {
        let query = supabase.from('devices').select('*');

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        const { data, error } = await query;
        
        if (error) {
          throw new DatabaseError(`Query failed: ${error.message}`);
        }

        return data;
      })
    );

    if (error) {
      logger.error('Failed to get devices', error);
      throw error;
    }

    return result || [];
  }

  public async getDeviceById(id: string) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('devices')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new NotFoundError(`Device with id ${id}`);
          }
          throw new DatabaseError(`Query failed: ${error.message}`);
        }

        return data;
      })
    );

    if (error) {
      logger.error(`Failed to get device ${id}`, error);
      throw error;
    }

    return result!;
  }

  public async getSensorReadings(deviceId: string, sensorType?: string, limit?: number) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        let query = supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', deviceId)
          .order('timestamp', { ascending: false });

        if (sensorType) {
          query = query.eq('sensor_type', sensorType as any);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        
        if (error) {
          throw new DatabaseError(`Query failed: ${error.message}`);
        }

        return data;
      })
    );

    if (error) {
      logger.error(`Failed to get sensor readings for device ${deviceId}`, error);
      throw error;
    }

    return result || [];
  }

  public async createSensorReading(data: {
    device_id: string;
    sensor_type: string;
    value: number;
    unit: string;
    timestamp?: string;
  }) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        const { data: insertedData, error } = await supabase
          .from('sensor_readings')
          .insert({
            device_id: data.device_id,
            sensor_type: data.sensor_type as any,
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp || new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw new DatabaseError(`Insert failed: ${error.message}`);
        }

        return insertedData;
      })
    );

    if (error) {
      logger.error('Failed to create sensor reading', error, { data });
      throw error;
    }

    return result!;
  }

  public async getAlerts(includeResolved: boolean = false) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        let query = supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!includeResolved) {
          query = query.eq('is_resolved', false);
        }

        const { data, error } = await query;
        
        if (error) {
          throw new DatabaseError(`Query failed: ${error.message}`);
        }

        return data;
      })
    );

    if (error) {
      logger.error('Failed to get alerts', error);
      throw error;
    }

    return result || [];
  }

  public async createAlert(data: {
    device_id: string;
    sensor_type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    value: number;
    threshold_value: number;
  }) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        const { data: insertedData, error } = await supabase
          .from('alerts')
          .insert({
            device_id: data.device_id,
            sensor_type: data.sensor_type as any,
            severity: data.severity as any,
            message: data.message,
            value: data.value,
            threshold_value: data.threshold_value,
            is_resolved: false
          })
          .select()
          .single();

        if (error) {
          throw new DatabaseError(`Insert failed: ${error.message}`);
        }

        return insertedData;
      })
    );

    if (error) {
      logger.error('Failed to create alert', error, { data });
      throw error;
    }

    return result!;
  }

  public async resolveAlert(id: string, resolvedBy: string) {
    const [result, error] = await handleAsyncError(
      this.executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('alerts')
          .update({
            is_resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: resolvedBy
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new NotFoundError(`Alert with id ${id}`);
          }
          throw new DatabaseError(`Update failed: ${error.message}`);
        }

        return data;
      })
    );

    if (error) {
      logger.error(`Failed to resolve alert ${id}`, error);
      throw error;
    }

    return result!;
  }

  // ============= Utility Methods =============

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }

        if (attempt === this.maxRetries) {
          break;
        }

        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn(`Retrying operation (attempt ${attempt + 1}/${this.maxRetries})`, {
          error: lastError.message,
          delay
        });
      }
    }

    throw lastError;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export const apiClient = ApiClient.getInstance();