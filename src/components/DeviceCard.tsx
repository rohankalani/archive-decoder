import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Device, RealtimeData } from '../types';
import { Edit, Wifi, WifiOff, Battery, Signal } from 'lucide-react';

interface DeviceCardProps {
    device: Device;
    realtimeData?: RealtimeData;
    onEdit?: (deviceId: string, updates: Partial<Device>) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, realtimeData, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(device.name);

    const isOnline = device.isOnline;
    const lastSeenMinutesAgo = Math.floor((new Date().getTime() - new Date(device.lastSeen).getTime()) / 60000);

    const handleEdit = () => {
        if (isEditing) {
            if (onEdit) {
                onEdit(device.id, { name: editedName });
            }
        }
        setIsEditing(!isEditing);
    };

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

    const pm25Reading = realtimeData?.readings.find(r => r.metric === 'pm25');
    const iaqiReading = realtimeData?.readings.find(r => r.metric === 'iaqi');
    const temperatureReading = realtimeData?.readings.find(r => r.metric === 'temperature');

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="bg-slate-700 text-white px-2 py-1 rounded text-lg font-semibold w-full"
                            onBlur={handleEdit}
                            onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                            autoFocus
                        />
                    ) : (
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            {device.name}
                            {onEdit && (
                                <button onClick={handleEdit} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit className="w-4 h-4 text-slate-400 hover:text-white" />
                                </button>
                            )}
                        </h3>
                    )}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-slate-400">
                        {lastSeenMinutesAgo === 0 ? 'Just now' : `${lastSeenMinutesAgo}m ago`}
                    </p>
                </div>
            </div>
            
            <p className="text-sm text-white truncate" title={device.location.name}>{device.location.name}</p>
            
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                <p className={`text-xs ${isOnline ? 'text-slate-300' : 'text-slate-500'}`}>{isOnline ? 'Online' : 'Offline'}</p>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1">
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span className="text-slate-400">{device.signalStrength}dBm</span>
                </div>
                {device.batteryLevel && (
                    <div className="flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        <span className={`${device.batteryLevel < 20 ? 'text-red-400' : 'text-slate-400'}`}>
                            {device.batteryLevel}%
                        </span>
                    </div>
                )}
            </div>

            {/* Key Metrics */}
            {realtimeData && (
                <div className="mt-4 space-y-2">
                    {pm25Reading && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">PM2.5</span>
                            <div className="text-right">
                                <span className="text-white font-medium">{pm25Reading.value} {pm25Reading.unit}</span>
                                <span className={`ml-2 text-xs ${getQualityColor(pm25Reading.quality)}`}>
                                    {pm25Reading.quality}
                                </span>
                            </div>
                        </div>
                    )}
                    {iaqiReading && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">IAQI</span>
                            <div className="text-right">
                                <span className="text-white font-medium">{iaqiReading.value}</span>
                                <span className={`ml-2 text-xs ${getQualityColor(iaqiReading.quality)}`}>
                                    {iaqiReading.quality}
                                </span>
                            </div>
                        </div>
                    )}
                    {temperatureReading && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Temperature</span>
                            <span className="text-white font-medium">{temperatureReading.value} {temperatureReading.unit}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Button */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <Link
                    to={`/device/${device.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default DeviceCard;