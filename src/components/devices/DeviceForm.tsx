import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Device } from '@/hooks/useDevices'
import { Floor, useLocations } from '@/hooks/useLocations'
import { MapPin, Settings } from 'lucide-react'

const deviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  device_type: z.string().min(1, "Device type is required"),
  serial_number: z.string().min(1, "Serial number is required"),
  mac_address: z.string()
    .min(1, "MAC address is required")
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format (XX:XX:XX:XX:XX:XX)"),
  status: z.enum(['online', 'offline', 'error', 'pending']),
  floor_id: z.string().uuid("Must select a floor").optional(),
  room_id: z.string().uuid().optional(),
  firmware_version: z.string().optional(),
  installation_date: z.string().optional(),
  calibration_due_date: z.string().optional(),
})

type DeviceFormData = z.infer<typeof deviceSchema>

interface DeviceFormProps {
  device?: Device | null
  floors: Floor[]
  onSubmit: (data: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export function DeviceForm({ device, floors, onSubmit, onCancel }: DeviceFormProps) {
  const { sites, buildings, floors: allFloors, rooms } = useLocations()
  
  const [selectedSite, setSelectedSite] = React.useState<string>('')
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('')
  const [selectedFloor, setSelectedFloor] = React.useState<string>('')
  const [selectedRoom, setSelectedRoom] = React.useState<string>('')

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || '',
      device_type: device?.device_type || 'air_quality_sensor',
      serial_number: device?.serial_number || '',
      mac_address: device?.mac_address || '',
      status: device?.status || 'offline',
      floor_id: device?.floor_id || '',
      room_id: device?.room_id || '',
      firmware_version: device?.firmware_version || '',
      installation_date: device?.installation_date || '',
      calibration_due_date: device?.calibration_due_date || '',
    },
  })

  // Filter buildings by selected site
  const filteredBuildings = React.useMemo(() => {
    if (!selectedSite) return []
    return buildings.filter(b => b.site_id === selectedSite)
  }, [selectedSite, buildings])

  // Filter floors by selected building
  const filteredFloors = React.useMemo(() => {
    if (!selectedBuilding) return []
    return allFloors.filter(f => f.building_id === selectedBuilding)
  }, [selectedBuilding, allFloors])

  // Filter rooms by selected floor
  const filteredRooms = React.useMemo(() => {
    if (!selectedFloor) return []
    return rooms.filter(r => r.floor_id === selectedFloor)
  }, [selectedFloor, rooms])

  // Get location path preview
  const locationPath = React.useMemo(() => {
    if (!selectedSite) return 'No location selected'
    
    const site = sites.find(s => s.id === selectedSite)
    const building = buildings.find(b => b.id === selectedBuilding)
    const floor = allFloors.find(f => f.id === selectedFloor)
    const room = rooms.find(r => r.id === selectedRoom)

    const parts = [site?.name]
    if (building) parts.push(building.name)
    if (floor) parts.push(floor.name || `Floor ${floor.floor_number}`)
    if (room) parts.push(room.name)

    return parts.filter(Boolean).join(' → ')
  }, [selectedSite, selectedBuilding, selectedFloor, selectedRoom, sites, buildings, allFloors, rooms])

  const handleSubmit = (data: DeviceFormData) => {
    // Auto-fill floor_id from selected room if room is selected
    if (selectedRoom) {
      const room = rooms.find(r => r.id === selectedRoom)
      if (room) {
        data.floor_id = room.floor_id
        data.room_id = selectedRoom
        // If room is assigned, set status to offline (ready to go online when device connects)
        data.status = 'offline'
      }
    } else {
      // If no room selected, set status to pending
      data.status = 'pending'
      data.floor_id = undefined
      data.room_id = undefined
    }

    // If calibration_due_date is not provided and installation_date is available,
    // set calibration_due_date to 1 year from installation_date
    if (!data.calibration_due_date && data.installation_date) {
      const installDate = new Date(data.installation_date)
      const calibrationDate = new Date(installDate)
      calibrationDate.setFullYear(calibrationDate.getFullYear() + 1)
      data.calibration_due_date = calibrationDate.toISOString().split('T')[0]
    }

    onSubmit(data as any)
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            Enter device hardware identifiers and optionally assign to a room
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AQ-Sensor-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="air_quality_sensor">Air Quality Sensor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Device Identification Section */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Device Identification
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the hardware identifiers from the device sticker or About screen
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter serial number from device label" {...field} />
                      </FormControl>
                      <FormDescription>
                        Printed on the physical device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mac_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC Address *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XX:XX:XX:XX:XX:XX" 
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        From device sticker/about screen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location Hierarchy Selection */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location Assignment (Optional)
              </div>
              <p className="text-xs text-muted-foreground">
                Select the room where this device will be installed. Leave empty for manual assignment later.
              </p>

              {/* Location Preview */}
              <div className="p-2 bg-background rounded border text-sm font-mono">
                {locationPath}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Site Selection */}
                <div>
                  <label className="text-sm font-medium">Site</label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="mt-1">
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

                {/* Building Selection */}
                <div>
                  <label className="text-sm font-medium">Building</label>
                  <Select 
                    value={selectedBuilding} 
                    onValueChange={setSelectedBuilding}
                    disabled={!selectedSite}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a building" />
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
                <div>
                  <label className="text-sm font-medium">Floor</label>
                  <Select 
                    value={selectedFloor} 
                    onValueChange={setSelectedFloor}
                    disabled={!selectedBuilding}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a floor" />
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
                <div>
                  <label className="text-sm font-medium">Room</label>
                  <Select 
                    value={selectedRoom} 
                    onValueChange={setSelectedRoom}
                    disabled={!selectedFloor}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firmware_version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmware Version</FormLabel>
                    <FormControl>
                      <Input placeholder="v2.1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {device ? 'Update Device' : 'Add Device'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
