import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDevices } from '../contexts/DeviceContext';
import { useRealtimeData } from '../contexts/RealtimeDataContext';
import { ArrowLeft, Wifi, WifiOff, Battery, MapPin, Calendar, Activity } from 'lucide-react';

const DeviceDetail: React.FC = () => {
    const { deviceId } = useParams<{ deviceId: string }>();
    const { devices } = useDevices();
    const { realtimeData } = useRealtimeData();
    const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

    const device = devices.find(d => d.id === deviceId);
    const currentData = deviceId ? realtimeData[deviceId] : undefined;

    if (!device) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                <div className="text-center py-10">
                    <p className="text-xl text-slate-400">Device not found</p>
                </div>
            </div>
        );
    }

    const isOnline = device.isOnline;
    const lastSeenMinutesAgo = Math.floor((new Date().getTime() - new Date(device.lastSeen).getTime()) / 60000);

    const getQualityColor = (quality?: string) => {
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

    const getQualityBgColor = (quality?: string) => {
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
            <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </Link>
            </div>

            {/* Device Header */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">{device.name}</h1>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{device.location.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Activity className="w-4 h-4" />
                                <span>ID: {device.id}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Version {device.version}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                            <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Last seen: {lastSeenMinutesAgo === 0 ? 'Just now' : `${lastSeenMinutesAgo}m ago`}
                        </p>
                    </div>
                </div>

                {/* Device Status Bar */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            {isOnline ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                            <span className="text-sm text-slate-300">{device.signalStrength}dBm</span>
                        </div>
                        {device.batteryLevel && (
                            <div className="flex items-center space-x-2">
                                <Battery className="w-4 h-4" />
                                <span className={`text-sm ${device.batteryLevel < 20 ? 'text-red-400' : 'text-slate-300'}`}>
                                    {device.batteryLevel}%
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-slate-400">
                        Sensors: {device.sensors.join(', ')}
                    </div>
                </div>
            </div>

            {/* Current Readings */}
            {currentData && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Current Readings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {currentData.readings.map((reading, index) => (
                            <div
                                key={index}
                                className={`rounded-lg border p-4 ${
                                    reading.quality ? getQualityBgColor(reading.quality) : 'bg-slate-800 border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                                        {reading.metric.replace('_', ' ')}
                                    </h3>
                                    {reading.quality && (
                                        <span className={`text-xs px-2 py-1 rounded ${getQualityColor(reading.quality)}`}>
                                            {reading.quality}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end space-x-1">
                                    <span className="text-2xl font-bold text-white">{reading.value}</span>
                                    <span className="text-sm text-slate-400 mb-1">{reading.unit}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Updated: {new Date(reading.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Time Range Selector */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Historical Data</h2>
                    <select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
                
                {/* Placeholder for charts */}
                <div className="bg-slate-900/50 rounded-lg p-8 text-center">
                    <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Historical charts will be displayed here</p>
                    <p className="text-sm text-slate-500 mt-2">Selected range: {selectedTimeRange}</p>
                </div>
            </div>

            {/* Device Configuration */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Device Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Location Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Name:</span>
                                <span className="text-white">{device.location.name}</span>
                            </div>
                            {device.location.address && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Address:</span>
                                    <span className="text-white">{device.location.address}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-400">Coordinates:</span>
                                <span className="text-white">
                                    {device.location.coordinates[0].toFixed(4)}, {device.location.coordinates[1].toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Device Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Type:</span>
                                <span className="text-white capitalize">{device.type.replace('-', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Firmware:</span>
                                <span className="text-white">v{device.version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Sensor Count:</span>
                                <span className="text-white">{device.sensors.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceDetail;