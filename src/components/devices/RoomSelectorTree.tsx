import React, { useState, useMemo } from 'react'
import { useLocations } from '@/hooks/useLocations'
import { useDevices } from '@/hooks/useDevices'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  Layers,
  DoorOpen,
  Search,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomSelectorTreeProps {
  selectedRoomId?: string
  onSelectRoom: (roomId: string, floorId: string) => void
  showDeviceCounts?: boolean
}

export function RoomSelectorTree({
  selectedRoomId,
  onSelectRoom,
  showDeviceCounts = true
}: RoomSelectorTreeProps) {
  const { sites, buildings, floors, rooms, getBuildingsBySite, getFloorsByBuilding, getRoomsByFloor } = useLocations()
  const { devices } = useDevices()
  
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set())
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate device counts per room
  const roomDeviceCounts = useMemo(() => {
    const counts = new Map<string, number>()
    devices.forEach(device => {
      if (device.room_id) {
        counts.set(device.room_id, (counts.get(device.room_id) || 0) + 1)
      }
    })
    return counts
  }, [devices])

  const toggleSite = (siteId: string) => {
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

  const toggleBuilding = (buildingId: string) => {
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

  const toggleFloor = (floorId: string) => {
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

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms
    const query = searchQuery.toLowerCase()
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.room_number?.toLowerCase().includes(query)
    )
  }, [rooms, searchQuery])

  // Auto-expand parents of filtered rooms
  useMemo(() => {
    if (searchQuery) {
      const floorIds = new Set<string>()
      const buildingIds = new Set<string>()
      const siteIds = new Set<string>()

      filteredRooms.forEach(room => {
        const floor = floors.find(f => f.id === room.floor_id)
        if (floor) {
          floorIds.add(floor.id)
          const building = buildings.find(b => b.id === floor.building_id)
          if (building) {
            buildingIds.add(building.id)
            const site = sites.find(s => s.id === building.site_id)
            if (site) {
              siteIds.add(site.id)
            }
          }
        }
      })

      setExpandedFloors(floorIds)
      setExpandedBuildings(buildingIds)
      setExpandedSites(siteIds)
    }
  }, [searchQuery, filteredRooms, floors, buildings, sites])

  if (sites.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No locations configured</p>
        <p className="text-sm">Please add sites and rooms first</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tree */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {sites.map(site => {
            const siteBuildings = getBuildingsBySite(site.id)
            const isExpanded = expandedSites.has(site.id)

            return (
              <div key={site.id} className="border rounded-lg bg-card">
                {/* Site */}
                <div className="flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSite(site.id)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium flex-1">{site.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {siteBuildings.length}
                  </Badge>
                </div>

                {/* Buildings */}
                {isExpanded && (
                  <div className="pl-6 pb-2">
                    {siteBuildings.map(building => {
                      const buildingFloors = getFloorsByBuilding(building.id)
                      const isBuildingExpanded = expandedBuildings.has(building.id)

                      return (
                        <div key={building.id} className="border-l-2 border-muted ml-2 pl-3 py-1">
                          <div className="flex items-center gap-2 py-1 hover:bg-muted/30 rounded px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBuilding(building.id)}
                              className="h-5 w-5 p-0"
                            >
                              {isBuildingExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                            <Building2 className="h-3 w-3 text-success" />
                            <span className="text-xs font-medium flex-1">{building.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {buildingFloors.length}
                            </Badge>
                          </div>

                          {/* Floors */}
                          {isBuildingExpanded && (
                            <div className="pl-5">
                              {buildingFloors.map(floor => {
                                const floorRooms = getRoomsByFloor(floor.id).filter(r =>
                                  !searchQuery || filteredRooms.some(fr => fr.id === r.id)
                                )
                                const isFloorExpanded = expandedFloors.has(floor.id)

                                return (
                                  <div key={floor.id} className="border-l-2 border-muted ml-2 pl-3 py-1">
                                    <div className="flex items-center gap-2 py-1 hover:bg-muted/10 rounded px-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFloor(floor.id)}
                                        className="h-4 w-4 p-0"
                                      >
                                        {isFloorExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Layers className="h-3 w-3 text-accent" />
                                      <span className="text-xs flex-1">
                                        {floor.name || `Floor ${floor.floor_number}`}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {floorRooms.length}
                                      </Badge>
                                    </div>

                                    {/* Rooms */}
                                    {isFloorExpanded && (
                                      <div className="pl-5">
                                        {floorRooms.map(room => {
                                          const isSelected = selectedRoomId === room.id
                                          const deviceCount = roomDeviceCounts.get(room.id) || 0

                                          return (
                                            <button
                                              key={room.id}
                                              onClick={() => onSelectRoom(room.id, floor.id)}
                                              className={cn(
                                                "w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-primary/10 transition-colors text-left",
                                                isSelected && "bg-primary/20 hover:bg-primary/20"
                                              )}
                                            >
                                              <DoorOpen className={cn(
                                                "h-3 w-3 ml-5",
                                                isSelected ? "text-primary" : "text-info"
                                              )} />
                                              <span className={cn(
                                                "text-xs flex-1",
                                                isSelected && "font-medium"
                                              )}>
                                                {room.name}
                                              </span>
                                              {showDeviceCounts && deviceCount > 0 && (
                                                <Badge variant="secondary" className="text-xs h-5">
                                                  {deviceCount}
                                                </Badge>
                                              )}
                                              {isSelected && (
                                                <CheckCircle2 className="h-3 w-3 text-primary" />
                                              )}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
