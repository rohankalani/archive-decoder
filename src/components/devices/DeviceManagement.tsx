import React, { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import type { Device } from '@/hooks/useDevices'
import { useLocations } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeviceList } from './DeviceList'
import { DeviceForm } from './DeviceForm'
import { PendingDeviceList } from './PendingDeviceList'
import { DeviceAllocationModal } from './DeviceAllocationModal'
import { toast } from 'sonner'
import { 
  Activity, 
  Plus, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Settings,
  Bell
} from 'lucide-react'

export function DeviceManagement() {
  const { devices, loading, createDevice, updateDevice, deleteDevice } = useDevices()
  const { floors } = useLocations()
  const [showForm, setShowForm] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [allocationDevice, setAllocationDevice] = useState<Device | null>(null)
  const [showAllocationModal, setShowAllocationModal] = useState(false)

  // Device status counts
  const pendingDevices = devices.filter(d => d.status === 'pending').length
  const onlineDevices = devices.filter(d => d.status === 'online').length
  const offlineDevices = devices.filter(d => d.status === 'offline').length
  const errorDevices = devices.filter(d => d.status === 'error').length

  // Unassigned floors (floors without devices)
  const assignedFloorIds = new Set(devices.map(d => d.floor_id))
  const unassignedFloors = floors.filter(f => !assignedFloorIds.has(f.id))

  const handleCreateDevice = async (deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createDevice(deviceData)
      setShowForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleUpdateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      await updateDevice(id, updates)
      setEditDevice(null)
      setShowForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleEditDevice = (device: Device) => {
    setEditDevice(device)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditDevice(null)
  }

  const handleAssignDevice = (device: Device) => {
    setAllocationDevice(device)
    setShowAllocationModal(true)
  }

  const handleAllocateDevice = async (deviceId: string, floorId: string, roomId: string) => {
    try {
      await updateDevice(deviceId, { 
        floor_id: floorId, 
        room_id: roomId,
        status: 'online' 
      })
      toast.success('Device assigned successfully')
      setShowAllocationModal(false)
      setAllocationDevice(null)
    } catch (error) {
      toast.error('Failed to assign device')
    }
  }

  const handleRenameDevice = async (deviceId: string, newName: string) => {
    try {
      await updateDevice(deviceId, { name: newName })
      toast.success('Device renamed successfully')
    } catch (error) {
      toast.error('Failed to rename device')
    }
  }

  const handleUpdateSerialNumber = async (deviceId: string, serialNumber: string) => {
    try {
      await updateDevice(deviceId, { serial_number: serialNumber })
      toast.success('Serial number updated successfully')
    } catch (error) {
      toast.error('Failed to update serial number')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Devices Alert */}
      {pendingDevices > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-warning" />
                <div>
                  <CardTitle className="text-warning">Unallocated Devices</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingDevices} device(s) need to be assigned to a room
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{onlineDevices}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{offlineDevices}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{errorDevices}</p>
                <p className="text-sm text-muted-foreground">Error</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Floors Alert */}
      {unassignedFloors.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-medium text-warning">Floors without devices</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {unassignedFloors.length} floor(s) don't have any devices assigned yet.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {unassignedFloors.slice(0, 5).map((floor) => (
                    <Badge key={floor.id} variant="outline" className="border-warning/20">
                      <MapPin className="h-3 w-3 mr-1" />
                      {floor.name || `Floor ${floor.floor_number}`}
                    </Badge>
                  ))}
                  {unassignedFloors.length > 5 && (
                    <Badge variant="outline" className="border-warning/20">
                      +{unassignedFloors.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ULTRADETEKT 03M Devices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage air quality monitoring devices across your locations
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={pendingDevices > 0 ? "pending" : "all"} className="space-y-4">
            <TabsList>
              <TabsTrigger value="unallocated" className="text-warning">
                <MapPin className="h-4 w-4 mr-2" />
                Unallocated ({devices.filter(d => !d.room_id).length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({devices.length})</TabsTrigger>
              <TabsTrigger value="online">Online ({onlineDevices})</TabsTrigger>
              <TabsTrigger value="offline">Offline ({offlineDevices})</TabsTrigger>
              <TabsTrigger value="error">Error ({errorDevices})</TabsTrigger>
            </TabsList>

            <TabsContent value="unallocated">
              <PendingDeviceList
                devices={devices.filter(d => !d.room_id)}
                onAssign={handleAssignDevice}
                onRename={handleRenameDevice}
                onUpdateSerialNumber={handleUpdateSerialNumber}
              />
            </TabsContent>

            <TabsContent value="all">
              <DeviceList 
                devices={devices}
                onEdit={handleEditDevice}
                onDelete={deleteDevice}
                onUpdateStatus={updateDevice}
              />
            </TabsContent>

            <TabsContent value="online">
              <DeviceList 
                devices={devices.filter(d => d.status === 'online')}
                onEdit={handleEditDevice}
                onDelete={deleteDevice}
                onUpdateStatus={updateDevice}
              />
            </TabsContent>

            <TabsContent value="offline">
              <DeviceList 
                devices={devices.filter(d => d.status === 'offline')}
                onEdit={handleEditDevice}
                onDelete={deleteDevice}
                onUpdateStatus={updateDevice}
              />
            </TabsContent>

            <TabsContent value="error">
              <DeviceList 
                devices={devices.filter(d => d.status === 'error')}
                onEdit={handleEditDevice}
                onDelete={deleteDevice}
                onUpdateStatus={updateDevice}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Device Form Modal */}
      {showForm && (
        <DeviceForm
          device={editDevice}
          floors={floors}
          onSubmit={editDevice ? 
            (updates) => handleUpdateDevice(editDevice.id, updates) : 
            handleCreateDevice
          }
          onCancel={handleCloseForm}
        />
      )}

      {/* Device Allocation Modal */}
      <DeviceAllocationModal
        device={allocationDevice}
        open={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false)
          setAllocationDevice(null)
        }}
        onAllocate={handleAllocateDevice}
      />
    </div>
  )
}