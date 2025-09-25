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

export interface Block {
  id: string
  building_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  building?: Building
}

export interface Floor {
  id: string
  block_id: string
  floor_number: number
  name?: string
  area_sqm?: number
  created_at: string
  updated_at: string
  block?: Block
}

export function useLocations() {
  const [sites, setSites] = useState<Site[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
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

      // Fetch blocks with building info
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select(`
          *,
          building:buildings(
            *,
            site:sites(*)
          )
        `)
        .order('name')

      if (blocksError) throw blocksError

      // Fetch floors with block info
      const { data: floorsData, error: floorsError } = await supabase
        .from('floors')
        .select(`
          *,
          block:blocks(
            *,
            building:buildings(
              *,
              site:sites(*)
            )
          )
        `)
        .order('floor_number')

      if (floorsError) throw floorsError

      setSites(sitesData || [])
      setBuildings(buildingsData || [])
      setBlocks(blocksData || [])
      setFloors(floorsData || [])
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
      // Remove dependent buildings, blocks, and floors
      setBuildings(prev => prev.filter(building => building.site_id !== id))
      setBlocks(prev => prev.filter(block => block.building?.site_id !== id))
      setFloors(prev => prev.filter(floor => floor.block?.building?.site_id !== id))
      
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
      setBlocks(prev => prev.filter(block => block.building_id !== id))
      setFloors(prev => prev.filter(floor => floor.block?.building_id !== id))
      
      toast.success('Building deleted successfully')
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error('Failed to delete building')
      throw error
    }
  }

  // Block operations
  const createBlock = async (data: Omit<Block, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newBlock, error } = await supabase
        .from('blocks')
        .insert([data])
        .select(`
          *,
          building:buildings(
            *,
            site:sites(*)
          )
        `)
        .single()

      if (error) throw error

      setBlocks(prev => [...prev, newBlock])
      toast.success('Block created successfully')
      return newBlock
    } catch (error) {
      console.error('Error creating block:', error)
      toast.error('Failed to create block')
      throw error
    }
  }

  const updateBlock = async (id: string, data: Partial<Block>) => {
    try {
      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          building:buildings(
            *,
            site:sites(*)
          )
        `)
        .single()

      if (error) throw error

      setBlocks(prev => prev.map(block => block.id === id ? updatedBlock : block))
      toast.success('Block updated successfully')
      return updatedBlock
    } catch (error) {
      console.error('Error updating block:', error)
      toast.error('Failed to update block')
      throw error
    }
  }

  const deleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBlocks(prev => prev.filter(block => block.id !== id))
      setFloors(prev => prev.filter(floor => floor.block_id !== id))
      
      toast.success('Block deleted successfully')
    } catch (error) {
      console.error('Error deleting block:', error)
      toast.error('Failed to delete block')
      throw error
    }
  }

  // Floor operations
  const createFloor = async (data: Omit<Floor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newFloor, error } = await supabase
        .from('floors')
        .insert([data])
        .select(`
          *,
          block:blocks(
            *,
            building:buildings(
              *,
              site:sites(*)
            )
          )
        `)
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
        .select(`
          *,
          block:blocks(
            *,
            building:buildings(
              *,
              site:sites(*)
            )
          )
        `)
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
      toast.success('Floor deleted successfully')
    } catch (error) {
      console.error('Error deleting floor:', error)
      toast.error('Failed to delete floor')
      throw error
    }
  }

  // Utility functions
  const getBuildingsBySite = (siteId: string) => 
    buildings.filter(building => building.site_id === siteId)

  const getBlocksByBuilding = (buildingId: string) => 
    blocks.filter(block => block.building_id === buildingId)

  const getFloorsByBlock = (blockId: string) => 
    floors.filter(floor => floor.block_id === blockId)

  // Load data on mount
  useEffect(() => {
    fetchLocations()
  }, [])

  return {
    // Data
    sites,
    buildings,
    blocks,
    floors,
    loading,
    
    // Operations
    createSite,
    updateSite,
    deleteSite,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createBlock,
    updateBlock,
    deleteBlock,
    createFloor,
    updateFloor,
    deleteFloor,
    
    // Utilities
    getBuildingsBySite,
    getBlocksByBuilding,
    getFloorsByBlock,
    fetchLocations,
  }
}