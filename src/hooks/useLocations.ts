import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Site {
  id: string
  name: string
  description?: string
  address: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export interface Building {
  id: string
  site_id: string
  name: string
  description?: string
  floor_count: number
  created_at: string
  updated_at: string
  site?: Site
}

export interface Floor {
  id: string
  building_id: string
  floor_number: number
  name?: string
  area_sqm?: number
  created_at: string
  updated_at: string
  building?: Building
}

export interface Room {
  id: string
  floor_id: string
  name: string
  description?: string
  room_number?: string
  room_type?: string
  capacity?: number
  area_sqm?: number
  created_at: string
  updated_at: string
  floor?: Floor
}

export function useLocations() {
  const [sites, setSites] = useState<Site[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all locations
  const fetchLocations = async () => {
    try {
      setLoading(true)
      
      // Fetch sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name')

      if (sitesError) throw sitesError

      // Fetch buildings with site info
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select(`
          *,
          site:sites(*)
        `)
        .order('name')

      if (buildingsError) throw buildingsError

      // Fetch floors with building info (optional - may not always need the relation)
      const { data: floorsData, error: floorsError } = await supabase
        .from('floors')
        .select('*')
        .order('floor_number')

      if (floorsError) throw floorsError

      // Fetch rooms with floor info (simplified for now until relations are fixed)
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('name')

      if (roomsError) throw roomsError

      setSites(sitesData || [])
      setBuildings(buildingsData || [])
      setFloors(floorsData || [])
      setRooms(roomsData || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.error('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  // Site operations
  const createSite = async (data: Omit<Site, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newSite, error } = await supabase
        .from('sites')
        .insert([data])
        .select()
        .single()

      if (error) throw error

      setSites(prev => [...prev, newSite])
      toast.success('Site created successfully')
      return newSite
    } catch (error) {
      console.error('Error creating site:', error)
      toast.error('Failed to create site')
      throw error
    }
  }

  const updateSite = async (id: string, data: Partial<Site>) => {
    try {
      const { data: updatedSite, error } = await supabase
        .from('sites')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setSites(prev => prev.map(site => site.id === id ? updatedSite : site))
      toast.success('Site updated successfully')
      return updatedSite
    } catch (error) {
      console.error('Error updating site:', error)
      toast.error('Failed to update site')
      throw error
    }
  }

  const deleteSite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSites(prev => prev.filter(site => site.id !== id))
      // Remove dependent buildings, floors, and rooms
      setBuildings(prev => prev.filter(building => building.site_id !== id))
      setFloors(prev => prev.filter(floor => floor.building?.site_id !== id))
      setRooms(prev => prev.filter(room => room.floor?.building?.site_id !== id))
      
      toast.success('Site deleted successfully')
    } catch (error) {
      console.error('Error deleting site:', error)
      toast.error('Failed to delete site')
      throw error
    }
  }

  // Building operations
  const createBuilding = async (data: Omit<Building, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newBuilding, error } = await supabase
        .from('buildings')
        .insert([data])
        .select(`
          *,
          site:sites(*)
        `)
        .single()

      if (error) throw error

      setBuildings(prev => [...prev, newBuilding])
      toast.success('Building created successfully')
      return newBuilding
    } catch (error) {
      console.error('Error creating building:', error)
      toast.error('Failed to create building')
      throw error
    }
  }

  const updateBuilding = async (id: string, data: Partial<Building>) => {
    try {
      const { data: updatedBuilding, error } = await supabase
        .from('buildings')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          site:sites(*)
        `)
        .single()

      if (error) throw error

      setBuildings(prev => prev.map(building => building.id === id ? updatedBuilding : building))
      toast.success('Building updated successfully')
      return updatedBuilding
    } catch (error) {
      console.error('Error updating building:', error)
      toast.error('Failed to update building')
      throw error
    }
  }

  const deleteBuilding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBuildings(prev => prev.filter(building => building.id !== id))
      setFloors(prev => prev.filter(floor => floor.building_id !== id))
      setRooms(prev => prev.filter(room => room.floor?.building_id !== id))
      
      toast.success('Building deleted successfully')
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error('Failed to delete building')
      throw error
    }
  }

  // Floor operations
  const createFloor = async (data: Omit<Floor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newFloor, error } = await supabase
        .from('floors')
        .insert(data)
        .select()
        .single()

      if (error) throw error

      setFloors(prev => [...prev, newFloor])
      toast.success('Floor created successfully')
      return newFloor
    } catch (error) {
      console.error('Error creating floor:', error)
      toast.error('Failed to create floor')
      throw error
    }
  }

  const updateFloor = async (id: string, data: Partial<Floor>) => {
    try {
      const { data: updatedFloor, error } = await supabase
        .from('floors')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setFloors(prev => prev.map(floor => floor.id === id ? updatedFloor : floor))
      toast.success('Floor updated successfully')
      return updatedFloor
    } catch (error) {
      console.error('Error updating floor:', error)
      toast.error('Failed to update floor')
      throw error
    }
  }

  const deleteFloor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', id)

      if (error) throw error

      setFloors(prev => prev.filter(floor => floor.id !== id))
      setRooms(prev => prev.filter(room => room.floor_id !== id))
      toast.success('Floor deleted successfully')
    } catch (error) {
      console.error('Error deleting floor:', error)
      toast.error('Failed to delete floor')
      throw error
    }
  }

  // Room operations
  const createRoom = async (data: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newRoom, error } = await supabase
        .from('rooms')
        .insert(data)
        .select()
        .single()

      if (error) throw error

      setRooms(prev => [...prev, newRoom])
      toast.success('Room created successfully')
      return newRoom
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
      throw error
    }
  }

  const updateRoom = async (id: string, data: Partial<Room>) => {
    try {
      const { data: updatedRoom, error } = await supabase
        .from('rooms')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room))
      toast.success('Room updated successfully')
      return updatedRoom
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('Failed to update room')
      throw error
    }
  }

  const deleteRoom = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRooms(prev => prev.filter(room => room.id !== id))
      toast.success('Room deleted successfully')
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to delete room')
      throw error
    }
  }

  // Utility functions
  const getBuildingsBySite = (siteId: string) => 
    buildings.filter(building => building.site_id === siteId)

  const getFloorsByBuilding = (buildingId: string) => 
    floors.filter(floor => floor.building_id === buildingId)

  const getRoomsByFloor = (floorId: string) => 
    rooms.filter(room => room.floor_id === floorId)

  // Load data on mount
  useEffect(() => {
    fetchLocations()
  }, [])

  return {
    // Data
    sites,
    buildings,
    floors,
    rooms,
    loading,
    
    // Operations
    createSite,
    updateSite,
    deleteSite,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createFloor,
    updateFloor,
    deleteFloor,
    createRoom,
    updateRoom,
    deleteRoom,
    
    // Utilities
    getBuildingsBySite,
    getFloorsByBuilding,
    getRoomsByFloor,
    getFloorLocation: (floor: Floor) => {
      const building = buildings.find(b => b.id === floor.building_id)
      const site = sites.find(s => s.id === building?.site_id)
      return { site, building, floor }
    },
    fetchLocations,
  }
}