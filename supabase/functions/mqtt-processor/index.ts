import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorData {
  device_id: string;
  pm25?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  no2?: number;
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
    const sensorTypes = ['pm25', 'pm10', 'co2', 'temperature', 'humidity', 'voc', 'no2'];
    const units: Record<string, string> = {
      pm25: 'µg/m³',
      pm10: 'µg/m³', 
      co2: 'ppm',
      temperature: '°C',
      humidity: '%',
      voc: 'ppb',
      no2: 'µg/m³'
    };

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
  
  // Check PM2.5 levels
  if (sensorData.pm25) {
    const pm25Threshold = thresholds.find((t: any) => t.sensor_type === 'pm25');
    if (pm25Threshold && sensorData.pm25 > pm25Threshold.unhealthy_max) {
      alerts.push({
        device_id: sensorData.device_id,
        sensor_type: 'pm25',
        value: sensorData.pm25,
        threshold_value: pm25Threshold.unhealthy_max,
        severity: sensorData.pm25 > pm25Threshold.hazardous_min ? 'critical' : 'high',
        message: `PM2.5 level (${sensorData.pm25} µg/m³) exceeds safe threshold`
      });
    }
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    await supabase.from('alerts').insert(alerts);
  }
}