import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Device } from '@/hooks/useDevices'
import type { Floor } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const deviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  device_type: z.string().min(1, 'Device type is required'),
  mac_address: z.string().optional(),
  serial_number: z.string().optional(),
  firmware_version: z.string().optional(),
  status: z.enum(['online', 'offline', 'error']),
  floor_id: z.string().min(1, 'Floor selection is required'),
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
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || '',
      device_type: device?.device_type || 'air_quality_sensor',
      mac_address: device?.mac_address || '',
      serial_number: device?.serial_number || '',
      firmware_version: device?.firmware_version || '',
      status: device?.status || 'offline',
      floor_id: device?.floor_id || '',
      installation_date: device?.installation_date || '',
      calibration_due_date: device?.calibration_due_date || '',
    },
  })

  const handleSubmit = (data: DeviceFormData) => {
    // Calculate calibration due date as 3 years after installation date
    let calibrationDueDate = data.calibration_due_date || null
    if (data.installation_date && !calibrationDueDate) {
      const installDate = new Date(data.installation_date)
      const dueDate = new Date(installDate)
      dueDate.setFullYear(dueDate.getFullYear() + 3)
      calibrationDueDate = dueDate.toISOString().split('T')[0]
    }

    const submitData = {
      ...data,
      mac_address: data.mac_address || null,
      serial_number: data.serial_number || null,
      firmware_version: data.firmware_version || null,
      installation_date: data.installation_date || null,
      calibration_due_date: calibrationDueDate,
    }
    onSubmit(submitData as any)
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {device ? 'Edit Device' : 'Add New Device'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="air_quality_sensor">Air Quality Sensor</SelectItem>
                        <SelectItem value="temperature_sensor">Temperature Sensor</SelectItem>
                        <SelectItem value="humidity_sensor">Humidity Sensor</SelectItem>
                        <SelectItem value="co2_sensor">CO2 Sensor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., UD03M-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mac_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 00:1B:44:11:3A:B7" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Floor *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {floors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.name || `Floor ${floor.floor_number}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="calibration_due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calibration Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        placeholder="Auto-calculated (3 years from installation)"
                      />
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
                {device ? 'Update Device' : 'Create Device'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}