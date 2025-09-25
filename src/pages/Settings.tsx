import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/Layout';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Metric, AqiLevel, Thresholds } from '@/types';
import { RotateCcw, Save, Palette } from 'lucide-react';

export function Settings() {
  const { thresholds, updateThresholds, resetToDefaults, getQualityColor } = useSettings();
  const [localThresholds, setLocalThresholds] = useState<Record<Metric, Thresholds>>(thresholds);
  const { toast } = useToast();

  const handleSave = () => {
    updateThresholds(localThresholds);
    toast({
      title: "Settings saved",
      description: "Air quality thresholds have been updated successfully.",
    });
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalThresholds(thresholds);
    toast({
      title: "Settings reset",
      description: "Air quality thresholds have been reset to defaults.",
    });
  };

  const updateThreshold = (
    parameter: Metric,
    level: keyof Thresholds,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setLocalThresholds(prev => ({
      ...prev,
      [parameter]: {
        ...prev[parameter],
        [level]: numValue
      }
    }));
  };

  const qualityLevels: AqiLevel[] = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];

  const parameters: { key: Metric, label: string, unit: string, description: string }[] = [
    { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', description: 'Fine particulate matter (≤2.5 micrometers)' },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³', description: 'Coarse particulate matter (≤10 micrometers)' },
    { key: 'hcho', label: 'HCHO', unit: 'ppb', description: 'Formaldehyde concentration' },
    { key: 'co2', label: 'CO₂', unit: 'ppm', description: 'Carbon dioxide concentration' },
    { key: 'voc', label: 'VOC', unit: 'index', description: 'Volatile organic compounds index' },
    { key: 'nox', label: 'NOₓ', unit: 'index', description: 'Nitrogen oxides index' }
  ];

  return (
    <Layout title="Settings" showBackButton>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Configure air quality thresholds and system parameters
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

      <Tabs defaultValue="thresholds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="thresholds">AQI Thresholds</TabsTrigger>
          <TabsTrigger value="colors">Color Scheme</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds" className="space-y-6">
          <div className="grid gap-6">
            {parameters.map(({ key, label, unit, description }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {label}
                    <Badge variant="secondary">{unit}</Badge>
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getQualityColor('Good') }}
                        />
                        <Label className="text-sm">Good</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={localThresholds[key]?.good || 0}
                          onChange={(e) => updateThreshold(key, 'good', e.target.value)}
                          className="w-20"
                          step="0.1"
                        />
                        <span className="text-sm text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getQualityColor('Moderate') }}
                        />
                        <Label className="text-sm">Moderate</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={localThresholds[key]?.moderate || 0}
                          onChange={(e) => updateThreshold(key, 'moderate', e.target.value)}
                          className="w-20"
                          step="0.1"
                        />
                        <span className="text-sm text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getQualityColor('Unhealthy') }}
                        />
                        <Label className="text-sm">Poor</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={localThresholds[key]?.poor || 0}
                          onChange={(e) => updateThreshold(key, 'poor', e.target.value)}
                          className="w-20"
                          step="0.1"
                        />
                        <span className="text-sm text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Air Quality Color Scheme
              </CardTitle>
              <CardDescription>
                Visual representation of air quality levels used throughout the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {qualityLevels.map((level) => (
                  <div key={level} className="flex items-center gap-4">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ backgroundColor: getQualityColor(level) }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{level}</div>
                      <div className="text-sm text-muted-foreground">
                        {getQualityColor(level)}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: getQualityColor(level),
                        color: 'white'
                      }}
                    >
                      {level}
                    </Badge>
                  </div>
                ))}
              </div>
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
                  <h4 className="font-medium mb-2">Connectivity</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Wi-Fi enabled</li>
                    <li>• MQTT protocol</li>
                    <li>• Real-time data transmission</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Locations</CardTitle>
                <CardDescription>Current deployment sites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Active Sites</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Abu Dhabi Estimada</li>
                    <li>• Burjeel Hospital</li>
                    <li>• Dubai Green Building</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Data Transmission</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Wi-Fi connectivity</li>
                    <li>• MQTT protocol</li>
                    <li>• Real-time updates every 30 seconds</li>
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