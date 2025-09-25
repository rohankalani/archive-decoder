import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { ParameterThresholds, AqiLevel } from '@/types';
import { Settings as SettingsIcon, RotateCcw, Save, Palette } from 'lucide-react';

export function Settings() {
  const { thresholds, updateThresholds, resetToDefaults, getQualityColor } = useSettings();
  const [localThresholds, setLocalThresholds] = useState<ParameterThresholds>(thresholds);
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
      description: "Air quality thresholds have been reset to UAE defaults.",
    });
  };

  const updateThreshold = (
    parameter: keyof ParameterThresholds,
    level: keyof ParameterThresholds[keyof ParameterThresholds],
    index: 0 | 1,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setLocalThresholds(prev => ({
      ...prev,
      [parameter]: {
        ...prev[parameter],
        [level]: index === 0 
          ? [numValue, prev[parameter][level][1]]
          : [prev[parameter][level][0], numValue]
      }
    }));
  };

  const qualityLevels: { key: keyof ParameterThresholds[keyof ParameterThresholds], label: string, color: AqiLevel }[] = [
    { key: 'good', label: 'Good', color: 'Good' },
    { key: 'moderate', label: 'Moderate', color: 'Moderate' },
    { key: 'unhealthySensitive', label: 'Unhealthy for Sensitive Groups', color: 'Unhealthy for Sensitive Groups' },
    { key: 'unhealthy', label: 'Unhealthy', color: 'Unhealthy' },
    { key: 'veryUnhealthy', label: 'Very Unhealthy', color: 'Very Unhealthy' },
    { key: 'hazardous', label: 'Hazardous', color: 'Hazardous' }
  ];

  const parameters: { key: keyof ParameterThresholds, label: string, unit: string, description: string }[] = [
    { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', description: 'Fine particulate matter (≤2.5 micrometers)' },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³', description: 'Coarse particulate matter (≤10 micrometers)' },
    { key: 'hcho', label: 'HCHO', unit: 'ppb', description: 'Formaldehyde concentration' },
    { key: 'co2', label: 'CO₂', unit: 'ppm', description: 'Carbon dioxide concentration' },
    { key: 'voc', label: 'VOC', unit: 'index', description: 'Volatile organic compounds index (0-500)' },
    { key: 'nox', label: 'NOₓ', unit: 'index', description: 'Nitrogen oxides index (0-500)' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure air quality thresholds and system parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to UAE Defaults
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
                    {qualityLevels.map(({ key: levelKey, label: levelLabel, color }) => (
                      <div key={levelKey} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: getQualityColor(color) }}
                          />
                          <Label className="text-sm">{levelLabel}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={localThresholds[key][levelKey][0]}
                            onChange={(e) => updateThreshold(key, levelKey, 0, e.target.value)}
                            className="w-20"
                            step="0.1"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="number"
                            value={localThresholds[key][levelKey][1]}
                            onChange={(e) => updateThreshold(key, levelKey, 1, e.target.value)}
                            className="w-20"
                            step="0.1"
                          />
                          <span className="text-sm text-muted-foreground">{unit}</span>
                        </div>
                      </div>
                    ))}
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
                {qualityLevels.map(({ color, label }) => (
                  <div key={color} className="flex items-center gap-4">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ backgroundColor: getQualityColor(color) }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {getQualityColor(color)}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: getQualityColor(color),
                        color: 'white'
                      }}
                    >
                      {color}
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
                <CardTitle>Device Information</CardTitle>
                <CardDescription>ROSAIQ ULTRADETEKT 03M specifications</CardDescription>
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
                <CardTitle>UAE Air Quality Standards</CardTitle>
                <CardDescription>Based on UAE environmental regulations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">AQI Calculation</h4>
                  <div className="text-sm text-muted-foreground">
                    AQI = MAX(PM2.5, PM10, VOC, NOₓ, HCHO)
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Quality Levels</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good</span>
                      <span className="text-muted-foreground">0-50 AQI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Moderate</span>
                      <span className="text-muted-foreground">51-100 AQI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unhealthy (Sensitive)</span>
                      <span className="text-muted-foreground">101-150 AQI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unhealthy</span>
                      <span className="text-muted-foreground">151-200 AQI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Very Unhealthy</span>
                      <span className="text-muted-foreground">201-300 AQI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hazardous</span>
                      <span className="text-muted-foreground">301-500 AQI</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}