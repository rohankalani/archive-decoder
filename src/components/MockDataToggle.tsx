/**
 * Mock Data Toggle Component
 * Provides development vs production data toggle with scenario controls
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useUnifiedMockData } from '@/contexts/UnifiedMockDataContext'
import { 
  Database, 
  TestTube, 
  RefreshCw, 
  AlertTriangle, 
  Clock,
  Users,
  Zap
} from 'lucide-react'

export function MockDataToggle() {
  const {
    isUsingMockData,
    toggleMockData,
    currentScenario,
    setScenario,
    devices,
    users,
    alerts,
    reports,
    refreshMockData,
    simulateAlert
  } = useUnifiedMockData()

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          Development Data Controls
          <Badge variant={isUsingMockData ? "default" : "secondary"}>
            {isUsingMockData ? "Mock Data" : "Production"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mock Data Mode</p>
              <p className="text-sm text-muted-foreground">
                Use simulated Abu Dhabi University data for testing
              </p>
            </div>
          </div>
          <Switch
            checked={isUsingMockData}
            onCheckedChange={toggleMockData}
          />
        </div>

        {isUsingMockData && (
          <>
            {/* Data Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-success">{devices.length}</div>
                <div className="text-sm text-muted-foreground">Devices</div>
              </div>
              <div className="text-center p-3 border rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-warning">{alerts.length}</div>
                <div className="text-sm text-muted-foreground">Alerts</div>
              </div>
              <div className="text-center p-3 border rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-accent-foreground">{users.length}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center p-3 border rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{reports.length}</div>
                <div className="text-sm text-muted-foreground">Reports</div>
              </div>
            </div>

            {/* Scenario Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">University Scenario</label>
                <Select value={currentScenario} onValueChange={setScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Normal Operations
                      </div>
                    </SelectItem>
                    <SelectItem value="high_activity">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        High Activity (Events/Exams)
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Maintenance Period
                      </div>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Emergency Situation
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMockData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const randomDevice = devices[Math.floor(Math.random() * devices.length)]
                    if (randomDevice) {
                      simulateAlert(randomDevice.id, 'high')
                    }
                  }}
                  disabled={devices.length === 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Simulate Alert
                </Button>
              </div>
            </div>

            {/* Scenario Description */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {currentScenario === 'normal' && 
                  'Standard university operations with typical class schedules and occupancy patterns.'}
                {currentScenario === 'high_activity' && 
                  'Increased activity during events, exams, or peak periods. Higher CO2 and particulate levels.'}
                {currentScenario === 'maintenance' && 
                  'Maintenance activities causing temporary air quality changes. Some devices may be offline.'}
                {currentScenario === 'emergency' && 
                  'Emergency scenario with potential HVAC failures or evacuation procedures.'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}