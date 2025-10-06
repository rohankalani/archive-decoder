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

  // Validation check
  const canAssign = device?.serial_number && selectedRoom && selectedFloor

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
          <DialogDescription className="space-y-2">
            <div>
              Device: <span className="font-semibold">{device.name}</span>
            </div>
            {device.mac_address && (
              <div className="text-xs font-mono">MAC: {device.mac_address}</div>
            )}
            {device.serial_number && (
              <div className="text-xs font-mono">Serial: {device.serial_number}</div>
            )}
            {!device.serial_number && (
              <div className="text-xs text-warning">
                ⚠️ Serial number required before assignment
              </div>
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
          <Button onClick={handleAllocate} disabled={!canAssign}>
            {!device.serial_number ? 'Add Serial Number First' : 'Assign Device'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
