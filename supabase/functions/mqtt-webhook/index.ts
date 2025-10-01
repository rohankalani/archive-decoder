import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HiveMQWebhookPayload {
  topic: string;
  payload: string; // Base64 encoded JSON string
  qos: number;
  retain: boolean;
  clientId: string;
  timestamp: number;
}

interface SensorPayload {
  mac_address: string;
  timestamp?: string;
  pm25?: number;
  pm10?: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
  voc?: number;
  no2?: number;
  hcho?: number;
  pm03?: number;
  pm05?: number;
  pm1?: number;
  pm5?: number;
  pc03?: number;
  pc05?: number;
  pc1?: number;
  pc25?: number;
  pc5?: number;
  aqi_overall?: number;
  dominant_pollutant?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request from HiveMQ');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse HiveMQ webhook payload
    const webhookPayload: HiveMQWebhookPayload = await req.json();
    console.log('Webhook topic:', webhookPayload.topic);
    console.log('Client ID:', webhookPayload.clientId);

    // Decode base64 payload to JSON
    const decodedPayload = atob(webhookPayload.payload);
    console.log('Decoded payload:', decodedPayload);
    
    const sensorData: SensorPayload = JSON.parse(decodedPayload);
    
    if (!sensorData.mac_address) {
      throw new Error('MAC address is required in payload');
    }

    console.log('Processing data from MAC:', sensorData.mac_address);

    // Look up device by MAC address
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, name, status')
      .eq('mac_address', sensorData.mac_address)
      .single();

    if (deviceError || !device) {
      console.error('Device not found for MAC:', sensorData.mac_address);
      
      // Auto-register new device
      const { data: newDevice, error: registerError } = await supabase
        .from('devices')
        .insert({
          name: `ESP32-${sensorData.mac_address.slice(-8)}`,
          mac_address: sensorData.mac_address,
          device_type: 'air_quality_sensor',
          status: 'online',
          floor_id: 'f3c5d8b9-4e7a-4f2c-9d1e-8b3c5a7f9e2d' // Default floor - update as needed
        })
        .select()
        .single();

      if (registerError) {
        throw new Error(`Failed to register device: ${registerError.message}`);
      }

      console.log('Auto-registered new device:', newDevice.id);
      
      // Prepare consolidated payload for mqtt-processor
      const processorPayload = {
        sensorData: {
          deviceId: newDevice.id,
          timestamp: sensorData.timestamp || new Date().toISOString(),
          ...sensorData
        }
      };

      // Forward to mqtt-processor
      const processorResponse = await supabase.functions.invoke('mqtt-processor', {
        body: processorPayload
      });

      if (processorResponse.error) {
        throw new Error(`mqtt-processor error: ${processorResponse.error.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Device registered and data processed',
          device_id: newDevice.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Device exists, prepare payload
    const processorPayload = {
      sensorData: {
        deviceId: device.id,
        timestamp: sensorData.timestamp || new Date().toISOString(),
        ...sensorData
      }
    };

    console.log('Forwarding to mqtt-processor for device:', device.id);

    // Forward to mqtt-processor
    const processorResponse = await supabase.functions.invoke('mqtt-processor', {
      body: processorPayload
    });

    if (processorResponse.error) {
      throw new Error(`mqtt-processor error: ${processorResponse.error.message}`);
    }

    console.log('Successfully processed sensor data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sensor data processed successfully',
        device_id: device.id,
        device_name: device.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
