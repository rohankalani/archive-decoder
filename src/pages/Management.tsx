import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocations, Site, Building, Block, Floor } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layout } from '@/components/Layout'
import { LocationTree } from '@/components/locations/LocationTree'
import { LocationForms } from '@/components/locations/LocationForms'
import { 
  Building2, 
  MapPin, 
  Settings, 
  Users, 
  Activity, 
  Plus,
  TreePine,
  BarChart3
} from 'lucide-react'

export default function Management() {
  const { profile, isAdmin, isSuperAdmin } = useAuth()
  const { sites, buildings, blocks, floors } = useLocations()

  // Dialog states for site management
  const [siteDialogOpen, setSiteDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)

  // Dialog states for building management
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  // Dialog states for block management
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  // Dialog states for floor management
  const [floorDialogOpen, setFloorDialogOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Site handlers
  const handleAddSite = () => {
    setEditingSite(null)
    setSiteDialogOpen(true)
  }

  const handleEditSite = (site: Site) => {
    setEditingSite(site)
    setSiteDialogOpen(true)
  }

  // Building handlers
  const handleAddBuilding = (siteId: string) => {
    setSelectedSiteId(siteId)
    setEditingBuilding(null)
    setBuildingDialogOpen(true)
  }

  const handleEditBuilding = (building: Building) => {
    setEditingBuilding(building)
    setSelectedSiteId(building.site_id)
    setBuildingDialogOpen(true)
  }

  // Block handlers
  const handleAddBlock = (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setEditingBlock(null)
    setBlockDialogOpen(true)
  }

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block)
    setSelectedBuildingId(block.building_id)
    setBlockDialogOpen(true)
  }

  // Floor handlers
  const handleAddFloor = (blockId: string) => {
    setSelectedBlockId(blockId)
    setEditingFloor(null)
    setFloorDialogOpen(true)
  }

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor)
    setSelectedBlockId(floor.block_id)
    setFloorDialogOpen(true)
  }

  const totalFloors = floors.length

  return (
    <Layout title="Management Portal" showBackButton>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Location & Device Management</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organize your university infrastructure with hierarchical location management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{sites.length}</p>
                  <p className="text-sm text-muted-foreground">Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{buildings.length}</p>
                  <p className="text-sm text-muted-foreground">Buildings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{blocks.length}</p>
                  <p className="text-sm text-muted-foreground">Blocks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-accent-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalFloors}</p>
                  <p className="text-sm text-muted-foreground">Floors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="locations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="locations" className="flex items-center space-x-2">
              <TreePine className="h-4 w-4" />
              <span>Locations</span>
            </TabsTrigger>
            <TabsTrigger value="devices">
              <Activity className="h-4 w-4 mr-2" />
              Devices
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Location Management Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Location Hierarchy</h3>
                <p className="text-muted-foreground">Manage sites, buildings, blocks, and floors</p>
              </div>
              <Button onClick={handleAddSite}>
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <LocationTree
                  onEditSite={handleEditSite}
                  onEditBuilding={handleEditBuilding}
                  onEditBlock={handleEditBlock}
                  onEditFloor={handleEditFloor}
                  onAddBuilding={handleAddBuilding}
                  onAddBlock={handleAddBlock}
                  onAddFloor={handleAddFloor}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Device Management Tab */}
          <TabsContent value="devices" className="space-y-6">
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                    <Activity className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Device Management Coming Soon</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Once you've set up your location hierarchy, you'll be able to assign ULTRADETEKT 03M devices to specific floors.
                    </p>
                  </div>
                  <Badge variant="outline" className="px-4 py-1">
                    Next Phase
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          {isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="py-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">User Management Coming Soon</h3>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Manage user roles, permissions, and access control for the air quality monitoring system.
                      </p>
                    </div>
                    <Badge variant="outline" className="px-4 py-1">
                      Next Phase
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Settings className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">System Settings</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Configure air quality thresholds, alert rules, and system parameters. UAE standards are pre-configured.
                    </p>
                  </div>
                  <Badge variant="outline" className="px-4 py-1">
                    Available in Settings Page
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Location Forms */}
        <LocationForms
          siteDialogOpen={siteDialogOpen}
          setSiteDialogOpen={setSiteDialogOpen}
          editingSite={editingSite}
          setEditingSite={setEditingSite}
          buildingDialogOpen={buildingDialogOpen}
          setBuildingDialogOpen={setBuildingDialogOpen}
          editingBuilding={editingBuilding}
          setEditingBuilding={setEditingBuilding}
          selectedSiteId={selectedSiteId}
          blockDialogOpen={blockDialogOpen}
          setBlockDialogOpen={setBlockDialogOpen}
          editingBlock={editingBlock}
          setEditingBlock={setEditingBlock}
          selectedBuildingId={selectedBuildingId}
          floorDialogOpen={floorDialogOpen}
          setFloorDialogOpen={setFloorDialogOpen}
          editingFloor={editingFloor}
          setEditingFloor={setEditingFloor}
          selectedBlockId={selectedBlockId}
        />
      </div>
    </Layout>
  )
}