import React, { useState, useEffect } from 'react';
import { WellReportData } from '../types';
import { Zap, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';

const WellReport: React.FC = () => {
    const [reportData, setReportData] = useState<WellReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Generate mock filter performance data
        const generateWellReport = () => {
            const mockData: WellReportData = {
                generatedAt: new Date().toISOString(),
                filterId: 'filter-ahu-001',
                filterName: 'AHU-1 Filter Bank',
                installationDate: '2023-06-15',
                lastMaintenance: '2024-08-10',
                nextMaintenanceDue: '2024-11-10',
                currentStatus: 'good',
                performanceHistory: Array.from({ length: 30 }, (_, i) => ({
                    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
                    pressureDrop: 120 + Math.random() * 80 + i * 2,
                    flowRate: 5000 - Math.random() * 200 - i * 5,
                    efficiency: 95 - Math.random() * 5 - i * 0.1,
                    powerConsumption: 12 + Math.random() * 3 + i * 0.05,
                    maintenanceScore: 100 - i * 2 - Math.random() * 5
                })),
                totalCost: 15420.50,
                energyCostPerDay: 28.75,
                replacementCostSavings: 2340.00,
                recommendations: [
                    'Schedule maintenance within the next 2 weeks',
                    'Monitor pressure drop closely - approaching warning threshold',
                    'Consider upgrading to high-efficiency filters for better performance'
                ],
                summary: 'Filter performance is declining gradually but within acceptable parameters. Energy consumption has increased by 12% over the past month.'
            };
            
            setReportData(mockData);
            setLoading(false);
        };

        setTimeout(generateWellReport, 1200);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Zap className="w-8 h-8 text-accent animate-spin" />
                <span className="ml-3 text-lg">Analyzing Filter Performance...</span>
            </div>
        );
    }

    if (!reportData) {
        return <div className="text-center py-10 text-slate-400">No data available for the report.</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'text-green-400 bg-green-900/20';
            case 'good': return 'text-blue-400 bg-blue-900/20';
            case 'fair': return 'text-yellow-400 bg-yellow-900/20';
            case 'poor': return 'text-orange-400 bg-orange-900/20';
            case 'critical': return 'text-red-400 bg-red-900/20';
            default: return 'text-slate-400 bg-slate-900/20';
        }
    };

    const latestData = reportData.performanceHistory[reportData.performanceHistory.length - 1];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Filter Lifecycle Analysis</h1>
                    <p className="text-slate-400 mt-1">Performance and energy cost monitoring for {reportData.filterName}.</p>
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                </button>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`rounded-lg border p-6 ${getStatusColor(reportData.currentStatus)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-300 text-sm">Current Status</p>
                            <p className="text-xl font-bold text-white mt-1 capitalize">{reportData.currentStatus}</p>
                        </div>
                        <Zap className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Pressure Drop</p>
                            <p className="text-xl font-bold text-white mt-1">{latestData.pressureDrop.toFixed(1)} Pa</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-orange-400" />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Energy Cost/Day</p>
                            <p className="text-xl font-bold text-white mt-1">${reportData.energyCostPerDay}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Next Maintenance</p>
                            <p className="text-xl font-bold text-white mt-1">
                                {Math.ceil((new Date(reportData.nextMaintenanceDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Performance Summary</h2>
                <p className="text-slate-300 mb-4">{reportData.summary}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Current Metrics</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Flow Rate:</span>
                                <span className="text-white">{latestData.flowRate.toFixed(0)} m³/h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Efficiency:</span>
                                <span className="text-white">{latestData.efficiency.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Power:</span>
                                <span className="text-white">{latestData.powerConsumption.toFixed(1)} kW</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Maintenance Info</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Installed:</span>
                                <span className="text-white">{new Date(reportData.installationDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Last Service:</span>
                                <span className="text-white">{new Date(reportData.lastMaintenance).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Next Due:</span>
                                <span className="text-white">{new Date(reportData.nextMaintenanceDue).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Cost Analysis</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total Cost:</span>
                                <span className="text-white">${reportData.totalCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Daily Energy:</span>
                                <span className="text-white">${reportData.energyCostPerDay}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Savings:</span>
                                <span className="text-green-400">${reportData.replacementCostSavings.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recommendations</h2>
                <div className="space-y-3">
                    {reportData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                            </span>
                            <p className="text-blue-100">{recommendation}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WellReport;