import React, { useState, useEffect } from 'react'
import { Device } from '@/hooks/useDevices'
import { useLocations } from '@/hooks/useLocations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, Home, DoorOpen } from 'lucide-react'

interface DeviceAllocationModalProps {
  device: Device | null
  open: boolean
  onClose: () => void
  onAllocate: (deviceId: string, floorId: string, roomId: string) => void
}

export function DeviceAllocationModal({
  device,
  open,
  onClose,
  onAllocate,
}: DeviceAllocationModalProps) {
  const { sites, buildings, floors, rooms, getBuildingsBySite, getFloorsByBuilding, getRoomsByFloor } = useLocations()
  
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')

  // Reset selections when modal opens/closes or device changes
  useEffect(() => {
    if (!open || !device) {
      setSelectedSite('')
      setSelectedBuilding('')
      setSelectedFloor('')
      setSelectedRoom('')
    }
  }, [open, device])

  const filteredBuildings = selectedSite ? getBuildingsBySite(selectedSite) : []
  const filteredFloors = selectedBuilding ? getFloorsByBuilding(selectedBuilding) : []
  const filteredRooms = selectedFloor ? getRoomsByFloor(selectedFloor) : []

  const handleSiteChange = (value: string) => {
    setSelectedSite(value)
    setSelectedBuilding('')
    setSelectedFloor('')
    setSelectedRoom('')
  }

  const handleBuildingChange = (value: string) => {
    setSelectedBuilding(value)
    setSelectedFloor('')
    setSelectedRoom('')
  }

  const handleFloorChange = (value: string) => {
    setSelectedFloor(value)
    setSelectedRoom('')
  }

  const handleAllocate = () => {
    if (device && selectedFloor && selectedRoom) {
      onAllocate(device.id, selectedFloor, selectedRoom)
      onClose()
    }
  }

  if (!device) return null

  // Get names for preview
  const siteName = sites.find(s => s.id === selectedSite)?.name
  const buildingName = buildings.find(b => b.id === selectedBuilding)?.name
  const floorName = floors.find(f => f.id === selectedFloor)?.name || `Floor ${floors.find(f => f.id === selectedFloor)?.floor_number}`
  const roomName = rooms.find(r => r.id === selectedRoom)?.name || rooms.find(r => r.id === selectedRoom)?.room_number

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Device to Room</DialogTitle>
          <DialogDescription>
            Device: <span className="font-semibold">{device.name}</span>
            {device.mac_address && (
              <span className="block text-xs font-mono mt-1">MAC: {device.mac_address}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Site Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Site
            </label>
            <Select value={selectedSite} onValueChange={handleSiteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
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

          {/* Building Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Building
            </label>
            <Select 
              value={selectedBuilding} 
              onValueChange={handleBuildingChange}
              disabled={!selectedSite}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {filteredBuildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Floor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Floor
            </label>
            <Select 
              value={selectedFloor} 
              onValueChange={handleFloorChange}
              disabled={!selectedBuilding}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {filteredFloors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name || `Floor ${floor.floor_number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Room
            </label>
            <Select 
              value={selectedRoom} 
              onValueChange={setSelectedRoom}
              disabled={!selectedFloor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name || room.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Preview */}
          {selectedRoom && (
            <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-sm font-medium mb-1">Assignment Preview:</p>
              <p className="text-sm text-muted-foreground">
                {siteName} → {buildingName} → {floorName} → {roomName}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={!selectedRoom}>
            Assign Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
