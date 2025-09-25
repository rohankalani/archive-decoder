import React from 'react'
import type { Device } from '@/hooks/useDevices'
import { useLocations } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Wifi,
  WifiOff,
  Settings,
  Battery,
  MapPin,
  Calendar
} from 'lucide-react'

interface DeviceListProps {
  devices: Device[]
  onEdit: (device: Device) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, updates: Partial<Device>) => void
}

export function DeviceList({ devices, onEdit, onDelete, onUpdateStatus }: DeviceListProps) {
  const { floors, buildings, sites, getFloorLocation } = useLocations()

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-success" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-destructive" />
      case 'maintenance':
        return <Settings className="h-4 w-4 text-warning" />
      case 'error':
        return <WifiOff className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: Device['status']) => {
    const variants = {
      online: 'default',
      offline: 'destructive',
      maintenance: 'secondary',
      error: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getBatteryIcon = (level?: number) => {
    if (!level) return null
    
    const color = level > 20 ? 'text-success' : level > 10 ? 'text-warning' : 'text-destructive'
    return <Battery className={`h-4 w-4 ${color}`} />
  }

  const getLocationPath = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId)
    if (!floor) return 'Unknown Location'

    const location = getFloorLocation(floor)
    return `${location.site?.name} > ${location.building?.name}${location.block ? ` > ${location.block.name}` : ''} > ${floor.name || `Floor ${floor.floor_number}`}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (devices.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No devices found</p>
        <p className="text-sm">Add your first ULTRADETEKT 03M device to get started</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Calibration Due</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {device.serial_number && `S/N: ${device.serial_number}`}
                  </div>
                  {device.firmware_version && (
                    <div className="text-xs text-muted-foreground">
                      FW: {device.firmware_version}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(device.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="max-w-[200px] truncate" title={getLocationPath(device.floor_id)}>
                    {getLocationPath(device.floor_id)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(device.calibration_due_date)}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(device)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Device
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(device.id, { status: 'online' })}
                      disabled={device.status === 'online'}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Mark Online
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(device.id, { status: 'offline' })}
                      disabled={device.status === 'offline'}
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Mark Offline
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(device.id, { status: 'maintenance' })}
                      disabled={device.status === 'maintenance'}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Mark Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(device.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Device
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}