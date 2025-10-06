import React, { useState, useEffect } from 'react'
import { useLocations, Site, Building, Floor, Room } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CreateSiteSchema, CreateBuildingSchema, CreateFloorSchema, validateAndSanitize } from '@/lib/validation'
import { z } from 'zod'

type LocationType = 'site' | 'building' | 'floor' | 'room'

interface LocationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialType: LocationType
  parentId?: string
  editItem?: Site | Building | Floor | Room | null
}

export function LocationWizard({ isOpen, onClose, initialType, parentId, editItem }: LocationWizardProps) {
  const { 
    sites, 
    buildings, 
    floors,
    rooms,
    createSite, 
    createBuilding, 
    createFloor,
    createRoom,
    updateSite,
    updateBuilding,
    updateFloor,
    updateRoom,
    getBuildingsBySite,
    getFloorsByBuilding,
    getRoomsByFloor
  } = useLocations()

  const [currentType, setCurrentType] = useState<LocationType>(initialType)
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [selectedFloor, setSelectedFloor] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    floorCount: 1,
    floorNumber: 1,
    areaSqm: '',
    roomNumber: '',
    roomType: '',
    capacity: '',
    operatingHoursStart: 8,
    operatingHoursEnd: 18
  })

  const isEditing = !!editItem

  // Reset and initialize form
  useEffect(() => {
    setCurrentType(initialType)
    
    if (isOpen) {
      if (isEditing && editItem) {
        // Pre-populate form with existing data
        switch (initialType) {
          case 'site':
            const site = editItem as Site
            setFormData({
              name: site.name,
              description: site.description || '',
              address: site.address,
              latitude: site.latitude?.toString() || '',
              longitude: site.longitude?.toString() || '',
              floorCount: 1,
              floorNumber: 1,
              areaSqm: '',
              roomNumber: '',
              roomType: '',
              capacity: '',
              operatingHoursStart: 8,
              operatingHoursEnd: 18
            })
            break
          case 'building':
            const building = editItem as Building
            setFormData({
              name: building.name,
              description: building.description || '',
              address: '',
              latitude: '',
              longitude: '',
              floorCount: building.floor_count || 1,
              floorNumber: 1,
              areaSqm: '',
              roomNumber: '',
              roomType: '',
              capacity: '',
              operatingHoursStart: 8,
              operatingHoursEnd: 18
            })
            setSelectedSite(building.site_id)
            break
          case 'floor':
            const floor = editItem as Floor
            setFormData({
              name: floor.name || '',
              description: '',
              address: '',
              latitude: '',
              longitude: '',
              floorCount: 1,
              floorNumber: floor.floor_number,
              areaSqm: floor.area_sqm?.toString() || '',
              roomNumber: '',
              roomType: '',
              capacity: '',
              operatingHoursStart: 8,
              operatingHoursEnd: 18
            })
            setSelectedBuilding(floor.building_id)
            const floorBuilding = buildings.find(b => b.id === floor.building_id)
            if (floorBuilding) {
              setSelectedSite(floorBuilding.site_id)
            }
            break
          case 'room':
            const room = editItem as Room
            setFormData({
              name: room.name,
              description: room.description || '',
              address: '',
              latitude: '',
              longitude: '',
              floorCount: 1,
              floorNumber: 1,
              areaSqm: room.area_sqm?.toString() || '',
              roomNumber: room.room_number || '',
              roomType: room.room_type || '',
              capacity: room.capacity?.toString() || '',
              operatingHoursStart: room.operating_hours_start ?? 8,
              operatingHoursEnd: room.operating_hours_end ?? 18
            })
            setSelectedFloor(room.floor_id)
            const roomFloor = floors.find(f => f.id === room.floor_id)
            if (roomFloor) {
              setSelectedBuilding(roomFloor.building_id)
              const roomBuilding = buildings.find(b => b.id === roomFloor.building_id)
              if (roomBuilding) {
                setSelectedSite(roomBuilding.site_id)
              }
            }
            break
        }
      } else {
        // Reset for new creation
        setFormData({
          name: '',
          description: '',
          address: '',
          latitude: '',
          longitude: '',
          floorCount: 1,
          floorNumber: 1,
          areaSqm: '',
          roomNumber: '',
          roomType: '',
          capacity: '',
          operatingHoursStart: 8,
          operatingHoursEnd: 18
        })
        setSelectedSite('')
        setSelectedBuilding('')
        setSelectedFloor('')
        
        // Pre-select parent based on type and parentId
        if (parentId) {
          switch (initialType) {
            case 'building':
              setSelectedSite(parentId)
              break
            case 'floor':
              setSelectedBuilding(parentId)
              const building = buildings.find(b => b.id === parentId)
              if (building) {
                setSelectedSite(building.site_id)
              }
              break
            case 'room':
              setSelectedFloor(parentId)
              const floor = floors.find(f => f.id === parentId)
              if (floor) {
                setSelectedBuilding(floor.building_id)
                const parentBuilding = buildings.find(b => b.id === floor.building_id)
                if (parentBuilding) {
                  setSelectedSite(parentBuilding.site_id)
                }
              }
              break
          }
        }
      }
    }
  }, [isOpen, initialType, parentId, editItem, isEditing, buildings, floors])

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        floorCount: 1,
        floorNumber: 1,
        areaSqm: '',
        roomNumber: '',
        roomType: '',
        capacity: '',
        operatingHoursStart: 8,
        operatingHoursEnd: 18
      })
      setSelectedSite('')
      setSelectedBuilding('')
      setSelectedFloor('')
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Validate based on location type
    if (currentType === 'site' && !isEditing) {
      const siteData = {
        name: formData.name,
        address: formData.address,
        description: formData.description || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      }
      
      const result = validateAndSanitize(CreateSiteSchema, siteData)
      if (!result.success && 'errors' in result) {
        result.errors.forEach(err => {
          const [field, ...messageParts] = err.split(': ')
          errors[field] = messageParts.join(': ')
        })
      }
    } else if (currentType === 'building' && !isEditing) {
      const buildingData = {
        name: formData.name,
        description: formData.description || undefined,
        site_id: selectedSite,
        floor_count: formData.floorCount,
      }
      
      const result = validateAndSanitize(CreateBuildingSchema, buildingData)
      if (!result.success && 'errors' in result) {
        result.errors.forEach(err => {
          const [field, ...messageParts] = err.split(': ')
          errors[field] = messageParts.join(': ')
        })
      }
      
      if (!selectedSite) {
        errors['site_id'] = 'Please select a site'
      }
    } else if (currentType === 'floor' && !isEditing) {
      if (!formData.name && formData.floorNumber === undefined) {
        errors['name'] = 'Floor name or number is required'
      }
      if (!selectedBuilding) {
        errors['building_id'] = 'Please select a building'
      }
    } else if (currentType === 'room' && !isEditing) {
      if (!formData.name) {
        errors['name'] = 'Room name is required'
      }
      if (!selectedFloor) {
        errors['floor_id'] = 'Please select a floor'
      }
      if (formData.operatingHoursEnd <= formData.operatingHoursStart) {
        errors['operating_hours'] = 'End time must be after start time'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const extractSupabaseError = (error: any): string => {
    console.error('Supabase error details:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    })

    // Check for specific error codes
    if (error?.code === 'PGRST301' || error?.code === '42501') {
      return 'Permission denied. You need admin privileges to perform this action.'
    }
    
    if (error?.code === '23505') {
      return 'A location with this name already exists. Please use a different name.'
    }
    
    if (error?.code === '23503') {
      return 'Invalid parent location selected. Please refresh and try again.'
    }
    
    if (error?.message?.includes('violates row-level security')) {
      return 'Access denied. Please ensure you are logged in as an admin.'
    }
    
    if (error?.message?.includes('duplicate key')) {
      return 'A location with this name already exists.'
    }
    
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }

    return error?.message || 'An unexpected error occurred. Please try again.'
  }

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🚀 Starting form submission:', {
        currentType,
        isEditing,
        formData,
        selectedSite,
        selectedBuilding,
        selectedFloor,
      })

      if (isEditing && editItem) {
        console.log('📝 Updating existing item:', editItem.id)
        // Update existing item
        switch (currentType) {
          case 'site':
            await updateSite(editItem.id, {
              name: formData.name,
              description: formData.description,
              address: formData.address,
              latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
              longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
            })
            break
          case 'building':
            await updateBuilding(editItem.id, {
              name: formData.name,
              description: formData.description,
              floor_count: formData.floorCount,
              site_id: selectedSite,
            })
            break
          case 'floor':
            await updateFloor(editItem.id, {
              floor_number: formData.floorNumber,
              name: formData.name,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
              building_id: selectedBuilding,
            })
            break
          case 'room':
            await updateRoom(editItem.id, {
              name: formData.name,
              description: formData.description,
              room_number: formData.roomNumber,
              room_type: formData.roomType,
              capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
              floor_id: selectedFloor,
              operating_hours_start: formData.operatingHoursStart,
              operating_hours_end: formData.operatingHoursEnd,
            })
            break
        }
        console.log('✅ Update successful')
      } else {
        console.log('➕ Creating new item')
        // Create new item
        switch (currentType) {
          case 'site':
            console.log('Creating site with data:', {
              name: formData.name,
              description: formData.description,
              address: formData.address,
              latitude: formData.latitude,
              longitude: formData.longitude,
            })
            await createSite({
              name: formData.name,
              description: formData.description,
              address: formData.address,
              latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
              longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
            })
            break
          case 'building':
            await createBuilding({
              name: formData.name,
              description: formData.description,
              floor_count: formData.floorCount,
              site_id: selectedSite,
            })
            break
          case 'floor':
            await createFloor({
              floor_number: formData.floorNumber,
              name: formData.name,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
              building_id: selectedBuilding,
            })
            break
          case 'room':
            await createRoom({
              name: formData.name,
              description: formData.description,
              room_number: formData.roomNumber,
              room_type: formData.roomType,
              capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
              floor_id: selectedFloor,
              operating_hours_start: formData.operatingHoursStart,
              operating_hours_end: formData.operatingHoursEnd,
            })
            break
        }
        console.log('✅ Creation successful')
      }
      
      setValidationErrors({})
      onClose()
    } catch (error: any) {
      console.error('❌ Failed to save location:', error)
      const errorMessage = extractSupabaseError(error)
      toast.error(errorMessage, {
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = () => {
    if (!formData.name) return false
    
    switch (currentType) {
      case 'site':
        return !!formData.address
      case 'building':
        return !!selectedSite
      case 'floor':
        return !!selectedBuilding
      case 'room':
        return !!selectedFloor && formData.operatingHoursEnd > formData.operatingHoursStart
      default:
        return false
    }
  }

  const availableBuildings = getBuildingsBySite(selectedSite)
  const availableFloors = getFloorsByBuilding(selectedBuilding)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit' : 'Create'} {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this' : 'Add a new'} {currentType} {isEditing ? '' : 'to your location hierarchy'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Site Selection for Building/Floor/Room */}
          {(currentType === 'building' || currentType === 'floor' || currentType === 'room') && !isEditing && (
            <div className="space-y-2">
              <Label htmlFor="site">Site *</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Building Selection for Floor/Room */}
          {(currentType === 'floor' || currentType === 'room') && !isEditing && (
            <div className="space-y-2">
              <Label htmlFor="building">Building *</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding} disabled={!selectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {availableBuildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Floor Selection for Room */}
          {currentType === 'room' && !isEditing && (
            <div className="space-y-2">
              <Label htmlFor="floor">Floor *</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor} disabled={!selectedBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a floor" />
                </SelectTrigger>
                <SelectContent>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name || `Floor ${floor.floor_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {currentType === 'site' ? 'Site' : currentType.charAt(0).toUpperCase() + currentType.slice(1)} Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                setValidationErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder={`Enter ${currentType} name`}
              disabled={isSubmitting}
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

          {/* Site-specific fields */}
          {currentType === 'site' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, address: e.target.value }))
                    setValidationErrors(prev => ({ ...prev, address: '' }))
                  }}
                  placeholder="Enter address"
                  disabled={isSubmitting}
                />
                {validationErrors.address && (
                  <p className="text-sm text-destructive">{validationErrors.address}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="24.4539"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="54.3773"
                  />
                </div>
              </div>
            </>
          )}

          {/* Building-specific fields */}
          {currentType === 'building' && (
            <div className="space-y-2">
              <Label htmlFor="floorCount">Floor Count</Label>
              <Input
                id="floorCount"
                type="number"
                min="1"
                value={formData.floorCount}
                onChange={(e) => setFormData(prev => ({ ...prev, floorCount: parseInt(e.target.value) || 1 }))}
              />
            </div>
          )}

          {/* Floor-specific fields */}
          {currentType === 'floor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="floorNumber">Floor Number *</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  min="0"
                  value={formData.floorNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorNumber: parseInt(e.target.value) || 0 }))}
                  placeholder="0 for Ground Floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaSqm">Area (sq m)</Label>
                <Input
                  id="areaSqm"
                  type="number"
                  step="0.1"
                  value={formData.areaSqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, areaSqm: e.target.value }))}
                />
              </div>
            </>
          )}

          {/* Room-specific fields */}
          {currentType === 'room' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <Input
                  id="roomType"
                  value={formData.roomType}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
                  placeholder="Classroom, Lab, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operatingHoursStart">Operating Hours Start (0-23)</Label>
                  <Input
                    id="operatingHoursStart"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.operatingHoursStart}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, operatingHoursStart: Math.min(23, Math.max(0, val)) }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatingHoursEnd">Operating Hours End (0-23)</Label>
                  <Input
                    id="operatingHoursEnd"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.operatingHoursEnd}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, operatingHoursEnd: Math.min(23, Math.max(0, val)) }));
                    }}
                  />
                </div>
              </div>
              {formData.operatingHoursEnd <= formData.operatingHoursStart && (
                <p className="text-sm text-destructive">End hour must be after start hour</p>
              )}
            </>
          )}

          {/* Description field (for all except floors) */}
          {currentType !== 'floor' && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
