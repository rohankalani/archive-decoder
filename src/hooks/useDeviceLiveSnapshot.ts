import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface LiveSnapshot {
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

export function useDeviceLiveSnapshot(deviceId: string) {
  const [sensor, setSensor] = useState<LiveSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const calculateAQI = (pm25: number): number => {
    if (pm25 <= 12) return Math.round((50 / 12) * pm25)
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301)
  }

  const fetchSnapshot = async (options?: { silent?: boolean; suppressToast?: boolean }) => {
    if (!deviceId) {
      setSensor(null)
      setLoading(false)
      return
    }
    try {
      // Get device info
      const { data: device, error: deviceErr } = await supabase
        .from('devices')
        .select('id, name, status')
        .eq('id', deviceId)
        .maybeSingle()
      if (deviceErr) throw deviceErr
      if (!device) {
        setSensor(null)
        return
      }

      // Get latest readings for this device only
      const { data: readings, error: readingsErr } = await supabase
        .from('sensor_readings')
        .select('sensor_type, value, unit, timestamp')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(60)

      if (readingsErr) throw readingsErr

      const latest: Record<string, { value: number; timestamp: string }> = {}
      readings?.forEach(r => {
        const prev = latest[r.sensor_type]
        if (!prev || new Date(r.timestamp) > new Date(prev.timestamp)) {
          latest[r.sensor_type] = { value: r.value, timestamp: r.timestamp }
        }
      })

      const aqiOverall = latest.aqi_overall?.value
      const pm25Value = latest.pm25?.value || 0
      const aqi = aqiOverall || (pm25Value > 0 ? calculateAQI(pm25Value) : undefined)

      setSensor({
        device_id: device.id,
        device_name: device.name,
        pm03: latest.pm03?.value,
        pm1: latest.pm1?.value,
        pm25: latest.pm25?.value,
        pm5: latest.pm5?.value,
        pm10: latest.pm10?.value,
        co2: latest.co2?.value,
        temperature: latest.temperature?.value,
        humidity: latest.humidity?.value,
        voc: latest.voc?.value,
        hcho: latest.hcho?.value,
        no2: latest.no2?.value,
        nox: latest.nox?.value,
        pc03: latest.pc03?.value,
        pc05: latest.pc05?.value,
        pc1: latest.pc1?.value,
        pc25: latest.pc25?.value,
        pc5: latest.pc5?.value,
        pc10: latest.pc10?.value,
        aqi_overall: aqiOverall,
        aqi,
        status: device.status as 'online' | 'offline' | 'error',
        last_updated: Object.values(latest).reduce((latestTs, item) => {
          return !latestTs || new Date(item.timestamp) > new Date(latestTs) ? item.timestamp : latestTs
        }, '') || new Date().toISOString()
      })
    } catch (e) {
      console.error('Error fetching device snapshot:', e)
      if (!options?.suppressToast) toast.error('Failed to load device data')
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchSnapshot()

    // Realtime updates scoped to this device
    const channel = supabase
      .channel('device-snapshot-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `device_id=eq.${deviceId}`
      }, () => fetchSnapshot({ silent: true, suppressToast: true }))
      .subscribe()

    // Fallback polling every 30s
    const interval = setInterval(() => fetchSnapshot({ silent: true, suppressToast: true }), 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [deviceId])

  return { sensor, loading, refetch: fetchSnapshot }
}
