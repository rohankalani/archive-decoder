import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReportData } from '@/hooks/useReportData';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useDevices } from '@/hooks/useDevices';
import { useLocations } from '@/hooks/useLocations';

interface DateRange {
  from: Date;
  to: Date;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [showCustomDate, setShowCustomDate] = useState(false);

  const { devices } = useDevices();
  const { sites, buildings } = useLocations();

  // Calculate date range based on selected period
  const getDateRange = (): DateRange => {
    if (selectedPeriod === 'custom' && customDateRange) {
      return customDateRange;
    }

    const to = new Date();
    let from: Date;

    switch (selectedPeriod) {
      case '1d':
        from = subDays(to, 1);
        break;
      case '7d':
        from = subDays(to, 7);
        break;
      case '30d':
        from = subDays(to, 30);
        break;
      case '3m':
        from = subMonths(to, 3);
        break;
      default:
        from = subDays(to, 7);
    }

    return { from, to };
  };

  const dateRange = getDateRange();
  const { reportData, aiSummary, isLoading, isGeneratingReport, generateReport } = useReportData({
    dateRange,
    deviceId: selectedDevice === 'all' ? undefined : selectedDevice,
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
  });

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    if (value === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
    }
  };

  const handleGenerateReport = async () => {
    await generateReport();
  };

  const handleDownloadReport = () => {
    if (!aiSummary || !reportData) return;

    const reportContent = `
Air Quality Report - ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}

${aiSummary}

Data Summary:
- Total Readings: ${reportData.totalReadings}
- Average AQI: ${reportData.averageAqi?.toFixed(1) || 'N/A'}
- Peak Pollution Event: ${reportData.peakPollution?.value?.toFixed(2) || 'N/A'} ${reportData.peakPollution?.unit || ''}
- Alert Count: ${reportData.alertCount}

Generated on: ${format(new Date(), 'PPP')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air-quality-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Reports</h1>
          <p className="text-muted-foreground">
            Generate intelligent air quality reports with AI-powered insights
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Configure your report parameters and generate AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Device Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {devices?.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} (Site)
                    </SelectItem>
                  ))}
                  {buildings?.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} (Building)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from ? (
                        format(customDateRange.from, "PPP")
                      ) : (
                        "Start date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange?.from}
                      onSelect={(date) =>
                        setCustomDateRange((prev) => ({
                          from: date || new Date(),
                          to: prev?.to || new Date(),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange?.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.to ? (
                        format(customDateRange.to, "PPP")
                      ) : (
                        "End date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange?.to}
                      onSelect={(date) =>
                        setCustomDateRange((prev) => ({
                          from: prev?.from || new Date(),
                          to: date || new Date(),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate AI Report
                </>
              )}
            </Button>
            {aiSummary && (
              <Button variant="outline" onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
            <p>Loading report data...</p>
          </CardContent>
        </Card>
      )}

      {/* Report Summary */}
      {reportData && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalReadings}</div>
              <p className="text-xs text-muted-foreground">
                Collected over {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average AQI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.averageAqi?.toFixed(1) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Air Quality Index
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Pollution</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.peakPollution?.value?.toFixed(2) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.peakPollution?.sensorType} ({reportData.peakPollution?.unit})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Generated</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.alertCount}</div>
              <p className="text-xs text-muted-foreground">
                Quality threshold breaches
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              AI-Generated Report Summary
            </CardTitle>
            <CardDescription>
              Intelligent analysis of your air quality data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiSummary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}