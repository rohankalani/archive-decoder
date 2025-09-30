import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DatabaseSchema {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
    description?: string;
  }>;
}

const SCHEMA_INFO: DatabaseSchema = {
  tables: [
    {
      name: "sensor_readings",
      description: "Real-time sensor data from air quality devices",
      columns: [
        { name: "device_id", type: "uuid", description: "Reference to the device" },
        { name: "sensor_type", type: "enum", description: "Type: pm25, pm10, co2, temperature, humidity, voc, nox, hcho" },
        { name: "value", type: "numeric", description: "Sensor reading value" },
        { name: "unit", type: "text", description: "Unit of measurement" },
        { name: "timestamp", type: "timestamp", description: "When the reading was taken" }
      ]
    },
    {
      name: "devices",
      description: "Air quality monitoring devices",
      columns: [
        { name: "id", type: "uuid", description: "Device identifier" },
        { name: "name", type: "text", description: "Device name" },
        { name: "status", type: "enum", description: "online, offline, maintenance" },
        { name: "floor_id", type: "uuid", description: "Location reference" }
      ]
    },
    {
      name: "alerts",
      description: "Air quality alerts and warnings",
      columns: [
        { name: "device_id", type: "uuid", description: "Device that triggered alert" },
        { name: "sensor_type", type: "enum", description: "Sensor that caused alert" },
        { name: "severity", type: "enum", description: "low, medium, high, critical" },
        { name: "message", type: "text", description: "Alert description" },
        { name: "is_resolved", type: "boolean", description: "Whether alert is resolved" },
        { name: "created_at", type: "timestamp", description: "When alert was created" }
      ]
    },
    {
      name: "sites",
      description: "University sites/campuses",
      columns: [
        { name: "name", type: "text", description: "Site name" },
        { name: "address", type: "text", description: "Physical address" },
        { name: "latitude", type: "numeric", description: "GPS latitude" },
        { name: "longitude", type: "numeric", description: "GPS longitude" }
      ]
    },
    {
      name: "buildings",
      description: "Buildings within sites",
      columns: [
        { name: "name", type: "text", description: "Building name" },
        { name: "site_id", type: "uuid", description: "Reference to site" },
        { name: "floor_count", type: "integer", description: "Number of floors" }
      ]
    },
    {
      name: "floors",
      description: "Floors within buildings",
      columns: [
        { name: "floor_number", type: "integer", description: "Floor number" },
        { name: "building_id", type: "uuid", description: "Reference to building" },
        { name: "area_sqm", type: "numeric", description: "Floor area in square meters" }
      ]
    },
    {
      name: "rooms",
      description: "Rooms/classrooms within floors",
      columns: [
        { name: "name", type: "text", description: "Room name" },
        { name: "room_number", type: "text", description: "Room number" },
        { name: "room_type", type: "text", description: "Type: Classroom, Lab, Office, etc." },
        { name: "floor_id", type: "uuid", description: "Reference to floor" },
        { name: "capacity", type: "integer", description: "Room capacity" },
        { name: "area_sqm", type: "numeric", description: "Room area" }
      ]
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, queryType, params } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Execute safe, predefined queries only
    let queryResult = null;
    if (queryType) {
      console.log('Executing safe query type:', queryType, 'with params:', params);
      
      try {
        switch (queryType) {
          case 'get_latest_readings':
            const { data: readings, error: readingsError } = await supabase
              .rpc('get_latest_sensor_readings_optimized');
            queryResult = readingsError ? { error: readingsError.message } : readings;
            break;
            
          case 'get_devices':
            const { data: devices, error: devicesError } = await supabase
              .from('devices')
              .select('id, name, status, device_type, floor_id, battery_level, signal_strength');
            queryResult = devicesError ? { error: devicesError.message } : devices;
            break;
            
          case 'get_alerts':
            const limit = params?.limit || 10;
            const { data: alerts, error: alertsError } = await supabase
              .from('alerts')
              .select('id, device_id, sensor_type, severity, message, value, threshold_value, created_at, is_resolved')
              .order('created_at', { ascending: false })
              .limit(limit);
            queryResult = alertsError ? { error: alertsError.message } : alerts;
            break;
            
          case 'get_sensor_readings':
            const deviceId = params?.device_id;
            const sensorType = params?.sensor_type;
            const hours = params?.hours || 24;
            
            if (!deviceId) {
              queryResult = { error: 'device_id parameter required' };
              break;
            }
            
            let query = supabase
              .from('sensor_readings')
              .select('timestamp, value, unit, sensor_type, device_id')
              .eq('device_id', deviceId)
              .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
              .order('timestamp', { ascending: false })
              .limit(100);
              
            if (sensorType) {
              query = query.eq('sensor_type', sensorType);
            }
            
            const { data: sensorData, error: sensorError } = await query;
            queryResult = sensorError ? { error: sensorError.message } : sensorData;
            break;
            
          case 'get_locations':
            const { data: locations, error: locationsError } = await supabase
              .from('sites')
              .select(`
                id, name, address,
                buildings (
                  id, name, floor_count,
                  floors (
                    id, name, floor_number,
                    rooms (id, name, room_type, capacity)
                  )
                )
              `);
            queryResult = locationsError ? { error: locationsError.message } : locations;
            break;
            
          default:
            queryResult = { error: 'Unknown query type. Available types: get_latest_readings, get_devices, get_alerts, get_sensor_readings, get_locations' };
        }
      } catch (error) {
        console.error('Query execution error:', error);
        queryResult = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Build system prompt with available query types
    const systemPrompt = `You are an AI assistant for an air quality monitoring system at Abu Dhabi University.

AVAILABLE QUERY TYPES (use these to guide users):
1. get_latest_readings - Get the most recent sensor readings from all devices
2. get_devices - List all devices with their status and location
3. get_alerts - Get recent alerts (params: { limit: number })
4. get_sensor_readings - Get historical data for a device (params: { device_id: uuid, sensor_type?: string, hours?: number })
5. get_locations - Get all sites, buildings, floors, and rooms

DATABASE STRUCTURE:
- Sites contain Buildings
- Buildings contain Floors  
- Floors contain Rooms and Devices
- Devices generate Sensor Readings (PM2.5, PM10, CO2, Temperature, Humidity, VOC, NOx, HCHO)
- Alerts are triggered when readings exceed thresholds

AIR QUALITY REFERENCE:
- PM2.5: Good <12, Moderate 12-35, Unhealthy 35-55, Very Unhealthy 55-150, Hazardous >150 μg/m³
- PM10: Good <54, Moderate 54-154, Unhealthy 154-254, Very Unhealthy 254-354, Hazardous >354 μg/m³
- CO2: Good <800, Moderate 800-1000, Unhealthy >1000 ppm
- Temperature: Optimal 20-24°C
- Humidity: Optimal 30-60%

${queryResult ? `QUERY RESULT:
${JSON.stringify(queryResult, null, 2)}

Analyze this data and provide insights to the user.` : 'No query executed. Help the user understand what data they can access and suggest appropriate queries for their questions.'}

Be helpful, concise, and provide actionable insights. When suggesting queries, explain what information they will provide.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          ...messages.map((msg: ChatMessage) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.';

    return new Response(JSON.stringify({ 
      reply,
      queryResult: queryResult ? { data: queryResult, executed: true } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-database-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      reply: 'I apologize, but I encountered an error while processing your request.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});