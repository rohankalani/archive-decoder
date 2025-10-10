import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Device {
  id: string
  name: string
  device_type: string
  mac_address?: string
  serial_number?: string
  firmware_version?: string
  status: 'online' | 'offline' | 'error' | 'pending'
  battery_level?: number
  signal_strength?: number
  floor_id: string | null
  room_id?: string | null
  installation_date?: string
  calibration_due_date?: string
  created_at: string
  updated_at: string
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all devices with timeout handling and retry logic
  const fetchDevices = async (retryCount = 0) => {
    const MAX_RETRIES = 3
    const TIMEOUT_MS = 8000 // 8 second timeout
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('name')
        .limit(100) // Add safety limit
        .abortSignal(controller.signal)
      
      clearTimeout(timeoutId)
      
      if (error) throw error
      
      console.log('Fetched devices from database:', data?.map(d => ({ id: d.id, name: d.name })))
      
      // Filter out maintenance status and convert to correct types
      const validDevices = (data || []).map(device => ({
        ...device,
        status: device.status === 'maintenance' ? 'offline' : device.status
      })).filter(device => ['online', 'offline', 'error', 'pending'].includes(device.status)) as Device[]
      
      setDevices(validDevices)
      console.log('Set devices state:', validDevices.map(d => ({ id: d.id, name: d.name })))
    } catch (error: any) {
      console.error('Error fetching devices:', error)
      
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout') || 
          error?.message?.includes('upstream') ||
          error?.code === 'PGRST116' ||
          error?.name === 'AbortError') {
        
        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
          console.log(`Retrying device fetch in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          
          setTimeout(() => {
            fetchDevices(retryCount + 1)
          }, delay)
          return // Don't show error toast yet
        }
      }
      
      // Only show error toast after all retries exhausted
      toast.error('Failed to fetch devices. Please refresh the page.')
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  // Get devices by floor
  const getDevicesByFloor = (floorId: string): Device[] => {
    return devices.filter(device => device.floor_id === floorId)
  }

  // Create device
  const createDevice = async (deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([deviceData])
        .select()
        .single()

      if (error) throw error

      const validDevice = {
        ...data,
        status: data.status === 'maintenance' ? 'offline' : data.status
      } as Device
      setDevices(prev => [...prev, validDevice])
      toast.success('Device created successfully')
      return data
    } catch (error) {
      console.error('Error creating device:', error)
      toast.error('Failed to create device')
      throw error
    }
  }

  // Update device
  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      console.log('=== Updating Device ===')
      console.log('Device ID:', id)
      console.log('Updates:', updates)
      
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      console.log('Update successful:', data)

      const validDevice = {
        ...data,
        status: data.status === 'maintenance' ? 'offline' : data.status
      } as Device
      setDevices(prev => prev.map(device => 
        device.id === id ? { ...device, ...validDevice } : device
      ))
      toast.success('Device updated successfully')
      return data
    } catch (error: any) {
      console.error('Error updating device:', error)
      
      // More specific error messages
      if (error?.code === 'PGRST116') {
        toast.error('Database timeout - please try again')
      } else if (error?.message) {
        toast.error(`Failed to update device: ${error.message}`)
      } else {
        toast.error('Failed to update device')
      }
      
      throw error
    }
  }

  // Delete device
  const deleteDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDevices(prev => prev.filter(device => device.id !== id))
      toast.success('Device deleted successfully')
    } catch (error) {
      console.error('Error deleting device:', error)
      toast.error('Failed to delete device')
      throw error
    }
  }

  // Update device status
  const updateDeviceStatus = async (id: string, status: Device['status']) => {
    return updateDevice(id, { status })
  }

  useEffect(() => {
    fetchDevices()

    let refetchTimer: NodeJS.Timeout

    // Delay real-time subscription setup to reduce initial load
    const subscriptionTimer = setTimeout(() => {
      const channel = supabase
        .channel('devices-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'devices'
          },
          () => {
            // Debounce refetch to prevent rapid successive calls
            clearTimeout(refetchTimer)
            refetchTimer = setTimeout(() => {
              fetchDevices()
            }, 2000)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Device subscription active')
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Device subscription error, will retry')
          }
        })

      return () => {
        clearTimeout(refetchTimer)
        supabase.removeChannel(channel)
      }
    }, 3000) // Wait 3 seconds before setting up subscription

    return () => {
      clearTimeout(subscriptionTimer)
    }
  }, [])

  return {
    devices,
    loading,
    getDevicesByFloor,
    createDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus,
    refetch: fetchDevices
  }
}