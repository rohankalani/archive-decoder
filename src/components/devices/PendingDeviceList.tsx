import React, { useState } from 'react'
import { Device } from '@/hooks/useDevices'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, MapPin, Edit2, Save, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PendingDeviceListProps {
  devices: Device[]
  onAssign: (device: Device) => void
  onRename: (deviceId: string, newName: string) => void
}

export function PendingDeviceList({ devices, onAssign, onRename }: PendingDeviceListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleStartEdit = (device: Device) => {
    setEditingId(device.id)
    setEditName(device.name)
  }

  const handleSaveEdit = (deviceId: string) => {
    if (editName.trim()) {
      onRename(deviceId, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No pending devices. All devices are allocated.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <Card key={device.id} className="border-warning/20 bg-warning/5">
          <CardContent className="p-4 space-y-3">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-warning text-warning">
                Pending Allocation
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Device Name */}
            <div>
              {editingId === device.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Device name"
                    className="h-8"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(device.id)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{device.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(device)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* MAC Address */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">MAC Address</p>
              <p className="text-sm font-mono bg-background px-2 py-1 rounded">
                {device.mac_address || 'N/A'}
              </p>
            </div>

            {/* Device Type */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Device Type</p>
              <p className="text-sm">{device.device_type}</p>
            </div>

            {/* Assign Button */}
            <Button
              className="w-full"
              onClick={() => onAssign(device)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Assign to Room
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
