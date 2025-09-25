import React, { useState } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Building2, Square, Layers, Plus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schemas
const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name too long'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required').max(200, 'Address too long'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required').max(100, 'Building name too long'),
  description: z.string().optional(),
  floor_count: z.number().min(1, 'Must have at least 1 floor').max(200, 'Too many floors'),
  site_id: z.string().min(1, 'Site is required'),
});

const blockSchema = z.object({
  name: z.string().min(1, 'Block name is required').max(100, 'Block name too long'),
  description: z.string().optional(),
  building_id: z.string().min(1, 'Building is required'),
});

const floorSchema = z.object({
  floor_number: z.number().min(0, 'Floor number cannot be negative').max(200, 'Floor number too high'),
  name: z.string().optional(),
  area_sqm: z.number().min(0.1, 'Area must be positive').max(100000, 'Area too large').optional(),
  block_id: z.string().min(1, 'Block is required'),
});

type LocationType = 'site' | 'building' | 'block' | 'floor';

interface LocationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: LocationType;
  parentId?: string;
}

export function LocationWizard({ 
  isOpen, 
  onClose, 
  initialType = 'site',
  parentId 
}: LocationWizardProps) {
  const { sites, buildings, blocks, createSite, createBuilding, createBlock, createFloor } = useLocations();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<LocationType>(initialType);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<LocationType>>(new Set());
  
  // Form states
  const [siteForm, setSiteForm] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    description: '',
    floor_count: '3',
    site_id: parentId && initialType === 'building' ? parentId : '',
  });
  
  const [blockForm, setBlockForm] = useState({
    name: '',
    description: '',
    building_id: parentId && initialType === 'block' ? parentId : '',
  });
  
  const [floorForm, setFloorForm] = useState({
    floor_number: '1',
    name: '',
    area_sqm: '',
    block_id: parentId && initialType === 'floor' ? parentId : '',
  });

  const [createdIds, setCreatedIds] = useState<{
    siteId?: string;
    buildingId?: string;
    blockId?: string;
  }>({});

  const resetForms = () => {
    setSiteForm({ name: '', description: '', address: '', latitude: '', longitude: '' });
    setBuildingForm({ name: '', description: '', floor_count: '3', site_id: '' });
    setBlockForm({ name: '', description: '', building_id: '' });
    setFloorForm({ floor_number: '1', name: '', area_sqm: '', block_id: '' });
    setCreatedIds({});
    setCompletedSteps(new Set());
    setCurrentStep(initialType);
    setErrors({});
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = {
        name: siteForm.name,
        description: siteForm.description || undefined,
        address: siteForm.address,
        latitude: siteForm.latitude ? parseFloat(siteForm.latitude) : undefined,
        longitude: siteForm.longitude ? parseFloat(siteForm.longitude) : undefined,
      };

      siteSchema.parse(data);
      const result = await createSite(data);
      
      setCreatedIds(prev => ({ ...prev, siteId: result.id }));
      setBuildingForm(prev => ({ ...prev, site_id: result.id }));
      setCompletedSteps(prev => new Set([...prev, 'site']));
      
      toast({
        title: "Site Created",
        description: `${data.name} has been created successfully.`,
      });
      
      if (initialType === 'site') {
        handleClose();
      } else {
        setCurrentStep('building');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = {
        name: buildingForm.name,
        description: buildingForm.description || undefined,
        floor_count: parseInt(buildingForm.floor_count),
        site_id: buildingForm.site_id,
      };

      buildingSchema.parse(data);
      const result = await createBuilding(data);
      
      setCreatedIds(prev => ({ ...prev, buildingId: result.id }));
      setBlockForm(prev => ({ ...prev, building_id: result.id }));
      setCompletedSteps(prev => new Set([...prev, 'building']));
      
      toast({
        title: "Building Created",
        description: `${data.name} has been created successfully.`,
      });
      
      if (initialType === 'building') {
        handleClose();
      } else {
        setCurrentStep('block');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = {
        name: blockForm.name,
        description: blockForm.description || undefined,
        building_id: blockForm.building_id,
      };

      blockSchema.parse(data);
      const result = await createBlock(data);
      
      setCreatedIds(prev => ({ ...prev, blockId: result.id }));
      setFloorForm(prev => ({ ...prev, block_id: result.id }));
      setCompletedSteps(prev => new Set([...prev, 'block']));
      
      toast({
        title: "Block Created",
        description: `${data.name} has been created successfully.`,
      });
      
      if (initialType === 'block') {
        handleClose();
      } else {
        setCurrentStep('floor');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data = {
        floor_number: parseInt(floorForm.floor_number),
        name: floorForm.name || undefined,
        area_sqm: floorForm.area_sqm ? parseFloat(floorForm.area_sqm) : undefined,
        block_id: floorForm.block_id,
      };

      floorSchema.parse(data);
      await createFloor(data);
      
      setCompletedSteps(prev => new Set([...prev, 'floor']));
      
      toast({
        title: "Floor Created",
        description: `Floor ${data.floor_number} has been created successfully.`,
      });
      
      handleClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep = (step: LocationType) => {
    switch (step) {
      case 'building':
        return buildingForm.site_id || completedSteps.has('site');
      case 'block':
        return blockForm.building_id || completedSteps.has('building');
      case 'floor':
        return floorForm.block_id || completedSteps.has('block');
      default:
        return true;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'site': return 'Create Site';
      case 'building': return 'Create Building';
      case 'block': return 'Create Block';
      case 'floor': return 'Create Floor';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'site': return 'Add a new university site or campus';
      case 'building': return 'Add a building to the site';
      case 'block': return 'Add a block or wing to the building';
      case 'floor': return 'Add a floor to the block';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={(value) => {
          if (canProceedToStep(value as LocationType)) {
            setCurrentStep(value as LocationType);
          }
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="site" 
              className="flex items-center gap-1"
              disabled={initialType !== 'site' && !completedSteps.has('site')}
            >
              {completedSteps.has('site') ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              Site
            </TabsTrigger>
            <TabsTrigger 
              value="building" 
              className="flex items-center gap-1"
              disabled={!canProceedToStep('building')}
            >
              {completedSteps.has('building') ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Building2 className="h-3 w-3" />
              )}
              Building
            </TabsTrigger>
            <TabsTrigger 
              value="block" 
              className="flex items-center gap-1"
              disabled={!canProceedToStep('block')}
            >
              {completedSteps.has('block') ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              Block
            </TabsTrigger>
            <TabsTrigger 
              value="floor" 
              className="flex items-center gap-1"
              disabled={!canProceedToStep('floor')}
            >
              {completedSteps.has('floor') ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Layers className="h-3 w-3" />
              )}
              Floor
            </TabsTrigger>
          </TabsList>

          {/* Site Form */}
          <TabsContent value="site" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Site Information
                </CardTitle>
                <CardDescription>
                  A site represents a physical location like a university campus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSiteSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Input
                        id="site-address"
                        value={siteForm.address}
                        onChange={(e) => setSiteForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Al Ain Road, Abu Dhabi, UAE"
                        className={errors.address ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site-description">Description</Label>
                    <Textarea
                      id="site-description"
                      value={siteForm.description}
                      onChange={(e) => setSiteForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Main campus of Abu Dhabi University"
                      disabled={loading}
                      rows={2}
                    />
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
                        disabled={loading}
                      />
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
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Site
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Building Form */}
          <TabsContent value="building" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-success" />
                  Building Information
                </CardTitle>
                <CardDescription>
                  Add a building to house multiple blocks or departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBuildingSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="building-site">Site *</Label>
                    <Select
                      value={buildingForm.site_id}
                      onValueChange={(value) => setBuildingForm(prev => ({ ...prev, site_id: value }))}
                      disabled={loading || completedSteps.has('site')}
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

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building-description">Description</Label>
                    <Textarea
                      id="building-description"
                      value={buildingForm.description}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Engineering and Computer Science building"
                      disabled={loading}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Building
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Block Form */}
          <TabsContent value="block" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-warning" />
                  Block Information
                </CardTitle>
                <CardDescription>
                  Create a block or wing within the building
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBlockSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="block-building">Building *</Label>
                    <Select
                      value={blockForm.building_id}
                      onValueChange={(value) => setBlockForm(prev => ({ ...prev, building_id: value }))}
                      disabled={loading || completedSteps.has('building')}
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
                      disabled={loading}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Block
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Floor Form */}
          <TabsContent value="floor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent-foreground" />
                  Floor Information
                </CardTitle>
                <CardDescription>
                  Add a floor where devices can be installed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFloorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="floor-block">Block *</Label>
                    <Select
                      value={floorForm.block_id}
                      onValueChange={(value) => setFloorForm(prev => ({ ...prev, block_id: value }))}
                      disabled={loading || completedSteps.has('block')}
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
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floor-name">Floor Name</Label>
                    <Input
                      id="floor-name"
                      value={floorForm.name}
                      onChange={(e) => setFloorForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ground Floor"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Floor
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}