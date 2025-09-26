import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorData {
  device_id: string;
  pm01?: number;
  pm03?: number;
  pm05?: number;
  pm1?: number;
  pm5?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  no2?: number;  // ESP incorrectly sends nox as no2
  hcho?: number;
  pc01?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  pc10?: number;
  aqi_overall?: number;
  dominant_pollutant?: string;
  timestamp: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sensorData }: { sensorData: SensorData } = await req.json();
    console.log('Processing sensor data:', sensorData);

    // Batch insert sensor readings for better performance
    const readings = [];
    const sensorTypes = ['pm01', 'pm03', 'pm05', 'pm1', 'pm5', 'pm10', 'co2', 'temperature', 'humidity', 'voc', 'hcho', 'pc01', 'pc03', 'pc05', 'pc1', 'pc25', 'pc5', 'pc10', 'aqi_overall'];
    const units: Record<string, string> = {
      pm01: 'µg/m³',
      pm03: 'µg/m³',
      pm05: 'µg/m³',
      pm1: 'µg/m³',
      pm5: 'µg/m³',
      pm10: 'µg/m³', 
      co2: 'ppm',
      temperature: '°C',
      humidity: '%',
      voc: 'ppb',
      hcho: 'µg/m³',
      pc01: 'particles/cm³',
      pc03: 'particles/cm³',
      pc05: 'particles/cm³',
      pc1: 'particles/cm³',
      pc25: 'particles/cm³',
      pc5: 'particles/cm³',
      pc10: 'particles/cm³',
      aqi_overall: 'index'
    };

    // Handle ESP32's incorrect mapping: it sends nox data as "no2"
    if (sensorData.no2 !== undefined) {
      readings.push({
        device_id: sensorData.device_id,
        sensor_type: 'nox',  // Correct mapping to nox
        value: sensorData.no2,
        unit: 'ppb',
        timestamp: sensorData.timestamp
      });
    }

    // Handle dominant_pollutant as text field
    if (sensorData.dominant_pollutant !== undefined) {
      readings.push({
        device_id: sensorData.device_id,
        sensor_type: 'dominant_pollutant',
        value: 0,  // Store as 0 since it's text data
        unit: 'text',
        timestamp: sensorData.timestamp
      });
    }

    for (const type of sensorTypes) {
      if (sensorData[type] !== undefined) {
        readings.push({
          device_id: sensorData.device_id,
          sensor_type: type,
          value: sensorData[type],
          unit: units[type],
          timestamp: sensorData.timestamp
        });
      }
    }

    if (readings.length > 0) {
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
        .eq('id', sensorData.device_id);

      if (updateError) {
        console.error('Error updating device status:', updateError);
      }

      // Check for alerts (simplified - you may want to batch this)
      await checkForAlerts(supabase, sensorData);
    }

    return new Response(
      JSON.stringify({ success: true, processed: readings.length }),
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

async function checkForAlerts(supabase: any, sensorData: SensorData) {
  // Get thresholds
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
        device_id: sensorData.device_id,
        sensor_type: 'pm10',
        value: sensorData.pm10,
        threshold_value: pm10Threshold.unhealthy_max,
        severity: sensorData.pm10 > pm10Threshold.hazardous_min ? 'critical' : 'high',
        message: `PM10 level (${sensorData.pm10} µg/m³) exceeds safe threshold`
      });
    }
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    await supabase.from('alerts').insert(alerts);
  }
}