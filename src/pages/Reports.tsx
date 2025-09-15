import React, { useState, useEffect } from 'react';
import { useDevices } from '../contexts/DeviceContext';
import { useSettings } from '../contexts/SettingsContext';
import { ReportData } from '../types';
import { FileText, Download, Calendar, TrendingUp, Activity } from 'lucide-react';

const Reports: React.FC = () => {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const { devices } = useDevices();
    const { getQualityFromAqi } = useSettings();

    useEffect(() => {
        // Generate mock report data
        const generateReport = () => {
            const onlineDevices = devices.filter(d => d.isOnline).length;
            const offlineDevices = devices.length - onlineDevices;
            
            const mockReport: ReportData = {
                generatedAt: new Date().toISOString(),
                period: 'Last 24 Hours',
                devices: {
                    total: devices.length,
                    online: onlineDevices,
                    offline: offlineDevices
                },
                measurements: {
                    total: 28540,
                    averagePerHour: 1189
                },
                alerts: {
                    total: 12,
                    critical: 3,
                    warning: 7,
                    info: 2
                },
                quality: {
                    averageAqi: 67,
                    predominantLevel: 'Moderate',
                    trends: {
                        pm25: 'improving',
                        pm10: 'stable',
                        overall: 'improving'
                    }
                },
                topDevices: devices.slice(0, 5).map(device => ({
                    deviceId: device.id,
                    deviceName: device.name,
                    location: device.location.name,
                    averageAqi: Math.floor(Math.random() * 100) + 20,
                    measurements: Math.floor(Math.random() * 1000) + 500
                })),
                hourlyAverages: Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    pm25: Math.random() * 50 + 10,
                    pm10: Math.random() * 80 + 20,
                    aqi: Math.random() * 100 + 20
                }))
            };
            
            setReportData(mockReport);
            setLoading(false);
        };

        setTimeout(generateReport, 1000);
    }, [devices]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Activity className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-lg">Generating Report...</span>
            </div>
        );
    }

    if (!reportData) {
        return <div className="text-center py-10 text-slate-400">No report data available.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Air Quality Report</h1>
                    <p className="text-slate-400 mt-1">Comprehensive analysis of air quality metrics</p>
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <Download className="w-4 h-4" />
                    <span>Export PDF</span>
                </button>
            </div>

            {/* Report Summary */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Report Summary</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Period</h3>
                        <p className="text-white">{reportData.period}</p>
                        <p className="text-xs text-slate-400 mt-1">Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Network Status</h3>
                        <p className="text-white">{reportData.devices.online}/{reportData.devices.total} devices online</p>
                        <p className="text-xs text-slate-400 mt-1">{Math.round((reportData.devices.online / reportData.devices.total) * 100)}% uptime</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Data Quality</h3>
                        <p className="text-white">{reportData.measurements.total.toLocaleString()} measurements</p>
                        <p className="text-xs text-slate-400 mt-1">{reportData.measurements.averagePerHour}/hour average</p>
                    </div>
                </div>
            </div>

            {/* Air Quality Overview */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Air Quality Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{reportData.quality.averageAqi}</p>
                        <p className="text-slate-400">Average AQI</p>
                        <p className="text-sm text-yellow-400 mt-1">{reportData.quality.predominantLevel}</p>
                    </div>
                    <div className="text-center">
                        <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${
                            reportData.quality.trends.pm25 === 'improving' ? 'text-green-400' : 
                            reportData.quality.trends.pm25 === 'worsening' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <p className="text-slate-400">PM2.5 Trend</p>
                        <p className="text-sm text-white capitalize">{reportData.quality.trends.pm25}</p>
                    </div>
                    <div className="text-center">
                        <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${
                            reportData.quality.trends.pm10 === 'improving' ? 'text-green-400' : 
                            reportData.quality.trends.pm10 === 'worsening' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <p className="text-slate-400">PM10 Trend</p>
                        <p className="text-sm text-white capitalize">{reportData.quality.trends.pm10}</p>
                    </div>
                    <div className="text-center">
                        <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${
                            reportData.quality.trends.overall === 'improving' ? 'text-green-400' : 
                            reportData.quality.trends.overall === 'worsening' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <p className="text-slate-400">Overall Trend</p>
                        <p className="text-sm text-white capitalize">{reportData.quality.trends.overall}</p>
                    </div>
                </div>
            </div>

            {/* Top Performing Devices */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Performing Devices</h2>
                <div className="space-y-3">
                    {reportData.topDevices.map((device, index) => (
                        <div key={device.deviceId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="text-white font-medium">{device.deviceName}</p>
                                    <p className="text-xs text-slate-400">{device.location}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white">AQI {device.averageAqi}</p>
                                <p className="text-xs text-slate-400">{device.measurements} readings</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;