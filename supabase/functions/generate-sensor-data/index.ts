import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting sensor data generation...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all online devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, name, status')
      .eq('status', 'online')

    if (devicesError) {
      console.error('❌ Error fetching devices:', devicesError)
      throw devicesError
    }

    console.log(`📊 Found ${devices?.length || 0} online devices`)

    if (!devices || devices.length === 0) {
      console.log('⚠️ No online devices found')
      return new Response(
        JSON.stringify({ message: 'No online devices found', devicesCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate realistic sensor readings for each online device
    const sensorReadings = []
    const currentTime = new Date().toISOString()

    // Time of day affects certain readings (simulate daily patterns)
    const hour = new Date().getHours()
    const isNightTime = hour < 6 || hour > 22
    const isPeakHours = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)

    for (const device of devices) {
      console.log(`🔄 Generating data for device: ${device.name}`)

      // Base values with realistic ranges for indoor air quality
      const baseValues = {
        pm2_5: 15, // μg/m³ - good indoor air quality
        pm10: 25,  // μg/m³ 
        co2: 800,  // ppm - typical indoor levels
        temperature: 23, // °C - comfortable room temperature
        humidity: 45,    // % - comfortable humidity
        voc: 0.3,       // mg/m³ - low VOC levels
        no2: 25,        // μg/m³ - low nitrogen dioxide
        so2: 15,        // μg/m³ - low sulfur dioxide
        o3: 40,         // μg/m³ - low ozone indoors
        pressure: 1013  // hPa - standard atmospheric pressure
      }

      // Add realistic variations based on time and location
      const variations = {
        pm2_5: baseValues.pm2_5 + (Math.random() - 0.5) * 10 + (isPeakHours ? 5 : 0),
        pm10: baseValues.pm10 + (Math.random() - 0.5) * 15 + (isPeakHours ? 8 : 0),
        co2: baseValues.co2 + (Math.random() - 0.5) * 200 + (isPeakHours ? 150 : isNightTime ? -100 : 0),
        temperature: baseValues.temperature + (Math.random() - 0.5) * 4 + (isNightTime ? -2 : 0),
        humidity: baseValues.humidity + (Math.random() - 0.5) * 20,
        voc: Math.max(0.1, baseValues.voc + (Math.random() - 0.5) * 0.4),
        no2: Math.max(5, baseValues.no2 + (Math.random() - 0.5) * 20),
        so2: Math.max(5, baseValues.so2 + (Math.random() - 0.5) * 15),
        o3: Math.max(10, baseValues.o3 + (Math.random() - 0.5) * 30),
        pressure: baseValues.pressure + (Math.random() - 0.5) * 10
      }

      // Ensure realistic bounds
      variations.pm2_5 = Math.max(1, Math.min(100, variations.pm2_5))
      variations.pm10 = Math.max(1, Math.min(150, variations.pm10))
      variations.co2 = Math.max(400, Math.min(2000, variations.co2))
      variations.temperature = Math.max(18, Math.min(28, variations.temperature))
      variations.humidity = Math.max(30, Math.min(70, variations.humidity))

      // Create sensor readings for each metric
      const sensorTypes = [
        { type: 'pm2_5', value: variations.pm2_5, unit: 'μg/m³' },
        { type: 'pm10', value: variations.pm10, unit: 'μg/m³' },
        { type: 'co2', value: variations.co2, unit: 'ppm' },
        { type: 'temperature', value: variations.temperature, unit: '°C' },
        { type: 'humidity', value: variations.humidity, unit: '%' },
        { type: 'voc', value: variations.voc, unit: 'mg/m³' },
        { type: 'no2', value: variations.no2, unit: 'μg/m³' },
        { type: 'so2', value: variations.so2, unit: 'μg/m³' },
        { type: 'o3', value: variations.o3, unit: 'μg/m³' },
        { type: 'pressure', value: variations.pressure, unit: 'hPa' }
      ]

      for (const sensor of sensorTypes) {
        sensorReadings.push({
          device_id: device.id,
          sensor_type: sensor.type,
          value: Math.round(sensor.value * 100) / 100, // Round to 2 decimal places
          unit: sensor.unit,
          timestamp: currentTime
        })
      }
    }

    console.log(`💾 Inserting ${sensorReadings.length} sensor readings...`)

    // Insert all sensor readings
    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert(sensorReadings)

    if (insertError) {
      console.error('❌ Error inserting sensor readings:', insertError)
      throw insertError
    }

    // Clean up old readings (keep only last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error: cleanupError } = await supabase
      .from('sensor_readings')
      .delete()
      .lt('timestamp', thirtyDaysAgo.toISOString())

    if (cleanupError) {
      console.warn('⚠️ Warning: Failed to cleanup old readings:', cleanupError)
    }

    // Occasionally simulate device status changes (5% chance)
    if (Math.random() < 0.05) {
      const deviceToUpdate = devices[Math.floor(Math.random() * devices.length)]
      const newStatus = Math.random() < 0.8 ? 'online' : 'offline'
      
      await supabase
        .from('devices')
        .update({ status: newStatus })
        .eq('id', deviceToUpdate.id)
      
      console.log(`🔄 Updated device ${deviceToUpdate.name} status to: ${newStatus}`)
    }

    console.log('✅ Sensor data generation completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sensor data generated successfully',
        devicesCount: devices.length,
        readingsGenerated: sensorReadings.length,
        timestamp: currentTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in generate-sensor-data function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate sensor data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
