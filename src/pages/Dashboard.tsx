import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Settings, Shield, LogOut, Building2, MapPin } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Air Quality Dashboard</h1>
                <p className="text-sm text-muted-foreground">Abu Dhabi University Monitoring System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={profile?.role === 'super_admin' ? 'default' : 'secondary'}>
                    {profile?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/management')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Management
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
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
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Real-time Air Quality Monitoring</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ULTRADETEKT 03M devices monitoring PM2.5, PM10, CO₂, HCHO, VOC, and NOₓ levels
            </p>
          </div>

          {/* Quick Actions */}
          {isAdmin && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Management Portal</h3>
                      <p className="text-muted-foreground">Configure sites, buildings, and devices</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/management')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Go to Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abu Dhabi Estimada</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">45</span>
                    <div className="px-2 py-1 rounded text-white text-xs bg-success">
                      Good
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>2/2 devices online</span>
                    <span>Abu Dhabi, UAE</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Burjeel Hospital</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">78</span>
                    <div className="px-2 py-1 rounded text-white text-xs bg-warning">
                      Moderate
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>1/2 devices online</span>
                    <span>Abu Dhabi, UAE</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dubai Green Building</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">32</span>
                    <div className="px-2 py-1 rounded text-white text-xs bg-success">
                      Good
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>2/2 devices online</span>
                    <span>Dubai, UAE</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Status */}
          <Card>
            <CardHeader>
              <CardTitle>ULTRADETEKT 03M Devices</CardTitle>
              <CardDescription>Real-time air quality monitoring devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Initializing MQTT connection...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitoring PM2.5, PM10, CO₂, HCHO, VOC, NOₓ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}