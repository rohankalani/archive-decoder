import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RotateCcw, Save, Palette, Lock } from 'lucide-react';
import { getAqiColor } from '@/utils/chartDataUtils';

type Pollutant = 'PM2.5' | 'PM10' | 'HCHO' | 'VOC' | 'NOx';

interface ConcentrationRange {
  good: { min: number; max: number };
  moderate: { min: number; max: number };
  unhealthySensitive: { min: number; max: number };
  unhealthy: { min: number; max: number };
  veryUnhealthy: { min: number; max: number };
  hazardous: { min: number; max: number };
}

const ROSAIQ_RANGES: Record<Pollutant, ConcentrationRange> = {
  'PM2.5': {
    good: { min: 0, max: 50.4 },
    moderate: { min: 50.5, max: 60.4 },
    unhealthySensitive: { min: 60.5, max: 75.4 },
    unhealthy: { min: 75.5, max: 150.4 },
    veryUnhealthy: { min: 150.5, max: 250.4 },
    hazardous: { min: 250.5, max: 500.4 }
  },
  'PM10': {
    good: { min: 0, max: 75.0 },
    moderate: { min: 75.1, max: 150.0 },
    unhealthySensitive: { min: 150.1, max: 250.0 },
    unhealthy: { min: 250.1, max: 350.0 },
    veryUnhealthy: { min: 350.1, max: 420.0 },
    hazardous: { min: 420.1, max: 600.0 }
  },
  'HCHO': {
    good: { min: 0, max: 30.0 },
    moderate: { min: 30.1, max: 80.0 },
    unhealthySensitive: { min: 80.1, max: 120.0 },
    unhealthy: { min: 120.1, max: 200.0 },
    veryUnhealthy: { min: 200.1, max: 300.0 },
    hazardous: { min: 300.1, max: 500.0 }
  },
  'VOC': {
    good: { min: 0, max: 100.0 },
    moderate: { min: 100.1, max: 200.0 },
    unhealthySensitive: { min: 200.1, max: 300.0 },
    unhealthy: { min: 300.1, max: 400.0 },
    veryUnhealthy: { min: 400.1, max: 450.0 },
    hazardous: { min: 450.1, max: 500.0 }
  },
  'NOx': {
    good: { min: 0, max: 100.0 },
    moderate: { min: 100.1, max: 200.0 },
    unhealthySensitive: { min: 200.1, max: 300.0 },
    unhealthy: { min: 300.1, max: 400.0 },
    veryUnhealthy: { min: 400.1, max: 450.0 },
    hazardous: { min: 450.1, max: 500.0 }
  }
};

const AQI_LEVELS = [
  { name: 'Good', aqi: '0-50', color: getAqiColor(25) },
  { name: 'Moderate', aqi: '51-100', color: getAqiColor(75) },
  { name: 'Unhealthy for Sensitive Groups', aqi: '101-150', color: getAqiColor(125) },
  { name: 'Unhealthy', aqi: '151-200', color: getAqiColor(175) },
  { name: 'Very Unhealthy', aqi: '201-300', color: getAqiColor(250) },
  { name: 'Hazardous', aqi: '301-500', color: getAqiColor(400) }
];

