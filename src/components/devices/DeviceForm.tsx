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
import { MapPin, Settings, Loader2 } from 'lucide-react'

const deviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  device_type: z.string().min(1, "Device type is required"),
  serial_number: z.string().trim().min(1, "Serial number is required").max(100, "Serial number must be less than 100 characters"),
  mac_address: z.string()
    .trim()
    .min(1, "MAC address is required")
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format (XX:XX:XX:XX:XX:XX)")
    .transform(val => val.toUpperCase()),
  status: z.enum(['online', 'offline', 'error', 'pending']),
  floor_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
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
  const [locationChanged, setLocationChanged] = React.useState(false)
  const [showLocationEditor, setShowLocationEditor] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || '',
      device_type: device?.device_type || 'air_quality_sensor',
      serial_number: device?.serial_number || '',
      mac_address: device?.mac_address || '',
      status: device?.status || 'offline',
      floor_id: device?.floor_id || undefined,
      room_id: device?.room_id || undefined,
      firmware_version: device?.firmware_version || '',
      installation_date: device?.installation_date || '',
      calibration_due_date: device?.calibration_due_date || '',
    },
  })

  // Watch form changes for debugging
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name) {
        console.log(`Form field "${name}" changed:`, value[name], `(${type})`)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Initialize location editor visibility
  React.useEffect(() => {
    // If editing a device with a location, hide the editor by default
    // If editing a device without a location, or creating new, show the editor
    setShowLocationEditor(!device || !device.floor_id)
  }, [device])

  // Initialize location selectors from device data
  React.useEffect(() => {
    console.log('=== DeviceForm Location Init ===')
    console.log('Device:', device?.id, device?.name)
    console.log('Has room_id:', device?.room_id)
    console.log('Has floor_id:', device?.floor_id)
    console.log('Data loaded - Rooms:', rooms.length, 'Floors:', allFloors.length, 'Buildings:', buildings.length)
    
    // Wait for location data to load before initializing
    if (rooms.length === 0 || allFloors.length === 0 || buildings.length === 0) {
      console.log('Location data not loaded yet, waiting...')
      return
    }
    
    if (device && device.room_id) {
      const room = rooms.find(r => r.id === device.room_id)
      console.log('Found room:', room?.name)
      
      if (room) {
        const floor = allFloors.find(f => f.id === room.floor_id)
        console.log('Found floor:', floor?.name || `Floor ${floor?.floor_number}`)
        
        if (floor) {
          const building = buildings.find(b => b.id === floor.building_id)
          console.log('Found building:', building?.name)
          
          if (building) {
            console.log('Setting location selectors:', {
              site: building.site_id,
              building: building.id,
              floor: floor.id,
              room: room.id
            })
            
            setSelectedSite(building.site_id)
            setSelectedBuilding(building.id)
            setSelectedFloor(floor.id)
            setSelectedRoom(room.id)
          }
        }
      }
    } else if (device && device.floor_id) {
      const floor = allFloors.find(f => f.id === device.floor_id)
      console.log('Found floor (no room):', floor?.name || `Floor ${floor?.floor_number}`)
      
      if (floor) {
        const building = buildings.find(b => b.id === floor.building_id)
        console.log('Found building (no room):', building?.name)
        
        if (building) {
          console.log('Setting location selectors (no room):', {
            site: building.site_id,
            building: building.id,
            floor: floor.id
          })
          
          setSelectedSite(building.site_id)
          setSelectedBuilding(building.id)
          setSelectedFloor(floor.id)
        }
      }
    }
  }, [device, rooms, allFloors, buildings])

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

  const handleSubmit = async (data: DeviceFormData) => {
    setIsSubmitting(true)
    
    try {
      // If editing an existing device
      if (device) {
        // Build a partial update object - only include fields that should be updated
        const updates: any = {
          name: data.name,
          device_type: data.device_type,
          serial_number: data.serial_number,
          mac_address: data.mac_address,
          firmware_version: data.firmware_version,
          installation_date: data.installation_date,
          calibration_due_date: data.calibration_due_date,
        }
        
        // ONLY include location fields if the user explicitly changed them AND editor is shown
        if (showLocationEditor && locationChanged) {
          if (selectedRoom) {
            const room = rooms.find(r => r.id === selectedRoom)
            if (room) {
              updates.floor_id = room.floor_id
              updates.room_id = selectedRoom
            }
          } else {
            updates.floor_id = null
            updates.room_id = null
          }
        }
        // Otherwise, preserve existing location by not including those fields
        
        await onSubmit({ id: device.id, ...updates } as any)
      } else {
        // For new devices, include everything
        if (selectedRoom) {
          const room = rooms.find(r => r.id === selectedRoom)
          if (room) {
            data.floor_id = room.floor_id
            data.room_id = selectedRoom
            data.status = 'offline'
          }
        } else {
          data.status = 'pending'
          data.floor_id = null
          data.room_id = null
        }
        
        if (!data.calibration_due_date && data.installation_date) {
          const installDate = new Date(data.installation_date)
          const calibrationDate = new Date(installDate)
          calibrationDate.setFullYear(calibrationDate.getFullYear() + 1)
          data.calibration_due_date = calibrationDate.toISOString().split('T')[0]
        }
        
        await onSubmit(data as any)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Location Assignment (Optional)
                </div>
                {device && device.floor_id && !showLocationEditor && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowLocationEditor(true)
                      setLocationChanged(true)
                    }}
                  >
                    Change Location
                  </Button>
                )}
              </div>

              {/* Show current location as read-only if device has location and editor is hidden */}
              {device && device.floor_id && !showLocationEditor ? (
                <div className="p-3 bg-background rounded border">
                  <p className="text-sm font-medium mb-2">Current Location:</p>
                  <p className="text-sm font-mono text-muted-foreground">{locationPath}</p>
                </div>
              ) : (
                <>
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
                      <Select 
                        value={selectedSite} 
                        onValueChange={(value) => {
                          setSelectedSite(value)
                          setLocationChanged(true)
                        }}
                      >
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
                        onValueChange={(value) => {
                          setSelectedBuilding(value)
                          setLocationChanged(true)
                        }}
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
                        onValueChange={(value) => {
                          setSelectedFloor(value)
                          setLocationChanged(true)
                        }}
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
                        onValueChange={(value) => {
                          setSelectedRoom(value)
                          setLocationChanged(true)
                        }}
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
                </>
              )}
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
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {device ? 'Update Device' : 'Add Device'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
