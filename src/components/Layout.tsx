import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Settings, AlertTriangle, FileText, Zap } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname === path;
    
    const navItems = [
        { path: '/', label: 'Dashboard', icon: BarChart3 },
        { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/well-report', label: 'Filter Analysis', icon: Zap },
        { path: '/management', label: 'Management', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Activity className="w-8 h-8 text-blue-400" />
                        <div>
                            <h1 className="text-xl font-bold text-white">RosaiQ Air OS</h1>
                            <p className="text-xs text-slate-400">LoRaWAN Air Quality Monitoring System</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-slate-300">UG65 Gateway Online</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar Navigation */}
                <nav className="w-64 bg-slate-800 border-r border-slate-700 min-h-[calc(100vh-80px)]">
                    <div className="p-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                            isActive(item.path)
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;