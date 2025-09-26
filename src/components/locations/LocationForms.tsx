import React, { useState, useEffect } from 'react'
import { useLocations, Site, Building, Block, Floor } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, MapPin, Building2, Square, Layers } from 'lucide-react'
import { z } from 'zod'

// Validation schemas
const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().min(1, 'Address is required').max(200, 'Address too long'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required').max(100, 'Building name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  floor_count: z.number().min(1, 'Must have at least 1 floor').max(200, 'Too many floors'),
  site_id: z.string().min(1, 'Site is required'),
})

const blockSchema = z.object({
  name: z.string().min(1, 'Block name is required').max(100, 'Block name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  building_id: z.string().min(1, 'Building is required'),
})

const floorSchema = z.object({
  floor_number: z.number().min(0, 'Floor number cannot be negative').max(200, 'Floor number too high'),
  name: z.string().max(100, 'Floor name too long').optional(),
  area_sqm: z.number().min(0.1, 'Area must be positive').max(100000, 'Area too large').optional(),
  block_id: z.string().min(1, 'Block is required'),
})

interface LocationFormsProps {
  // Site form
  siteDialogOpen: boolean
  setSiteDialogOpen: (open: boolean) => void
  editingSite: Site | null
  setEditingSite: (site: Site | null) => void
  
  // Building form
  buildingDialogOpen: boolean
  setBuildingDialogOpen: (open: boolean) => void
  editingBuilding: Building | null
  setEditingBuilding: (building: Building | null) => void
  selectedSiteId: string | null
  
  // Block form
  blockDialogOpen: boolean
  setBlockDialogOpen: (open: boolean) => void
  editingBlock: Block | null
  setEditingBlock: (block: Block | null) => void
  selectedBuildingId: string | null
  
  // Floor form
  floorDialogOpen: boolean
  setFloorDialogOpen: (open: boolean) => void
  editingFloor: Floor | null
  setEditingFloor: (floor: Floor | null) => void
  selectedBlockId: string | null
}

export function LocationForms({
  siteDialogOpen,
  setSiteDialogOpen,
  editingSite,
  setEditingSite,
  buildingDialogOpen,
  setBuildingDialogOpen,
  editingBuilding,
  setEditingBuilding,
  selectedSiteId,
  blockDialogOpen,
  setBlockDialogOpen,
  editingBlock,
  setEditingBlock,
  selectedBuildingId,
  floorDialogOpen,
  setFloorDialogOpen,
  editingFloor,
  setEditingFloor,
  selectedBlockId,
}: LocationFormsProps) {
  const { 
    sites, 
    buildings, 
    blocks,
    createSite, 
    updateSite, 
    createBuilding, 
    updateBuilding,
    createBlock,
    updateBlock,
    createFloor,
    updateFloor,
    getBuildingsBySite,
    getBlocksByBuilding,
  } = useLocations()

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Site form state
  const [siteForm, setSiteForm] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  // Building form state
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    description: '',
    floor_count: '1',
    site_id: '',
  })

  // Block form state
  const [blockForm, setBlockForm] = useState({
    name: '',
    description: '',
    building_id: '',
  })

  // Floor form state
  const [floorForm, setFloorForm] = useState({
    floor_number: '',
    name: '',
    area_sqm: '',
    block_id: '',
  })

  // Reset site form
  const resetSiteForm = () => {
    setSiteForm({
      name: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
    })
    setErrors({})
  }

  // Reset building form
  const resetBuildingForm = () => {
    setBuildingForm({
      name: '',
      description: '',
      floor_count: '1',
      site_id: selectedSiteId || '',
    })
    setErrors({})
  }

  // Reset block form
  const resetBlockForm = () => {
    setBlockForm({
      name: '',
      description: '',
      building_id: selectedBuildingId || '',
    })
    setErrors({})
  }

  // Reset floor form
  const resetFloorForm = () => {
    setFloorForm({
      floor_number: '',
      name: '',
      area_sqm: '',
      block_id: selectedBlockId || '',
    })
    setErrors({})
  }

  // Load site for editing
  useEffect(() => {
    if (editingSite) {
      setSiteForm({
        name: editingSite.name,
        description: editingSite.description || '',
        address: editingSite.address,
        latitude: editingSite.latitude ? editingSite.latitude.toString() : '',
        longitude: editingSite.longitude ? editingSite.longitude.toString() : '',
      })
    } else {
      resetSiteForm()
    }
  }, [editingSite])

  // Load building for editing
  useEffect(() => {
    if (editingBuilding) {
      setBuildingForm({
        name: editingBuilding.name,
        description: editingBuilding.description || '',
        floor_count: editingBuilding.floor_count.toString(),
        site_id: editingBuilding.site_id,
      })
    } else {
      resetBuildingForm()
    }
  }, [editingBuilding, selectedSiteId])

  // Load block for editing
  useEffect(() => {
    if (editingBlock) {
      setBlockForm({
        name: editingBlock.name,
        description: editingBlock.description || '',
        building_id: editingBlock.building_id,
      })
    } else {
      resetBlockForm()
    }
  }, [editingBlock, selectedBuildingId])

  // Load floor for editing
  useEffect(() => {
    if (editingFloor) {
      setFloorForm({
        floor_number: editingFloor.floor_number.toString(),
        name: editingFloor.name || '',
        area_sqm: editingFloor.area_sqm ? editingFloor.area_sqm.toString() : '',
        block_id: editingFloor.block_id,
      })
    } else {
      resetFloorForm()
    }
  }, [editingFloor, selectedBlockId])

  // Handle site submit
  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const data = {
        name: siteForm.name,
        description: siteForm.description || undefined,
        address: siteForm.address,
        latitude: siteForm.latitude ? parseFloat(siteForm.latitude) : undefined,
        longitude: siteForm.longitude ? parseFloat(siteForm.longitude) : undefined,
      }

      siteSchema.parse(data)

      if (editingSite) {
        await updateSite(editingSite.id, data)
      } else {
        await createSite(data)
      }

      setSiteDialogOpen(false)
      setEditingSite(null)
      resetSiteForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle building submit
  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const data = {
        name: buildingForm.name,
        description: buildingForm.description || undefined,
        floor_count: parseInt(buildingForm.floor_count),
        site_id: buildingForm.site_id,
      }

      buildingSchema.parse(data as any)

      if (editingBuilding) {
        await updateBuilding(editingBuilding.id, data)
      } else {
        await createBuilding(data as any)
      }

      setBuildingDialogOpen(false)
      setEditingBuilding(null)
      resetBuildingForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle block submit
  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const data = {
        name: blockForm.name,
        description: blockForm.description || undefined,
        building_id: blockForm.building_id,
      }

      blockSchema.parse(data as any)

      if (editingBlock) {
        await updateBlock(editingBlock.id, data)
      } else {
        await createBlock(data as any)
      }

      setBlockDialogOpen(false)
      setEditingBlock(null)
      resetBlockForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle floor submit
  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const data = {
        floor_number: parseInt(floorForm.floor_number),
        name: floorForm.name || undefined,
        area_sqm: floorForm.area_sqm ? parseFloat(floorForm.area_sqm) : undefined,
        block_id: floorForm.block_id,
      }

      floorSchema.parse(data as any)

      if (editingFloor) {
        await updateFloor(editingFloor.id, data)
      } else {
        await createFloor(data as any)
      }

      setFloorDialogOpen(false)
      setEditingFloor(null)
      resetFloorForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Site Dialog */}
      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{editingSite ? 'Edit Site' : 'Add New Site'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingSite ? 'Update site information' : 'Create a new site for the university'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSiteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name *</Label>
              <Input
                id="site-name"
                value={siteForm.name}
                onChange={(e) => setSiteForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Abu Dhabi University Main Campus"
                className={errors.name ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-address">Address *</Label>
              <Textarea
                id="site-address"
                value={siteForm.address}
                onChange={(e) => setSiteForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Al Ain Road, Abu Dhabi, UAE"
                className={errors.address ? 'border-destructive' : ''}
                disabled={loading}
                rows={2}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-description">Description</Label>
              <Textarea
                id="site-description"
                value={siteForm.description}
                onChange={(e) => setSiteForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Main campus of Abu Dhabi University"
                className={errors.description ? 'border-destructive' : ''}
                disabled={loading}
                rows={2}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-latitude">Latitude</Label>
                <Input
                  id="site-latitude"
                  type="number"
                  step="0.000001"
                  value={siteForm.latitude}
                  onChange={(e) => setSiteForm(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="25.2048"
                  className={errors.latitude ? 'border-destructive' : ''}
                  disabled={loading}
                />
                {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-longitude">Longitude</Label>
                <Input
                  id="site-longitude"
                  type="number"
                  step="0.000001"
                  value={siteForm.longitude}
                  onChange={(e) => setSiteForm(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="55.2708"
                  className={errors.longitude ? 'border-destructive' : ''}
                  disabled={loading}
                />
                {errors.longitude && <p className="text-sm text-destructive">{errors.longitude}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSiteDialogOpen(false)
                  setEditingSite(null)
                  resetSiteForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSite ? 'Update Site' : 'Create Site'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Building Dialog */}
      <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-success" />
              <span>{editingBuilding ? 'Edit Building' : 'Add New Building'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingBuilding ? 'Update building information' : 'Create a new building within the site'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBuildingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="building-site">Site *</Label>
              <Select
                value={buildingForm.site_id}
                onValueChange={(value) => setBuildingForm(prev => ({ ...prev, site_id: value }))}
                disabled={loading}
              >
                <SelectTrigger className={errors.site_id ? 'border-destructive' : ''}>
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
              {errors.site_id && <p className="text-sm text-destructive">{errors.site_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="building-name">Building Name *</Label>
              <Input
                id="building-name"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Engineering Building"
                className={errors.name ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="building-description">Description</Label>
              <Textarea
                id="building-description"
                value={buildingForm.description}
                onChange={(e) => setBuildingForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Engineering and Computer Science building"
                className={errors.description ? 'border-destructive' : ''}
                disabled={loading}
                rows={2}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="building-floors">Floor Count *</Label>
              <Input
                id="building-floors"
                type="number"
                min="1"
                max="200"
                value={buildingForm.floor_count}
                onChange={(e) => setBuildingForm(prev => ({ ...prev, floor_count: e.target.value }))}
                placeholder="5"
                className={errors.floor_count ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.floor_count && <p className="text-sm text-destructive">{errors.floor_count}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBuildingDialogOpen(false)
                  setEditingBuilding(null)
                  resetBuildingForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBuilding ? 'Update Building' : 'Create Building'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Square className="h-5 w-5 text-warning" />
              <span>{editingBlock ? 'Edit Block' : 'Add New Block'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingBlock ? 'Update block information' : 'Create a new block within the building'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-building">Building *</Label>
              <Select
                value={blockForm.building_id}
                onValueChange={(value) => setBlockForm(prev => ({ ...prev, building_id: value }))}
                disabled={loading}
              >
                <SelectTrigger className={errors.building_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} ({building.site?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.building_id && <p className="text-sm text-destructive">{errors.building_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-name">Block Name *</Label>
              <Input
                id="block-name"
                value={blockForm.name}
                onChange={(e) => setBlockForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Block A"
                className={errors.name ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-description">Description</Label>
              <Textarea
                id="block-description"
                value={blockForm.description}
                onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="North wing of the building"
                className={errors.description ? 'border-destructive' : ''}
                disabled={loading}
                rows={2}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBlockDialogOpen(false)
                  setEditingBlock(null)
                  resetBlockForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBlock ? 'Update Block' : 'Create Block'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floor Dialog */}
      <Dialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-accent-foreground" />
              <span>{editingFloor ? 'Edit Floor' : 'Add New Floor'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingFloor ? 'Update floor information' : 'Create a new floor within the block'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFloorSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="floor-block">Block *</Label>
              <Select
                value={floorForm.block_id}
                onValueChange={(value) => setFloorForm(prev => ({ ...prev, block_id: value }))}
                disabled={loading}
              >
                <SelectTrigger className={errors.block_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name} ({block.building?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.block_id && <p className="text-sm text-destructive">{errors.block_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor-number">Floor Number *</Label>
                <Input
                  id="floor-number"
                  type="number"
                  min="0"
                  max="200"
                  value={floorForm.floor_number}
                  onChange={(e) => setFloorForm(prev => ({ ...prev, floor_number: e.target.value }))}
                  placeholder="1"
                  className={errors.floor_number ? 'border-destructive' : ''}
                  disabled={loading}
                />
                {errors.floor_number && <p className="text-sm text-destructive">{errors.floor_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor-area">Area (m²)</Label>
                <Input
                  id="floor-area"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={floorForm.area_sqm}
                  onChange={(e) => setFloorForm(prev => ({ ...prev, area_sqm: e.target.value }))}
                  placeholder="500.0"
                  className={errors.area_sqm ? 'border-destructive' : ''}
                  disabled={loading}
                />
                {errors.area_sqm && <p className="text-sm text-destructive">{errors.area_sqm}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor-name">Floor Name</Label>
              <Input
                id="floor-name"
                value={floorForm.name}
                onChange={(e) => setFloorForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ground Floor"
                className={errors.name ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFloorDialogOpen(false)
                  setEditingFloor(null)
                  resetFloorForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingFloor ? 'Update Floor' : 'Create Floor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}