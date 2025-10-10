import React, { useState, useEffect } from 'react'
import { Device } from '@/hooks/useDevices'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2 } from 'lucide-react'

interface QuickRenameDialogProps {
  device: Device | null
  open: boolean
  onClose: () => void
  onRename: (deviceId: string, newName: string) => void
}

export function QuickRenameDialog({ device, open, onClose, onRename }: QuickRenameDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (device) {
      setName(device.name)
    }
  }, [device])

  const handleSubmit = () => {
    if (device && name.trim()) {
      onRename(device.id, name.trim())
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Rename Device
          </DialogTitle>
          <DialogDescription>
            Update the device name. Location and other settings will remain unchanged.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter device name"
              autoFocus
            />
          </div>

          {/* Current Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground">Current Device</p>
            <p className="text-sm font-medium">{device.name}</p>
            {device.serial_number && (
              <p className="text-xs text-muted-foreground font-mono">
                S/N: {device.serial_number}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Rename Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
