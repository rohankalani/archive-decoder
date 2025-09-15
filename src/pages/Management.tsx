import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Settings, Save, RotateCcw } from 'lucide-react';

const Management: React.FC = () => {
    const { thresholds, updateThresholds, unitSystem, setUnitSystem } = useSettings();
    const [activeTab, setActiveTab] = useState('thresholds');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">System Management</h1>
                <p className="text-slate-400 mt-1">Configure system settings and monitoring parameters</p>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'thresholds', label: 'Thresholds' },
                        { id: 'units', label: 'Units' },
                        { id: 'network', label: 'Network' },
                        { id: 'system', label: 'System' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                {activeTab === 'thresholds' && (
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <Settings className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Quality Thresholds</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(thresholds).slice(0, 6).map(([metric, threshold]) => (
                                <div key={metric} className="bg-slate-700/50 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">
                                        {metric.replace('_', ' ')}
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Good ≤</label>
                                            <input
                                                type="number"
                                                value={threshold.good}
                                                onChange={(e) => updateThresholds(metric as any, {
                                                    ...threshold,
                                                    good: Number(e.target.value)
                                                })}
                                                className="w-full bg-slate-600 text-white px-3 py-2 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Moderate ≤</label>
                                            <input
                                                type="number"
                                                value={threshold.moderate}
                                                onChange={(e) => updateThresholds(metric as any, {
                                                    ...threshold,
                                                    moderate: Number(e.target.value)
                                                })}
                                                className="w-full bg-slate-600 text-white px-3 py-2 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Poor ≤</label>
                                            <input
                                                type="number"
                                                value={threshold.poor}
                                                onChange={(e) => updateThresholds(metric as any, {
                                                    ...threshold,
                                                    poor: Number(e.target.value)
                                                })}
                                                className="w-full bg-slate-600 text-white px-3 py-2 rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'units' && (
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <Settings className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Unit System</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Measurement System
                                </label>
                                <select
                                    value={unitSystem}
                                    onChange={(e) => setUnitSystem(e.target.value as any)}
                                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                                >
                                    <option value="metric">Metric (°C, km/h, µg/m³)</option>
                                    <option value="imperial">Imperial (°F, mph, µg/ft³)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <Settings className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Network Configuration</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Gateway IP Address
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="192.168.1.100"
                                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Update Interval (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue="30"
                                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <Settings className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">System Settings</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Data Retention (days)
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue="365"
                                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Alert Frequency (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue="15"
                                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-slate-700">
                    <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg">
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset to Defaults</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Management;