export function Settings() {
  const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>('PM2.5');
  const [ranges, setRanges] = useState<Record<Pollutant, ConcentrationRange>>(ROSAIQ_RANGES);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { toast } = useToast();
  const { updatePassword } = useAuth();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "AQI breakpoints have been updated successfully.",
    });
  };

  const handleReset = () => {
    setRanges(ROSAIQ_RANGES);
    toast({
      title: "Settings reset",
      description: "AQI breakpoints have been reset to ROSAIQ standards.",
    });
  };

  const updateRange = (level: keyof ConcentrationRange, field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setRanges(prev => ({
      ...prev,
      [selectedPollutant]: {
        ...prev[selectedPollutant],
        [level]: {
          ...prev[selectedPollutant][level],
          [field]: numValue
        }
      }
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (!error) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const getPollutantUnit = (pollutant: Pollutant): string => {
    switch (pollutant) {
      case 'PM2.5':
      case 'PM10':
        return 'μg/m³';
      case 'HCHO':
        return 'ppb';
      case 'VOC':
      case 'NOx':
        return 'index';
      default:
        return '';
    }
  };

  return (
    <Layout title="Settings" showBackButton>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure ROSAIQ AQI breakpoints and air quality parameters
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to ROSAIQ Standards
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="aqi" className="space-y-4">
          <TabsList>
            <TabsTrigger value="aqi">AQI Breakpoints</TabsTrigger>
            <TabsTrigger value="colors">Color Scheme</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="aqi" className="space-y-6">
            {/* Pollutant Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Pollutant</CardTitle>
                <CardDescription>
                  Choose a pollutant to configure its AQI concentration breakpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedPollutant} onValueChange={(value: Pollutant) => setSelectedPollutant(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PM2.5">PM2.5 (μg/m³)</SelectItem>
                    <SelectItem value="PM10">PM10 (μg/m³)</SelectItem>
                    <SelectItem value="HCHO">HCHO (ppb)</SelectItem>
                    <SelectItem value="VOC">VOC (index)</SelectItem>
                    <SelectItem value="NOx">NOx (index)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* AQI Level Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedPollutant} Concentration Breakpoints
                  <Badge variant="secondary">{getPollutantUnit(selectedPollutant)}</Badge>
                </CardTitle>
                <CardDescription>
                  Configure concentration ranges for each AQI level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {AQI_LEVELS.map((level, index) => {
                  const levelKey = index === 0 ? 'good' : 
                                  index === 1 ? 'moderate' :
                                  index === 2 ? 'unhealthySensitive' :
                                  index === 3 ? 'unhealthy' :
                                  index === 4 ? 'veryUnhealthy' : 'hazardous';
                  
                  return (
                    <div key={level.name} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: level.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{level.name}</div>
                          <div className="text-sm text-muted-foreground">AQI {level.aqi}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 ml-9">
                        <div className="space-y-2">
                          <Label className="text-sm">Minimum ({getPollutantUnit(selectedPollutant)})</Label>
                          <Input
                            type="number"
                            value={ranges[selectedPollutant][levelKey as keyof ConcentrationRange].min}
                            onChange={(e) => updateRange(levelKey as keyof ConcentrationRange, 'min', e.target.value)}
                            step="0.1"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Maximum ({getPollutantUnit(selectedPollutant)})</Label>
                          <Input
                            type="number"
                            value={ranges[selectedPollutant][levelKey as keyof ConcentrationRange].max}
                            onChange={(e) => updateRange(levelKey as keyof ConcentrationRange, 'max', e.target.value)}
                            step="0.1"
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      {index < AQI_LEVELS.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ROSAIQ AQI Color Scheme
                </CardTitle>
                <CardDescription>
                  Visual representation of the 6-level AQI system used by ROSAIQ devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {AQI_LEVELS.map((level) => (
                    <div key={level.name} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div 
                        className="w-12 h-12 rounded-md border-2 border-border"
                        style={{ backgroundColor: level.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{level.name}</div>
                        <div className="text-sm text-muted-foreground">AQI {level.aqi}</div>
                        <div className="text-xs text-muted-foreground font-mono">{level.color}</div>
                      </div>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: level.color,
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        {level.aqi}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>ROSAIQ ULTRADETEKT 03M</CardTitle>
                  <CardDescription>Multi-sensor air quality monitoring device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Particle Detection</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PM 0.3, PM 1.0, PM 2.5, PM 5.0, PM 10</li>
                      <li>• Ultra-precise detection (0.3-10 microns)</li>
                      <li>• Real-time particle counting</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Gas Sensors</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• CO₂ (Carbon dioxide)</li>
                      <li>• HCHO (Formaldehyde)</li>
                      <li>• VOC (Volatile organic compounds)</li>
                      <li>• NOₓ (Nitrogen oxides)</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">AQI Calculation</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• ROSAIQ proprietary algorithm</li>
                      <li>• Real-time AQI computation</li>
                      <li>• 6-level quality classification</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Technical specifications and deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Connectivity</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Wi-Fi 802.11 b/g/n</li>
                      <li>• MQTT protocol</li>
                      <li>• Real-time data transmission</li>
                      <li>• 30-second update intervals</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">AQI Standards</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• ROSAIQ proprietary breakpoints</li>
                      <li>• UAE environmental standards</li>
                      <li>• Real-time quality assessment</li>
                      <li>• Multi-pollutant analysis</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Active Deployments</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Abu Dhabi Estimada</li>
                      <li>• Burjeel Hospital</li>
                      <li>• Dubai Green Building</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}