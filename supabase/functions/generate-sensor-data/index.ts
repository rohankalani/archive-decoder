import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Device {
  id: string;
  name: string;
  status: string;
  floor_id: string;
}

interface SensorReading {
  device_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sensor data generation...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all online devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, name, status, floor_id')
      .eq('status', 'online');

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      throw devicesError;
    }

    console.log(`Found ${devices?.length || 0} online devices`);

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No online devices found',
        generated_readings: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sensorReadings: SensorReading[] = [];
    const currentTime = new Date().toISOString();

    // Generate realistic sensor readings for each online device
    devices.forEach((device: Device) => {
      console.log(`Generating readings for device: ${device.name}`);
      
      // Generate base environmental conditions with time-based variation
      const hour = new Date().getHours();
      const timeVariation = Math.sin((hour / 24) * 2 * Math.PI) * 0.2;
      
      // PM2.5 (µg/m³) - Fine particulate matter
      const pm25Base = 15 + timeVariation * 5;
      const pm25Value = Math.max(0, pm25Base + (Math.random() - 0.5) * 10);
      
      // PM10 (µg/m³) - Coarse particulate matter  
      const pm10Base = pm25Value * 1.5;
      const pm10Value = Math.max(0, pm10Base + (Math.random() - 0.5) * 8);
      
      // CO2 (ppm) - Higher during day, lower at night
      const co2Base = 400 + (hour > 6 && hour < 18 ? 200 : 50);
      const co2Value = Math.max(300, co2Base + (Math.random() - 0.5) * 100);
      
      // Temperature (°C) - UAE climate simulation
      const tempBase = 25 + timeVariation * 8;
      const tempValue = Math.max(15, Math.min(45, tempBase + (Math.random() - 0.5) * 6));
      
      // Humidity (%) - Anti-correlated with temperature  
      const humidityBase = 65 - timeVariation * 15;
      const humidityValue = Math.max(20, Math.min(90, humidityBase + (Math.random() - 0.5) * 20));
      
      // VOC (ppb) - Volatile Organic Compounds
      const vocBase = 50 + timeVariation * 20;
      const vocValue = Math.max(0, vocBase + (Math.random() - 0.5) * 30);
      
      // NO2 (ppb) - Nitrogen Dioxide
      const no2Base = 20 + timeVariation * 10;
      const no2Value = Math.max(0, no2Base + (Math.random() - 0.5) * 15);

      // Create sensor readings array
      const readings = [
        { sensor_type: 'pm25', value: Math.round(pm25Value * 10) / 10, unit: 'µg/m³' },
        { sensor_type: 'pm10', value: Math.round(pm10Value * 10) / 10, unit: 'µg/m³' },
        { sensor_type: 'co2', value: Math.round(co2Value), unit: 'ppm' },
        { sensor_type: 'temperature', value: Math.round(tempValue * 10) / 10, unit: '°C' },
        { sensor_type: 'humidity', value: Math.round(humidityValue * 10) / 10, unit: '%' },
        { sensor_type: 'voc', value: Math.round(vocValue * 10) / 10, unit: 'ppb' },
        { sensor_type: 'no2', value: Math.round(no2Value * 10) / 10, unit: 'ppb' },
      ];

      // Add all readings for this device
      readings.forEach(reading => {
        sensorReadings.push({
          device_id: device.id,
          sensor_type: reading.sensor_type,
          value: reading.value,
          unit: reading.unit,
          timestamp: currentTime,
        });
      });
    });

    console.log(`Generated ${sensorReadings.length} sensor readings`);

    // Insert all sensor readings in batch
    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert(sensorReadings);

    if (insertError) {
      console.error('Error inserting sensor readings:', insertError);
      throw insertError;
    }

    console.log('Successfully inserted sensor readings');

    // Occasionally update device status for realism (5% chance)
    if (Math.random() < 0.05) {
      const deviceToUpdate = devices[Math.floor(Math.random() * devices.length)];
      const newStatus = Math.random() < 0.1 ? 'offline' : 'online';
      
      await supabase
        .from('devices')
        .update({ status: newStatus })
        .eq('id', deviceToUpdate.id);
        
      console.log(`Updated device ${deviceToUpdate.name} status to ${newStatus}`);
    }

    // Clean up old sensor readings (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: cleanupError } = await supabase
      .from('sensor_readings')
      .delete()
      .lt('timestamp', sevenDaysAgo.toISOString());

    if (cleanupError) {
      console.warn('Error cleaning up old readings:', cleanupError);
    } else {
      console.log('Cleaned up old sensor readings');
    }

    return new Response(JSON.stringify({ 
      message: 'Sensor data generated successfully',
      devices_processed: devices.length,
      readings_generated: sensorReadings.length,
      timestamp: currentTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sensor-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
