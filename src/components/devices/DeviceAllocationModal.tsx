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
import { Button } from '@/components/ui/button'
import { RoomSelectorTree } from './RoomSelectorTree'

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
  const { sites, buildings, floors, rooms } = useLocations()
  
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')

  // Reset selections when modal opens/closes or device changes
  useEffect(() => {
    if (!open || !device) {
      setSelectedRoom('')
      setSelectedFloor('')
    }
  }, [open, device])

  const handleSelectRoom = (roomId: string, floorId: string) => {
    setSelectedRoom(roomId)
    setSelectedFloor(floorId)
  }

  const handleAllocate = () => {
    if (device && selectedFloor && selectedRoom) {
      onAllocate(device.id, selectedFloor, selectedRoom)
      onClose()
    }
  }

  if (!device) return null

  // Get location path for preview
  const room = rooms.find(r => r.id === selectedRoom)
  const floor = floors.find(f => f.id === selectedFloor)
  const building = buildings.find(b => b.id === floor?.building_id)
  const site = sites.find(s => s.id === building?.site_id)

  const locationPath = selectedRoom
    ? `${site?.name} → ${building?.name} → ${floor?.name || `Floor ${floor?.floor_number}`} → ${room?.name}`
    : null

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
          <RoomSelectorTree
            selectedRoomId={selectedRoom}
            onSelectRoom={handleSelectRoom}
            showDeviceCounts
          />

          {/* Assignment Preview */}
          {locationPath && (
            <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-sm font-medium mb-1">Selected Location:</p>
              <p className="text-sm text-muted-foreground">
                {locationPath}
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
