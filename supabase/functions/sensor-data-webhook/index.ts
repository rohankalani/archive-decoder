import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-secret',
};

interface SensorPayload {
  device_id?: string;
  mac_address: string;
  pm03?: number;
  pm05?: number;
  pm1?: number;
  pm25?: number;
  pm5?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  nox?: number;
  hcho?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  aqi_overall?: number;
  dominant_pollutant?: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received HTTPS sensor data request');

    // Authenticate device
    const deviceSecret = req.headers.get('x-device-secret');
    const expectedSecret = Deno.env.get('DEVICE_SECRET');
    
    if (!deviceSecret || deviceSecret !== expectedSecret) {
      console.error('Invalid or missing device secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const sensorData: SensorPayload = await req.json();
    console.log('Processing sensor data:', sensorData);

    // Identify or register device by MAC address
    let deviceId = sensorData.device_id;
    
    if (!deviceId && sensorData.mac_address) {
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('mac_address', sensorData.mac_address)
        .maybeSingle();

      if (existingDevice) {
        deviceId = existingDevice.id;
        console.log('Found existing device:', deviceId);
      } else {
        // Auto-register new device
        const { data: newDevice, error: deviceError } = await supabase
          .from('devices')
          .insert({
            name: `Device ${sensorData.mac_address.slice(-6)}`,
            mac_address: sensorData.mac_address,
            device_type: 'air_quality_sensor',
            status: 'online',
            floor_id: (await supabase.from('floors').select('id').limit(1).single()).data?.id
          })
          .select()
          .single();

        if (deviceError) {
          console.error('Error registering device:', deviceError);
          throw deviceError;
        }

        deviceId = newDevice.id;
        console.log('Auto-registered new device:', deviceId);
      }
    }

    if (!deviceId) {
      throw new Error('Could not identify or register device');
    }

    // Prepare sensor readings for batch insert
    const readings = [];
    const sensorTypes = ['pm03', 'pm05', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'temperature', 'humidity', 'voc', 'hcho', 'pc03', 'pc05', 'pc1', 'pc25', 'pc5', 'aqi_overall'];
    const units: Record<string, string> = {
      pm03: 'µg/m³',
      pm05: 'µg/m³',
      pm1: 'µg/m³',
      pm25: 'µg/m³',
      pm5: 'µg/m³',
      pm10: 'µg/m³',
      co2: 'ppm',
      temperature: '°C',
      humidity: '%',
      voc: 'ppb',
      hcho: 'µg/m³',
      pc03: 'particles/cm³',
      pc05: 'particles/cm³',
      pc1: 'particles/cm³',
      pc25: 'particles/cm³',
      pc5: 'particles/cm³',
      aqi_overall: 'index'
    };

    // Handle nox data
    if (sensorData.nox !== undefined) {
      readings.push({
        device_id: deviceId,
        sensor_type: 'nox',
        value: sensorData.nox,
        unit: 'ppb',
        timestamp: sensorData.timestamp
      });
    }

    // Handle dominant_pollutant as text field
    if (sensorData.dominant_pollutant !== undefined) {
      readings.push({
        device_id: deviceId,
        sensor_type: 'dominant_pollutant',
        value: 0,
        unit: 'text',
        timestamp: sensorData.timestamp
      });
    }

    // Add all other sensor readings
    for (const type of sensorTypes) {
      if (sensorData[type as keyof SensorPayload] !== undefined) {
        readings.push({
          device_id: deviceId,
          sensor_type: type,
          value: sensorData[type as keyof SensorPayload],
          unit: units[type],
          timestamp: sensorData.timestamp
        });
      }
    }

    if (readings.length > 0) {
      console.log(`Inserting ${readings.length} sensor readings`);
      
      const { error: insertError } = await supabase
        .from('sensor_readings')
        .insert(readings);

      if (insertError) {
        console.error('Error inserting sensor readings:', insertError);
        throw insertError;
      }

      // Update device status to online
      const { error: updateError } = await supabase
        .from('devices')
        .update({ 
          status: 'online',
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (updateError) {
        console.error('Error updating device status:', updateError);
      }

      // Check for alerts
      await checkForAlerts(supabase, deviceId, sensorData);
    }

    console.log('Successfully processed sensor data');
    return new Response(
      JSON.stringify({ 
        success: true, 
        device_id: deviceId,
        readings_processed: readings.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing sensor data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkForAlerts(supabase: any, deviceId: string, sensorData: SensorPayload) {
  const { data: thresholds } = await supabase
    .from('air_quality_thresholds')
    .select('*');

  if (!thresholds) return;

  const alerts = [];
  
  // Check PM10 levels
  if (sensorData.pm10) {
    const pm10Threshold = thresholds.find((t: any) => t.sensor_type === 'pm10');
    if (pm10Threshold && sensorData.pm10 > pm10Threshold.unhealthy_max) {
      alerts.push({
        device_id: deviceId,
        sensor_type: 'pm10',
        value: sensorData.pm10,
        threshold_value: pm10Threshold.unhealthy_max,
        severity: sensorData.pm10 > pm10Threshold.hazardous_min ? 'critical' : 'high',
        message: `PM10 level (${sensorData.pm10} µg/m³) exceeds safe threshold`
      });
    }
  }

  // Check PM2.5 levels
  if (sensorData.pm25) {
    const pm25Threshold = thresholds.find((t: any) => t.sensor_type === 'pm25');
    if (pm25Threshold && sensorData.pm25 > pm25Threshold.unhealthy_max) {
      alerts.push({
        device_id: deviceId,
        sensor_type: 'pm25',
        value: sensorData.pm25,
        threshold_value: pm25Threshold.unhealthy_max,
        severity: sensorData.pm25 > pm25Threshold.hazardous_min ? 'critical' : 'high',
        message: `PM2.5 level (${sensorData.pm25} µg/m³) exceeds safe threshold`
      });
    }
  }

  // Check CO2 levels
  if (sensorData.co2) {
    const co2Threshold = thresholds.find((t: any) => t.sensor_type === 'co2');
    if (co2Threshold && sensorData.co2 > co2Threshold.unhealthy_max) {
      alerts.push({
        device_id: deviceId,
        sensor_type: 'co2',
        value: sensorData.co2,
        threshold_value: co2Threshold.unhealthy_max,
        severity: sensorData.co2 > co2Threshold.hazardous_min ? 'critical' : 'high',
        message: `CO2 level (${sensorData.co2} ppm) exceeds safe threshold`
      });
    }
  }

  if (alerts.length > 0) {
    console.log(`Creating ${alerts.length} alerts`);
    await supabase.from('alerts').insert(alerts);
  }
}
