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
  status: 'online' | 'offline' | 'error'
  battery_level?: number
  signal_strength?: number
  floor_id: string
  room_id?: string
  installation_date?: string
  calibration_due_date?: string
  created_at: string
  updated_at: string
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all devices
  const fetchDevices = async () => {
    try {
      // Force fresh data by adding timestamp to prevent any caching
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('name')

      if (error) throw error
      
      console.log('Fetched devices from database:', data?.map(d => ({ id: d.id, name: d.name })))
      
      // Filter out maintenance status and convert to correct types
      const validDevices = (data || []).map(device => ({
        ...device,
        status: device.status === 'maintenance' ? 'offline' : device.status
      })).filter(device => ['online', 'offline', 'error'].includes(device.status)) as Device[]
      
      setDevices(validDevices)
      console.log('Set devices state:', validDevices.map(d => ({ id: d.id, name: d.name })))
    } catch (error) {
      console.error('Error fetching devices:', error)
      toast.error('Failed to fetch devices')
    } finally {
      setLoading(false)
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
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const validDevice = {
        ...data,
        status: data.status === 'maintenance' ? 'offline' : data.status
      } as Device
      setDevices(prev => prev.map(device => 
        device.id === id ? { ...device, ...validDevice } : device
      ))
      toast.success('Device updated successfully')
      return data
    } catch (error) {
      console.error('Error updating device:', error)
      toast.error('Failed to update device')
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

    // Set up real-time subscription for device updates
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
          // Refetch devices when any change occurs
          fetchDevices()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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