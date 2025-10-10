import { useState, useEffect, useRef } from 'react'
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
  const updateTimeoutRef = useRef<number | null>(null)

  // Fetch all devices
  const fetchDevices = async () => {
    try {
      // Use readonly client for fast, non-blocking reads
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, device_type, mac_address, serial_number, firmware_version, status, battery_level, signal_strength, floor_id, room_id, installation_date, calibration_due_date, created_at, updated_at')

      if (error) throw error
      
      // Filter out maintenance status and convert to correct types
      const validDevices = (data || []).map(device => ({
        ...device,
        status: device.status === 'maintenance' ? 'offline' : device.status
      })).filter(device => ['online', 'offline', 'error', 'pending'].includes(device.status)) as Device[]
      
      // Sort client-side to avoid DB overhead
      validDevices.sort((a, b) => a.name.localeCompare(b.name))
      
      setDevices(validDevices)
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

    // Set up real-time subscription for device updates (debounced)
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'devices'
        },
        () => {
          // Debounce refetch to avoid storm during ingestion
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }
          updateTimeoutRef.current = window.setTimeout(() => {
            fetchDevices()
          }, 2000)
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
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }
          updateTimeoutRef.current = window.setTimeout(() => {
            fetchDevices()
          }, 2000)
        }
      )
      .subscribe()

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
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