import { supabase } from '@/integrations/supabase/client';
import { AppError, DatabaseError, NotFoundError, logger } from './errors';

// ============= Simplified API Client =============

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // ============= Device Methods =============

  public async getDevices(filters?: any): Promise<any[]> {
    try {
      const query = supabase.from('devices').select('*');
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to get devices', new DatabaseError(error.message));
        throw new DatabaseError(`Query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get devices', error as Error);
      throw error;
    }
  }

  public async getDeviceById(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error(`Failed to get device ${id}`, new DatabaseError(error.message));
        throw new DatabaseError(`Query failed: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundError(`Device with id ${id}`);
      }

      return data;
    } catch (error) {
      logger.error(`Failed to get device ${id}`, error as Error);
      throw error;
    }
  }

  // ============= Sensor Reading Methods =============

  public async getSensorReadings(deviceId: string, sensorType?: string, limit?: number): Promise<any[]> {
    try {
      const query = supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        logger.error(`Failed to get sensor readings for device ${deviceId}`, new DatabaseError(error.message));
        throw new DatabaseError(`Query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error(`Failed to get sensor readings for device ${deviceId}`, error as Error);
      throw error;
    }
  }

  public async createSensorReading(data: any): Promise<any> {
    try {
      const { data: insertedData, error } = await supabase
        .from('sensor_readings')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create sensor reading', new DatabaseError(error.message), { data });
        throw new DatabaseError(`Insert failed: ${error.message}`);
      }

      return insertedData;
    } catch (error) {
      logger.error('Failed to create sensor reading', error as Error, { data });
      throw error;
    }
  }

  // ============= Alert Methods =============

  public async getAlerts(includeResolved: boolean = false): Promise<any[]> {
    try {
      const query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to get alerts', new DatabaseError(error.message));
        throw new DatabaseError(`Query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get alerts', error as Error);
      throw error;
    }
  }

  public async createAlert(data: any): Promise<any> {
    try {
      const { data: insertedData, error } = await supabase
        .from('alerts')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create alert', new DatabaseError(error.message), { data });
        throw new DatabaseError(`Insert failed: ${error.message}`);
      }

      return insertedData;
    } catch (error) {
      logger.error('Failed to create alert', error as Error, { data });
      throw error;
    }
  }

  public async resolveAlert(id: string, resolvedBy: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        logger.error(`Failed to resolve alert ${id}`, new DatabaseError(error.message));
        throw new DatabaseError(`Update failed: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundError(`Alert with id ${id}`);
      }

      return data;
    } catch (error) {
      logger.error(`Failed to resolve alert ${id}`, error as Error);
      throw error;
    }
  }

  // ============= Utility Methods =============

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