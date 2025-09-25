import React, { useState, useEffect } from 'react'
import { useLocations, Site, Building, Block, Floor, Room } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit } from 'lucide-react'

type LocationType = 'site' | 'building' | 'block' | 'floor' | 'room'

interface LocationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialType: LocationType
  parentId?: string
  editItem?: Site | Building | Block | Floor | Room | null
}

export function LocationWizard({ isOpen, onClose, initialType, parentId, editItem }: LocationWizardProps) {
  const { 
    sites, 
    buildings, 
    blocks, 
    floors,
    rooms,
    createSite, 
    createBuilding, 
    createBlock, 
    createFloor,
    createRoom,
    updateSite,
    updateBuilding,
    updateBlock,
    updateFloor,
    updateRoom,
    getBuildingsBySite,
    getBlocksByBuilding,
    getFloorsByBlock,
    getRoomsByFloor
  } = useLocations()

  const [currentType, setCurrentType] = useState<LocationType>(initialType)
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [selectedBlock, setSelectedBlock] = useState<string>('')
  const [selectedFloor, setSelectedFloor] = useState<string>('')
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
    capacity: ''
  })

  const isEditing = !!editItem

  // Reset and initialize form when wizard opens/closes or props change
  useEffect(() => {
    // Always update currentType when initialType changes
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
              capacity: ''
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
              capacity: ''
            })
            setSelectedSite(building.site_id)
            break
          case 'block':
            const block = editItem as Block
            setFormData({
              name: block.name,
              description: block.description || '',
              address: '',
              latitude: '',
              longitude: '',
              floorCount: 1,
              floorNumber: 1,
              areaSqm: '',
              roomNumber: '',
              roomType: '',
              capacity: ''
            })
            setSelectedBuilding(block.building_id)
            // Find the site for this building
            const blockBuilding = buildings.find(b => b.id === block.building_id)
            if (blockBuilding) {
              setSelectedSite(blockBuilding.site_id)
            }
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
              capacity: ''
            })
            if (floor.block_id) {
              setSelectedBlock(floor.block_id)
              const floorBlock = blocks.find(b => b.id === floor.block_id)
              if (floorBlock?.building) {
                setSelectedBuilding(floorBlock.building.id)
                setSelectedSite(floorBlock.building.site_id)
              }
            } else if (floor.building_id) {
              setSelectedBuilding(floor.building_id)
              const floorBuilding = buildings.find(b => b.id === floor.building_id)
              if (floorBuilding) {
                setSelectedSite(floorBuilding.site_id)
              }
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
              capacity: room.capacity?.toString() || ''
            })
            setSelectedFloor(room.floor_id)
            // Find parent hierarchies
            const roomFloor = floors.find(f => f.id === room.floor_id)
            if (roomFloor?.block_id) {
              setSelectedBlock(roomFloor.block_id)
              const roomBlock = blocks.find(b => b.id === roomFloor.block_id)
              if (roomBlock) {
                setSelectedBuilding(roomBlock.building_id)
                setSelectedSite(roomBlock.building?.site_id || '')
              }
            } else if (roomFloor?.building_id) {
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
          capacity: ''
        })
        setSelectedSite('')
        setSelectedBuilding('')
        setSelectedBlock('')
        setSelectedFloor('')
        
        // Pre-select parent based on type and parentId
        if (parentId) {
          switch (initialType) {
            case 'building':
              setSelectedSite(parentId)
              break
            case 'block':
              setSelectedBuilding(parentId)
              // Find the site for this building
              const building = buildings.find(b => b.id === parentId)
              if (building) {
                setSelectedSite(building.site_id)
              }
              break
            case 'floor':
              // Check if parentId is a block or building
              const parentBlock = blocks.find(b => b.id === parentId)
              if (parentBlock) {
                setSelectedBlock(parentId)
                setSelectedBuilding(parentBlock.building_id)
                setSelectedSite(parentBlock.building?.site_id || '')
              } else {
                // Direct to building
                setSelectedBuilding(parentId)
                const parentBuilding = buildings.find(b => b.id === parentId)
                if (parentBuilding) {
                  setSelectedSite(parentBuilding.site_id)
                }
              }
              break
            case 'room':
              setSelectedFloor(parentId)
              // Find parent hierarchies for the floor
              const floor = floors.find(f => f.id === parentId)
              if (floor?.block_id) {
                setSelectedBlock(floor.block_id)
                const block = blocks.find(b => b.id === floor.block_id)
                if (block) {
                  setSelectedBuilding(block.building_id)
                  setSelectedSite(block.building?.site_id || '')
                }
              } else if (floor?.building_id) {
                setSelectedBuilding(floor.building_id)
                const building = buildings.find(b => b.id === floor.building_id)
                if (building) {
                  setSelectedSite(building.site_id)
                }
              }
              break
          }
        }
      }
    }
  }, [isOpen, initialType, parentId, editItem, isEditing, buildings, blocks, floors])

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
        capacity: ''
      })
      setSelectedSite('')
      setSelectedBuilding('')
      setSelectedBlock('')
      setSelectedFloor('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    try {
      if (isEditing && editItem) {
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
          case 'block':
            await updateBlock(editItem.id, {
              name: formData.name,
              description: formData.description,
              building_id: selectedBuilding,
            })
            break
          case 'floor':
            // Support both block-based and building-based floors
            const floorData: any = {
              floor_number: formData.floorNumber,
              name: formData.name,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
            }
            
            if (selectedBlock) {
              floorData.block_id = selectedBlock
            } else {
              floorData.building_id = selectedBuilding
            }
            
            await updateFloor(editItem.id, floorData)
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
            })
            break
        }
      } else {
        // Create new item
        switch (currentType) {
          case 'site':
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
          case 'block':
            await createBlock({
              name: formData.name,
              description: formData.description,
              building_id: selectedBuilding,
            })
            break
          case 'floor':
            // Support both block-based and building-based floors
            const newFloorData: any = {
              floor_number: formData.floorNumber,
              name: formData.name,
              area_sqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
            }
            
            if (selectedBlock) {
              newFloorData.block_id = selectedBlock
            } else {
              newFloorData.building_id = selectedBuilding
            }
            
            await createFloor(newFloorData)
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
            })
            break
        }
      }
      onClose()
    } catch (error) {
      console.error('Failed to save location:', error)
    }
  }

  const canSubmit = () => {
    if (!formData.name) return false
    
    switch (currentType) {
      case 'site':
        return !!formData.address
      case 'building':
        return !!selectedSite
      case 'block':
        return !!selectedBuilding
      case 'floor':
        return selectedBlock || selectedBuilding // Either block or building is required
      case 'room':
        return !!selectedFloor
      default:
        return false
    }
  }

  const availableBuildings = getBuildingsBySite(selectedSite)
  const availableBlocks = getBlocksByBuilding(selectedBuilding)
  const availableFloors = selectedBlock ? getFloorsByBlock(selectedBlock) : floors.filter(f => f.building_id === selectedBuilding)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          {/* Site Selection for Building/Block/Floor/Room */}
          {(currentType === 'building' || currentType === 'block' || currentType === 'floor' || currentType === 'room') && !isEditing && (
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

          {/* Building Selection for Block/Floor/Room */}
          {(currentType === 'block' || currentType === 'floor' || currentType === 'room') && !isEditing && (
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

          {/* Block Selection for Floor/Room (Optional) */}
          {(currentType === 'floor' || currentType === 'room') && !isEditing && (
            <div className="space-y-2">
              <Label htmlFor="block">Block (Optional)</Label>
              <Select value={selectedBlock} onValueChange={setSelectedBlock} disabled={!selectedBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a block (or skip for direct floor-to-building)" />
                </SelectTrigger>
                <SelectContent>
                  {availableBlocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
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

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter ${currentType} name`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={`Enter ${currentType} description`}
              rows={2}
            />
          </div>

          {/* Site-specific fields */}
          {currentType === 'site' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter site address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="25.2048"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="55.2708"
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
                  value={formData.floorNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorNumber: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaSqm">Area (m²)</Label>
                <Input
                  id="areaSqm"
                  type="number"
                  step="0.1"
                  value={formData.areaSqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, areaSqm: e.target.value }))}
                  placeholder="Floor area in square meters"
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
                  placeholder="e.g., 101, A-205"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={formData.roomType} onValueChange={(value) => setFormData(prev => ({ ...prev, roomType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="lab">Laboratory</SelectItem>
                    <SelectItem value="auditorium">Auditorium</SelectItem>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="meeting">Meeting Room</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="Number of people"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomAreaSqm">Area (m²)</Label>
                  <Input
                    id="roomAreaSqm"
                    type="number"
                    step="0.1"
                    value={formData.areaSqm}
                    onChange={(e) => setFormData(prev => ({ ...prev, areaSqm: e.target.value }))}
                    placeholder="Room area"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            {isEditing ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Update {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}