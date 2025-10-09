import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface SensorReading {
  id: string
  device_id: string
  sensor_type: string
  value: number
  unit: string
  timestamp: string
  created_at: string
}

export interface LiveSensorData {
  device_id: string
  device_name: string
  pm03?: number
  pm1?: number
  pm25?: number
  pm5?: number
  pm10?: number
  co2?: number
  temperature?: number
  humidity?: number
  voc?: number
  hcho?: number
  no2?: number
  nox?: number
  pc03?: number
  pc05?: number
  pc1?: number
  pc25?: number
  pc5?: number
  pc10?: number
  aqi_overall?: number
  aqi?: number
  status: 'online' | 'offline' | 'error'
  last_updated: string
}

export function useLiveSensorData() {
  const [sensorData, setSensorData] = useState<LiveSensorData[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate AQI based on PM2.5 values (simplified US EPA formula)
  const calculateAQI = (pm25: number): number => {
    if (pm25 <= 12) return Math.round((50 / 12) * pm25)
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301)
  }

  const fetchLatestSensorData = async (options?: { silent?: boolean; suppressToast?: boolean }) => {
    try {
      // Get all devices with their latest sensor readings
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, name, status')

      if (devicesError) throw devicesError

      if (!devices || devices.length === 0) {
        setSensorData([])
        return
      }

      // Get latest sensor readings for each device
      const sensorDataPromises = devices.map(async (device) => {
        const { data: readings, error: readingsError } = await supabase
          .from('sensor_readings')
          .select('sensor_type, value, unit, timestamp')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(35) // Increased to capture all sensor types including aqi_overall

        if (readingsError) {
          console.error(`Error fetching readings for device ${device.id}:`, readingsError)
          return null
        }

        // Group readings by sensor type and get the latest for each
        const latestReadings: Record<string, { value: number; timestamp: string }> = {}
        readings?.forEach(reading => {
          if (!latestReadings[reading.sensor_type] || 
              new Date(reading.timestamp) > new Date(latestReadings[reading.sensor_type].timestamp)) {
            latestReadings[reading.sensor_type] = {
              value: reading.value,
              timestamp: reading.timestamp
            }
          }
        })

        // Use AQI from ESP32 if available, otherwise fallback to PM2.5 calculation
        const aqiOverall = latestReadings.aqi_overall?.value
        const pm25Value = latestReadings.pm25?.value || 0
        const aqi = aqiOverall || (pm25Value > 0 ? calculateAQI(pm25Value) : undefined)

        return {
          device_id: device.id,
          device_name: device.name,
          pm03: latestReadings.pm03?.value,
          pm1: latestReadings.pm1?.value,
          pm25: latestReadings.pm25?.value,
          pm5: latestReadings.pm5?.value,
          pm10: latestReadings.pm10?.value,
          co2: latestReadings.co2?.value,
          temperature: latestReadings.temperature?.value,
          humidity: latestReadings.humidity?.value,
          voc: latestReadings.voc?.value,
          hcho: latestReadings.hcho?.value,
          no2: latestReadings.no2?.value,
          nox: latestReadings.nox?.value,
          pc03: latestReadings.pc03?.value,
          pc05: latestReadings.pc05?.value,
          pc1: latestReadings.pc1?.value,
          pc25: latestReadings.pc25?.value,
          pc5: latestReadings.pc5?.value,
          pc10: latestReadings.pc10?.value,
          aqi_overall: aqiOverall,
          aqi,
          status: device.status as 'online' | 'offline' | 'error',
          last_updated: Object.values(latestReadings).reduce((latest, reading) => {
            return !latest || new Date(reading.timestamp) > new Date(latest) 
              ? reading.timestamp 
              : latest
          }, '') || new Date().toISOString()
        } as LiveSensorData
      })

      const results = await Promise.all(sensorDataPromises)
      const validResults = results.filter(result => result !== null) as LiveSensorData[]
      
      setSensorData(validResults)
    } catch (error) {
      console.error('Error fetching sensor data:', error)
      if (!options?.suppressToast) toast.error('Failed to fetch sensor data')
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }

  // Calculate overall statistics
  const getOverallStats = () => {
    if (sensorData.length === 0) return null

    const onlineDevices = sensorData.filter(d => d.status === 'online')
    if (onlineDevices.length === 0) return null

    const avgAQI = onlineDevices.reduce((sum, d) => sum + (d.aqi || 0), 0) / onlineDevices.length
    const avgTemp = onlineDevices.reduce((sum, d) => sum + (d.temperature || 0), 0) / onlineDevices.length
    const avgHumidity = onlineDevices.reduce((sum, d) => sum + (d.humidity || 0), 0) / onlineDevices.length
    const avgCO2 = onlineDevices.reduce((sum, d) => sum + (d.co2 || 0), 0) / onlineDevices.length
    const avgPM25 = onlineDevices.reduce((sum, d) => sum + (d.pm25 || 0), 0) / onlineDevices.length
    const avgPM10 = onlineDevices.reduce((sum, d) => sum + (d.pm10 || 0), 0) / onlineDevices.length

    return {
      aqi: Math.round(avgAQI),
      temperature: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHumidity * 10) / 10,
      co2: Math.round(avgCO2),
      pm25: Math.round(avgPM25 * 10) / 10,
      pm10: Math.round(avgPM10 * 10) / 10,
      onlineDevices: onlineDevices.length,
      totalDevices: sensorData.length
    }
  }

  useEffect(() => {
    fetchLatestSensorData()

    // Set up real-time subscription for sensor readings
    const channel = supabase
      .channel('sensor-readings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings'
        },
        () => {
          // Refresh data when new readings arrive
          fetchLatestSensorData({ silent: true, suppressToast: true })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices'
        },
        () => {
          // Refresh data when device status changes
          fetchLatestSensorData({ silent: true, suppressToast: true })
        }
      )
      .subscribe()

    // Also refresh every 30 seconds as fallback
    const interval = setInterval(() => fetchLatestSensorData({ silent: true, suppressToast: true }), 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  return {
    sensorData,
    loading,
    overallStats: getOverallStats(),
    refetch: fetchLatestSensorData
  }
}