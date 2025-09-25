import React, { useState } from 'react'
import { useLocations, Site, Building, Block, Floor, Room } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Building2, 
  Square, 
  Layers,
  DoorOpen,
  Plus,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface LocationTreeProps {
  onEditSite: (site: Site) => void
  onEditBuilding: (building: Building) => void
  onEditBlock: (block: Block) => void
  onEditFloor: (floor: Floor) => void
  onEditRoom: (room: Room) => void
  onAddBuilding: (siteId: string) => void
  onAddBlock: (buildingId: string) => void
  onAddFloor: (blockOrBuildingId: string) => void
  onAddRoom: (floorId: string) => void
}

export function LocationTree({
  onEditSite,
  onEditBuilding,
  onEditBlock,
  onEditFloor,
  onEditRoom,
  onAddBuilding,
  onAddBlock,
  onAddFloor,
  onAddRoom,
}: LocationTreeProps) {
  const { 
    sites, 
    buildings,
    blocks,
    floors,
    rooms,
    getBuildingsBySite, 
    getBlocksByBuilding, 
    getFloorsByBlock,
    getFloorsByBuilding,
    getRoomsByFloor,
    deleteSite,
    deleteBuilding,
    deleteBlock,
    deleteFloor,
    deleteRoom,
    loading
  } = useLocations()

  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set())
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'site' | 'building' | 'block' | 'floor' | 'room'
    item: any
    title: string
    description: string
  }>({ open: false, type: 'site', item: null, title: '', description: '' })

  const toggleSiteExpanded = (siteId: string) => {
    setExpandedSites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(siteId)) {
        newSet.delete(siteId)
      } else {
        newSet.add(siteId)
      }
      return newSet
    })
  }

  const toggleBuildingExpanded = (buildingId: string) => {
    setExpandedBuildings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(buildingId)) {
        newSet.delete(buildingId)
      } else {
        newSet.add(buildingId)
      }
      return newSet
    })
  }

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(blockId)) {
        newSet.delete(blockId)
      } else {
        newSet.add(blockId)
      }
      return newSet
    })
  }

  const toggleFloorExpanded = (floorId: string) => {
    setExpandedFloors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(floorId)) {
        newSet.delete(floorId)
      } else {
        newSet.add(floorId)
      }
      return newSet
    })
  }

  const handleDelete = (type: 'site' | 'building' | 'block' | 'floor' | 'room', item: any) => {
    let title = ''
    let description = ''
    
    switch (type) {
      case 'site':
        title = `Delete Site: ${item.name}`
        description = `This will permanently delete the site "${item.name}" and all its buildings, blocks, floors, and rooms. This action cannot be undone.`
        break
      case 'building':
        title = `Delete Building: ${item.name}`
        description = `This will permanently delete the building "${item.name}" and all its blocks, floors, and rooms. This action cannot be undone.`
        break
      case 'block':
        title = `Delete Block: ${item.name}`
        description = `This will permanently delete the block "${item.name}" and all its floors and rooms. This action cannot be undone.`
        break
      case 'floor':
        title = `Delete Floor: ${item.name || `Floor ${item.floor_number}`}`
        description = `This will permanently delete this floor and all its rooms. This action cannot be undone.`
        break
      case 'room':
        title = `Delete Room: ${item.name}`
        description = `This will permanently delete the room "${item.name}" and any devices assigned to it. This action cannot be undone.`
        break
    }

    setDeleteDialog({ open: true, type, item, title, description })
  }

  const confirmDelete = async () => {
    const { type, item } = deleteDialog
    
    try {
      switch (type) {
        case 'site':
          await deleteSite(item.id)
          break
        case 'building':
          await deleteBuilding(item.id)
          break
        case 'block':
          await deleteBlock(item.id)
          break
        case 'floor':
          await deleteFloor(item.id)
          break
        case 'room':
          await deleteRoom(item.id)
          break
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
    
    setDeleteDialog({ open: false, type: 'site', item: null, title: '', description: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No sites configured yet</p>
        <p className="text-sm">Add your first site to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sites.map((site) => {
        const siteBuildings = getBuildingsBySite(site.id)
        const isExpanded = expandedSites.has(site.id)

        return (
          <div key={site.id} className="border rounded-lg bg-card">
            {/* Site Header */}
            <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSiteExpanded(site.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                
                <MapPin className="h-5 w-5 text-primary" />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{site.name}</span>
                    <Badge variant="secondary">{siteBuildings.length} buildings</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{site.address}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBuilding(site.id)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditSite(site)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete('site', site)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Buildings */}
            {isExpanded && (
              <div className="pl-6 pb-2">
                {siteBuildings.map((building) => {
                  const buildingBlocks = getBlocksByBuilding(building.id)
                  const buildingFloors = getFloorsByBuilding(building.id)
                  const isBuildingExpanded = expandedBuildings.has(building.id)
                  const hasBlocks = buildingBlocks.length > 0
                  const hasDirectFloors = buildingFloors.length > 0

                  return (
                    <div key={building.id} className="border-l-2 border-muted ml-2 pl-4 py-1">
                      {/* Building Header */}
                      <div className="flex items-center justify-between py-2 hover:bg-muted/30 rounded px-2 -ml-2">
                        <div className="flex items-center space-x-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBuildingExpanded(building.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isBuildingExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Building2 className="h-4 w-4 text-success" />
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{building.name}</span>
                              {hasBlocks && (
                                <Badge variant="outline" className="text-xs">
                                  {buildingBlocks.length} blocks
                                </Badge>
                              )}
                              {hasDirectFloors && (
                                <Badge variant="outline" className="text-xs">
                                  {buildingFloors.length} floors
                                </Badge>
                              )}
                            </div>
                            {building.description && (
                              <p className="text-xs text-muted-foreground">{building.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {!hasBlocks && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAddFloor(building.id)}
                              className="h-6 w-6 p-0"
                              title="Add Floor"
                            >
                              <Layers className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddBlock(building.id)}
                            className="h-6 w-6 p-0"
                            title="Add Block"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditBuilding(building)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete('building', building)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Building Content - Blocks OR Direct Floors */}
                      {isBuildingExpanded && (
                        <div className="pl-6">
                          {/* Blocks (if any) */}
                          {buildingBlocks.map((block) => {
                            const blockFloors = getFloorsByBlock(block.id)
                            const isBlockExpanded = expandedBlocks.has(block.id)

                            return (
                              <div key={block.id} className="border-l-2 border-muted ml-2 pl-4 py-1">
                                {/* Block Header */}
                                <div className="flex items-center justify-between py-2 hover:bg-muted/20 rounded px-2 -ml-2">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleBlockExpanded(block.id)}
                                      className="h-5 w-5 p-0"
                                    >
                                      {isBlockExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </Button>
                                    
                                    <Square className="h-3 w-3 text-warning" />
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-xs">{block.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {blockFloors.length} floors
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onAddFloor(block.id)}
                                      className="h-5 w-5 p-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEditBlock(block)}
                                      className="h-5 w-5 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete('block', block)}
                                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Floors in Block */}
                                {isBlockExpanded && (
                                  <div className="pl-6">
                                    {blockFloors.map((floor) => {
                                      const floorRooms = getRoomsByFloor(floor.id)
                                      const isFloorExpanded = expandedFloors.has(floor.id)

                                      return (
                                        <div key={floor.id}>
                                          <div className="flex items-center justify-between py-1 hover:bg-muted/10 rounded px-2 -ml-2">
                                            <div className="flex items-center space-x-3 flex-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleFloorExpanded(floor.id)}
                                                className="h-5 w-5 p-0"
                                              >
                                                {isFloorExpanded ? (
                                                  <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3" />
                                                )}
                                              </Button>
                                              <Layers className="h-3 w-3 text-accent-foreground" />
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs font-medium">
                                                    {floor.name || `Floor ${floor.floor_number}`}
                                                  </span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {floorRooms.length} rooms
                                                  </Badge>
                                                </div>
                                                {floor.area_sqm && (
                                                  <span className="text-xs text-muted-foreground">
                                                    ({floor.area_sqm} m²)
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onAddRoom(floor.id)}
                                                className="h-5 w-5 p-0"
                                              >
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditFloor(floor)}
                                                className="h-5 w-5 p-0"
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete('floor', floor)}
                                                className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>

                                          {/* Rooms */}
                                          {isFloorExpanded && (
                                            <div className="pl-6">
                                              {floorRooms.map((room) => (
                                                <div key={room.id} className="flex items-center justify-between py-1 hover:bg-muted/5 rounded px-2 -ml-2">
                                                  <div className="flex items-center space-x-3 flex-1">
                                                    <div className="w-5" /> {/* Spacer */}
                                                    <DoorOpen className="h-3 w-3 text-secondary-foreground" />
                                                    <div className="flex-1">
                                                      <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-medium">{room.name}</span>
                                                        {room.room_type && (
                                                          <Badge variant="outline" className="text-xs">
                                                            {room.room_type}
                                                          </Badge>
                                                        )}
                                                      </div>
                                                      {(room.area_sqm || room.capacity) && (
                                                        <div className="text-xs text-muted-foreground">
                                                          {room.area_sqm && `${room.area_sqm} m²`}
                                                          {room.area_sqm && room.capacity && ' • '}
                                                          {room.capacity && `${room.capacity} people`}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center space-x-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => onEditRoom(room)}
                                                      className="h-5 w-5 p-0"
                                                    >
                                                      <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDelete('room', room)}
                                                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                              
                                              {floorRooms.length === 0 && (
                                                <div className="text-xs text-muted-foreground italic py-2 pl-8">
                                                  No rooms added yet
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                    
                                    {blockFloors.length === 0 && (
                                      <div className="text-xs text-muted-foreground italic py-2 pl-8">
                                        No floors added yet
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Direct Floors (no blocks) */}
                          {buildingFloors.map((floor) => {
                            const floorRooms = getRoomsByFloor(floor.id)
                            const isFloorExpanded = expandedFloors.has(floor.id)

                            return (
                              <div key={floor.id} className="border-l-2 border-muted ml-2 pl-4 py-1">
                                <div className="flex items-center justify-between py-2 hover:bg-muted/20 rounded px-2 -ml-2">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleFloorExpanded(floor.id)}
                                      className="h-5 w-5 p-0"
                                    >
                                      {isFloorExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Layers className="h-3 w-3 text-accent-foreground" />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium">
                                          {floor.name || `Floor ${floor.floor_number}`}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {floorRooms.length} rooms
                                        </Badge>
                                      </div>
                                      {floor.area_sqm && (
                                        <span className="text-xs text-muted-foreground">
                                          ({floor.area_sqm} m²)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onAddRoom(floor.id)}
                                      className="h-5 w-5 p-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEditFloor(floor)}
                                      className="h-5 w-5 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete('floor', floor)}
                                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Rooms */}
                                {isFloorExpanded && (
                                  <div className="pl-6">
                                    {floorRooms.map((room) => (
                                      <div key={room.id} className="flex items-center justify-between py-1 hover:bg-muted/5 rounded px-2 -ml-2">
                                        <div className="flex items-center space-x-3 flex-1">
                                          <div className="w-5" /> {/* Spacer */}
                                          <DoorOpen className="h-3 w-3 text-secondary-foreground" />
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-medium">{room.name}</span>
                                              {room.room_type && (
                                                <Badge variant="outline" className="text-xs">
                                                  {room.room_type}
                                                </Badge>
                                              )}
                                            </div>
                                            {(room.area_sqm || room.capacity) && (
                                              <div className="text-xs text-muted-foreground">
                                                {room.area_sqm && `${room.area_sqm} m²`}
                                                {room.area_sqm && room.capacity && ' • '}
                                                {room.capacity && `${room.capacity} people`}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEditRoom(room)}
                                            className="h-5 w-5 p-0"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete('room', room)}
                                            className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {floorRooms.length === 0 && (
                                      <div className="text-xs text-muted-foreground italic py-2 pl-8">
                                        No rooms added yet
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          
                          {buildingBlocks.length === 0 && buildingFloors.length === 0 && (
                            <div className="text-xs text-muted-foreground italic py-2 pl-6">
                              No blocks or floors added yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {siteBuildings.length === 0 && (
                  <div className="text-xs text-muted-foreground italic py-2 pl-6">
                    No buildings added yet
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>{deleteDialog.title}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}