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
    const { messages, query } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // If user provided a specific query, execute it
    let queryResult = null;
    if (query && typeof query === 'string') {
      try {
        console.log('Executing query:', query);
        const { data, error } = await supabase.rpc('execute_sql', { query });
        if (error) {
          console.error('Query error:', error);
          queryResult = `Query error: ${error.message}`;
        } else {
          queryResult = data;
        }
      } catch (err) {
        console.error('Query execution error:', err);
        queryResult = `Error executing query: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    // Build system prompt with schema information
    const systemPrompt = `You are an AI assistant for an air quality monitoring system at Abu Dhabi University. You have access to a database with the following schema:

DATABASE SCHEMA:
${SCHEMA_INFO.tables.map(table => 
  `Table: ${table.name} - ${table.description || ''}
Columns:
${table.columns.map(col => `  - ${col.name} (${col.type}): ${col.description || ''}`).join('\n')}`
).join('\n\n')}

IMPORTANT GUIDELINES:
1. When users ask questions about the data, provide helpful SQL queries they can run
2. Explain air quality metrics and what they mean
3. Help interpret sensor readings and alert levels
4. Provide insights about building occupancy, air quality trends, and environmental conditions
5. Always use proper SQL syntax for PostgreSQL
6. Be concise but informative
7. If asked about specific data, suggest appropriate queries to get that information

CURRENT QUERY RESULT:
${queryResult ? JSON.stringify(queryResult, null, 2) : 'No query executed'}

Answer the user's question based on your knowledge of air quality monitoring and the database schema. If they need specific data, provide them with the appropriate SQL query.`;

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