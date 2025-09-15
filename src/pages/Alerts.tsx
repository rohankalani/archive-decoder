import React, { useState, useMemo } from 'react';
import { useDevices } from '../contexts/DeviceContext';
import { Alert, AlertSeverity, AlertStatus } from '../types';
import { AlertTriangle, CheckCircle, Clock, Filter, Search } from 'lucide-react';

const Alerts: React.FC = () => {
    const { devices } = useDevices();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');

    // Generate mock alerts based on device states
    const alerts = useMemo(() => {
        const generatedAlerts: Alert[] = [];
        let alertId = 1;

        devices.forEach(device => {
            // Device offline alerts
            if (!device.isOnline) {
                generatedAlerts.push({
                    id: `alert-${alertId++}`,
                    deviceId: device.id,
                    deviceName: device.name,
                    type: 'device-offline',
                    severity: 'critical',
                    message: `Device "${device.name}" has gone offline and is not responding to network requests.`,
                    timestamp: device.lastSeen,
                    status: 'active'
                });
            }

            // Low battery alerts
            if (device.batteryLevel && device.batteryLevel < 20) {
                generatedAlerts.push({
                    id: `alert-${alertId++}`,
                    deviceId: device.id,
                    deviceName: device.name,
                    type: 'low-battery',
                    severity: device.batteryLevel < 10 ? 'critical' : 'warning',
                    message: `Device "${device.name}" battery level is critically low at ${device.batteryLevel}%.`,
                    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                    status: 'active'
                });
            }

            // Signal strength warnings
            if (device.signalStrength && device.signalStrength < -80) {
                generatedAlerts.push({
                    id: `alert-${alertId++}`,
                    deviceId: device.id,
                    deviceName: device.name,
                    type: 'threshold-exceeded',
                    severity: 'warning',
                    message: `Device "${device.name}" has poor signal strength at ${device.signalStrength}dBm.`,
                    timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
                    status: 'active'
                });
            }
        });

        // Add some resolved alerts for demo
        generatedAlerts.push({
            id: `alert-${alertId++}`,
            deviceId: 'sim-device-02',
            deviceName: 'Parking Lot Monitor',
            type: 'threshold-exceeded',
            severity: 'warning',
            message: 'PM2.5 levels exceeded healthy threshold (35.4 µg/m³).',
            timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
            status: 'resolved',
            resolvedAt: new Date(Date.now() - 2 * 3600000).toISOString()
        });

        return generatedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [devices]);

    const filteredAlerts = alerts.filter(alert => {
        const matchesSearch = alert.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             alert.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
        const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
        
        return matchesSearch && matchesSeverity && matchesStatus;
    });

    const getSeverityColor = (severity: AlertSeverity) => {
        switch (severity) {
            case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30';
            case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
            case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
        }
    };

    const getSeverityIcon = (severity: AlertSeverity) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case 'info': return <AlertTriangle className="w-5 h-5 text-blue-400" />;
        }
    };

    const getStatusIcon = (status: AlertStatus) => {
        return status === 'resolved' ? 
            <CheckCircle className="w-4 h-4 text-green-400" /> : 
            <Clock className="w-4 h-4 text-orange-400" />;
    };

    const stats = {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        warning: alerts.filter(a => a.severity === 'warning' && a.status === 'active').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">System Alerts</h1>
                <p className="text-slate-400 mt-1">Monitor and manage system alerts and notifications</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Alerts</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-400" />
                    </div>
                </div>
                
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-200 text-sm">Critical</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.critical}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-200 text-sm">Warning</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.warning}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search alerts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
                                className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                            </select>
                        </div>
                        
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'all')}
                            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-slate-400">No alerts match your current filters.</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`rounded-lg border p-6 ${getSeverityColor(alert.severity)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="flex-shrink-0 mt-1">
                                        {getSeverityIcon(alert.severity)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">
                                                {alert.deviceName}
                                            </h3>
                                            <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300 uppercase tracking-wide">
                                                {alert.type.replace('-', ' ')}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                {getStatusIcon(alert.status)}
                                                <span className="text-sm text-slate-300 capitalize">{alert.status}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-200 mb-3">{alert.message}</p>
                                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                                            <span>Alert ID: {alert.id}</span>
                                            <span>•</span>
                                            <span>Created: {new Date(alert.timestamp).toLocaleString()}</span>
                                            {alert.resolvedAt && (
                                                <>
                                                    <span>•</span>
                                                    <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-2 ml-4">
                                    {alert.status === 'active' && (
                                        <>
                                            <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                                Acknowledge
                                            </button>
                                            <button className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                                Resolve
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Alerts;