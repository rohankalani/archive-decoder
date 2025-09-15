import React, { useMemo } from 'react';
import { useRealtimeData } from '../contexts/RealtimeDataContext';
import { useDevices } from '../contexts/DeviceContext';
import { useSettings } from '../contexts/SettingsContext';
import DeviceCard from '../components/DeviceCard';
import { Activity, Wifi, WifiOff, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { realtimeData, connectionStatus } = useRealtimeData();
    const { devices, updateDevice } = useDevices();
    const { getQualityFromAqi } = useSettings();

    const stats = useMemo(() => {
        const onlineDevices = devices.filter(d => d.isOnline).length;
        const offlineDevices = devices.length - onlineDevices;
        
        // Calculate average IAQI across all devices
        const iaqiValues = Object.values(realtimeData)
            .map(data => data.readings.find(r => r.metric === 'iaqi')?.value)
            .filter((value): value is number => value !== undefined);
        
        const averageIaqi = iaqiValues.length > 0 
            ? Math.round(iaqiValues.reduce((sum, val) => sum + val, 0) / iaqiValues.length)
            : 0;

        const averageQuality = getQualityFromAqi(averageIaqi);

        // Count active alerts (simulated)
        const activeAlerts = devices.filter(d => !d.isOnline || (d.batteryLevel && d.batteryLevel < 20)).length;

        return {
            onlineDevices,
            offlineDevices,
            totalDevices: devices.length,
            averageIaqi,
            averageQuality,
            activeAlerts
        };
    }, [devices, realtimeData, getQualityFromAqi]);

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'Good': return 'text-green-400';
            case 'Moderate': return 'text-yellow-400';
            case 'Unhealthy for Sensitive Groups': return 'text-orange-400';
            case 'Unhealthy': return 'text-red-400';
            case 'Very Unhealthy': return 'text-red-500';
            case 'Hazardous': return 'text-purple-400';
            default: return 'text-slate-400';
        }
    };

    const getQualityBgColor = (quality: string) => {
        switch (quality) {
            case 'Good': return 'bg-green-900/20 border-green-500/30';
            case 'Moderate': return 'bg-yellow-900/20 border-yellow-500/30';
            case 'Unhealthy for Sensitive Groups': return 'bg-orange-900/20 border-orange-500/30';
            case 'Unhealthy': return 'bg-red-900/20 border-red-500/30';
            case 'Very Unhealthy': return 'bg-red-900/30 border-red-500/40';
            case 'Hazardous': return 'bg-purple-900/20 border-purple-500/30';
            default: return 'bg-slate-900/20 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Air Quality Dashboard</h1>
                    <p className="text-slate-400 mt-1">Real-time monitoring of your LoRaWAN sensor network</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                        connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm text-slate-300 capitalize">{connectionStatus}</span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Device Status */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Device Status</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <Wifi className="w-4 h-4 text-green-400" />
                                    <span className="text-white font-semibold">{stats.onlineDevices}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <WifiOff className="w-4 h-4 text-red-400" />
                                    <span className="text-white font-semibold">{stats.offlineDevices}</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                {/* Average Air Quality */}
                <div className={`rounded-lg border p-6 ${getQualityBgColor(stats.averageQuality)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Average IAQI</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.averageIaqi}</p>
                            <p className={`text-sm mt-1 ${getQualityColor(stats.averageQuality)}`}>
                                {stats.averageQuality}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                {/* Active Alerts */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Active Alerts</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.activeAlerts}</p>
                            <p className="text-sm text-red-400 mt-1">Requires Attention</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                </div>

                {/* Total Devices */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.totalDevices}</p>
                            <p className="text-sm text-slate-400 mt-1">Network Sensors</p>
                        </div>
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Device Grid */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Device Network</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {devices.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            realtimeData={realtimeData[device.id]}
                            onEdit={updateDevice}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;