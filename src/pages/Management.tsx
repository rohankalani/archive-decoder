import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  MapPin, 
  Settings, 
  Users, 
  Activity, 
  Shield,
  Plus,
  LogOut
} from 'lucide-react'

export default function Management() {
  const { profile, signOut, isAdmin, isSuperAdmin } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Management Portal</h1>
                <p className="text-sm text-muted-foreground">Abu Dhabi University Air Quality System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                    {profile?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Welcome to the Management Portal</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage locations, devices, and user access for the Abu Dhabi University air quality monitoring system.
            </p>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Location Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Location Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage sites, buildings, blocks, and floors hierarchy
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sites</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Buildings</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Floors</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </CardContent>
            </Card>

            {/* Device Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Activity className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">Device Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Monitor and manage air quality sensors
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Devices</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Online</span>
                    <span className="font-medium text-success">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Offline</span>
                    <span className="font-medium text-warning">0</span>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </CardContent>
            </Card>

            {/* User Management */}
            {isSuperAdmin && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Users className="h-6 w-6 text-warning" />
                    </div>
                    <CardTitle className="text-lg">User Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage user roles and permissions
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Users</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Admins</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Viewers</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* System Settings */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">System Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure thresholds and system parameters
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Air Quality Thresholds</span>
                    <span className="font-medium text-success">UAE Standards</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Alert Rules</span>
                    <span className="font-medium">10 configured</span>
                  </div>
                </div>
                <Button size="sm" className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Notice */}
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="py-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Management Features Coming Soon</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    The complete location and device management interface is being developed. 
                    You'll be able to add sites, buildings, blocks, floors, and assign devices to specific locations.
                  </p>
                </div>
                <Badge variant="outline" className="px-4 py-1">
                  Phase 2 - In Development
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}