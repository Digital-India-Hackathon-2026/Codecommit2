import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePlatform } from '../../context/PlatformContext';
import {
    Wifi, ShieldCheck, ShieldAlert, Activity,
    AlertTriangle, ChevronRight, RefreshCw, Shield
} from 'lucide-react';

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const PulseDot = ({ color }: { color: string }) => (
    <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
);

export default function Dashboard() {
    const { devices, theme, refreshData, lastRefreshed, warningsCount, isLoading } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => { setMounted(true); }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        refreshData();
        setTimeout(() => setRefreshing(false), 900);
    };

    // Calculate partitioned devices
    const quarantinedCount = devices.filter(d => d.mtlsStatus === 'failed').length;
    const onlineCount = devices.filter(d => d.status === 'connected' && d.mtlsStatus !== 'failed').length;
    const offlineCount = devices.filter(d => d.status === 'disconnected').length;
    const totalCount = devices.length;

    const onlinePercent = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;
    const offlinePercent = totalCount > 0 ? Math.round((offlineCount / totalCount) * 100) : 0;
    const quarantinedPercent = totalCount > 0 ? Math.round((quarantinedCount / totalCount) * 100) : 0;

    // Calculate security score
    const securityScore = Math.max(0, 100 - (quarantinedCount * 15) - (warningsCount * 10));

    // Determine threat level & colors
    let threatLevel = 'Normal';
    let threatColor = '#22c55e'; // Green
    if (quarantinedCount > 0 || securityScore < 70) {
        threatLevel = 'Elevated';
        threatColor = '#ef4444'; // Red
    } else if (warningsCount > 0) {
        threatLevel = 'Moderate';
        threatColor = '#eab308'; // Yellow
    }

    // AI summary observation count
    const underObservation = devices.filter(d => d.mtlsStatus === 'failed' || d.mtlsStatus === 'expiring_soon' || d.status === 'disconnected').length;
    const aiConfidence = totalCount > 0 ? (95 + (onlineCount / totalCount) * 4.8).toFixed(1) : '99.0';

    // Top SOC KPI Cards
    const statCards = [
        { label: 'Total Devices', value: String(totalCount), icon: <Wifi size={18} />, color: '#3b82f6' },
        { label: 'Active Devices', value: String(onlineCount), icon: <ShieldCheck size={18} />, color: '#22c55e' },
        { label: 'Unauthorized Devices', value: String(quarantinedCount), icon: <ShieldAlert size={18} />, color: quarantinedCount > 0 ? '#ef4444' : '#64748b' },
        { label: 'Certificate Warnings', value: String(warningsCount), icon: <AlertTriangle size={18} />, color: warningsCount > 0 ? '#eab308' : '#22c55e' },
    ];

    // Build list of dynamic security events
    const getRecentEvents = () => {
        const events = [];
        devices.forEach((d) => {
            if (d.mtlsStatus === 'failed') {
                events.push({
                    id: `evt_quar_${d.id}`,
                    title: `Device Quarantined`,
                    desc: `${d.name} was isolated due to invalid mTLS verification.`,
                    time: d.lastHeartbeat || 'Just now',
                    type: 'critical',
                    color: '#ef4444',
                    icon: <ShieldAlert size={16} />
                });
            } else if (d.status === 'connected') {
                events.push({
                    id: `evt_auth_${d.id}`,
                    title: `Device Authenticated`,
                    desc: `${d.name} completed secure TLS 1.3 handshake.`,
                    time: 'Just now',
                    type: 'healthy',
                    color: '#22c55e',
                    icon: <ShieldCheck size={16} />
                });
            }
        });

        return events.slice(0, 4);
    };

    const recentEvents = getRecentEvents();

    if (isLoading) {
        return (
            <div className={`min-h-screen pt-24 pb-24 flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'text-white bg-black' : 'text-[#1d1d1f] bg-white'}`}>
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="animate-spin text-[#3b82f6]" />
                    <p className={`text-[15px] tracking-[-0.01em] ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>Connecting to Platform...</p>
                </div>
            </div>
        );
    }

    const renderDonutChart = () => {
        if (totalCount === 0) {
            return (
                <svg width="70" height="70" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} strokeWidth="6" />
                </svg>
            );
        }
        const circ = 150.8;
        const onlineDash = (onlineCount / totalCount) * circ;
        const offlineDash = (offlineCount / totalCount) * circ;
        const quarantinedDash = (quarantinedCount / totalCount) * circ;

        return (
            <svg width="70" height="70" viewBox="0 0 60 60" className="relative flex-shrink-0">
                <circle cx="30" cy="30" r="24" fill="none" stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} strokeWidth="6" />
                
                {onlineCount > 0 && (
                    <circle
                        cx="30" cy="30" r="24"
                        fill="none" stroke="#22c55e" strokeWidth="6"
                        strokeDasharray={`${onlineDash} ${circ}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                    />
                )}
                
                {offlineCount > 0 && (
                    <circle
                        cx="30" cy="30" r="24"
                        fill="none" stroke="#94a3b8" strokeWidth="6"
                        strokeDasharray={`${offlineDash} ${circ}`}
                        strokeDashoffset={-onlineDash}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                    />
                )}
                
                {quarantinedCount > 0 && (
                    <circle
                        cx="30" cy="30" r="24"
                        fill="none" stroke="#ef4444" strokeWidth="6"
                        strokeDasharray={`${quarantinedDash} ${circ}`}
                        strokeDashoffset={-(onlineDash + offlineDash)}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                    />
                )}
            </svg>
        );
    };

    return (
        <div
            className={`min-h-screen pt-24 pb-24 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
        >
            <div className={`max-w-[1400px] mx-auto px-4 md:px-8 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-end justify-between mb-10"
                >
                    <div>
                        <p className={`text-[15px] tracking-[-0.01em] mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>{dateStr}</p>
                        <h1 className="text-[40px] font-semibold tracking-[-0.022em] leading-tight">
                            {getGreeting()}, Admin 👋
                        </h1>
                        <p className={`text-[19px] tracking-[-0.01em] mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                            Your IoT security platform is <span className="text-[#22c55e] font-medium">operational</span>.
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex flex-col items-end gap-0.5 text-right"
                    >
                        <div className={`flex items-center gap-2 text-[14px] font-medium border border-black/[0.06] px-4 py-2.5 rounded-[12px] transition-colors shadow-sm disabled:opacity-60 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-[#f5f5f7] text-[#64748b]'}`}>
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </div>
                        <span className={`text-[11px] ${theme === 'dark' ? 'text-white/60' : 'text-[#a1a1a6]'}`}>
                            Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </button>
                </motion.div>

                {/* SOC KPI Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.06 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {statCards.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 + i * 0.05 }}
                            className={`relative rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between gap-4 overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}
                        >
                            {/* Accent indicator bar */}
                            <div className="absolute top-0 left-5 right-5 h-[3px] rounded-b-full" style={{ backgroundColor: s.color }} />

                            <div className="flex items-center justify-between mt-1">
                                <span className={`text-[12px] font-medium leading-none ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>{s.label}</span>
                                <div className="p-1.5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}12`, color: s.color }}>
                                    {s.icon}
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <div className="text-[28px] font-bold tracking-tight leading-none">{s.value}</div>
                                <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: s.color }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                                    Active
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Device Health & AI Security Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Device Health */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.18 }}
                        className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}
                    >
                        <div className={`px-5 pt-5 pb-3 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}`}>
                            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Device Health</h2>
                            <Link to="/dashboard/devices" className="flex items-center gap-1 text-[13px] text-[#3b82f6] font-medium hover:opacity-80 transition-opacity">
                                View All <ChevronRight size={13} />
                            </Link>
                        </div>

                        {/* Donut Chart and Legend */}
                        <div className={`flex items-center gap-6 px-5 py-5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}`}>
                            {renderDonutChart()}
                            <div className="flex-1 flex flex-col gap-2 text-[13px]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#22c55e]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                                        <span>Online Devices</span>
                                    </div>
                                    <span className="font-semibold">{onlineCount} ({onlinePercent}%)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#94a3b8]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                                        <span>Offline Devices</span>
                                    </div>
                                    <span className="font-semibold">{offlineCount} ({offlinePercent}%)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#ef4444]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                                        <span>Unauthorized</span>
                                    </div>
                                    <span className="font-semibold">{quarantinedCount} ({quarantinedPercent}%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Devices List */}
                        <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-[#f5f5f7]'}`}>
                            {totalCount === 0 ? (
                                <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
                                        <Wifi size={24} />
                                    </div>
                                    <div className="text-[15px] font-medium mb-1">No Devices Connected</div>
                                    <div className={`text-[13px] ${theme === 'dark' ? 'text-white/50' : 'text-[#86868b]'}`}>Provision a device to start monitoring</div>
                                </div>
                            ) : (
                                devices.slice(0, 5).map(device => {
                                    const isQuarantined = device.mtlsStatus === 'failed';
                                    const isOn = device.status === 'connected' && !isQuarantined;
                                    
                                    let statusDotColor = '#94a3b8';
                                    let statusLabel = 'Offline';
                                    if (isQuarantined) {
                                        statusDotColor = '#ef4444';
                                        statusLabel = 'Unauthorized';
                                    } else if (isOn) {
                                        statusDotColor = '#22c55e';
                                        statusLabel = 'Online';
                                    }

                                    return (
                                        <div key={device.id} className="px-5 py-3 flex items-center gap-3">
                                            {isQuarantined || isOn ? <PulseDot color={statusDotColor} /> : <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-white/20' : 'bg-[#d2d2d7]'}`} />}
                                            <span className="flex-1 text-[15px] truncate font-medium">{device.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isQuarantined 
                                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20' 
                                                        : isOn 
                                                        ? 'bg-green-50 text-green-600 dark:bg-green-950/20' 
                                                        : 'bg-slate-50 text-slate-500 dark:bg-slate-900/20'
                                                }`}>
                                                    {statusLabel}
                                                </span>
                                                <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>{device.lastHeartbeat}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* AI Security Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.22 }}
                        className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}
                    >
                        <div>
                            <div className={`px-5 pt-5 pb-3 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}`}>
                                <div className="flex items-center gap-2">
                                    <Shield size={18} className="text-[#3b82f6]" />
                                    <h2 className="text-[17px] font-semibold tracking-[-0.015em]">AI Security Summary</h2>
                                </div>
                                <span className="text-[10px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    Active Guard
                                </span>
                            </div>

                            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
                                <div className="text-[40px] mb-3">🚀</div>
                                <div className="text-[18px] font-bold mb-2">Coming Soon</div>
                                <p className={`text-[13px] leading-relaxed max-w-sm ${theme === 'dark' ? 'text-white/60' : 'text-[#64748b]'}`}>
                                    AI-powered behavioral analysis and security recommendations will be available in a future update.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Events & Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                    {/* Recent Security Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.24 }}
                        className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}
                    >
                        <div className={`px-5 pt-5 pb-3 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}`}>
                            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Recent Security Events</h2>
                            <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                                Live Feed
                            </span>
                        </div>

                        <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-[#f5f5f7]'}`}>
                            {recentEvents.length === 0 ? (
                                <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                                        <Activity size={24} />
                                    </div>
                                    <div className="text-[15px] font-medium mb-1">No Events Logged</div>
                                    <div className="text-[13px] text-[#86868b]">All secure events will display here</div>
                                </div>
                            ) : (
                                recentEvents.map(evt => (
                                    <div key={evt.id} className="p-4 flex items-start gap-3.5 hover:bg-black/[0.005] dark:hover:bg-white/[0.005] transition-colors">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${evt.color}12`, color: evt.color }}>
                                            {evt.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-[14px] font-semibold tracking-tight">{evt.title}</span>
                                                <span className={`text-[11px] ${theme === 'dark' ? 'text-white/40' : 'text-[#86868b]'}`}>{evt.time}</span>
                                            </div>
                                            <p className={`text-[13px] leading-relaxed truncate ${theme === 'dark' ? 'text-white/60' : 'text-[#64748b]'}`}>
                                                {evt.desc}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                                            evt.type === 'critical' 
                                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20' 
                                                : evt.type === 'warning' 
                                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                                                : evt.type === 'healthy'
                                                ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                                                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                                        }`}>
                                            {evt.type}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.28 }}
                        className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}
                    >
                        <div className={`px-5 pt-5 pb-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}`}>
                            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Quick Actions</h2>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: 'Devices', desc: 'Provision and manage secure IoT nodes', to: '/dashboard/devices', color: '#3b82f6', icon: <Wifi size={18} /> },
                                { title: 'Certificates', desc: 'Rotate and verify mTLS credentials', to: '/dashboard/certificates', color: '#22c55e', icon: <ShieldCheck size={18} /> },
                                { title: 'Alerts', desc: 'Investigate system warnings and threats', to: '/dashboard/notifications', color: '#ef4444', icon: <AlertTriangle size={18} /> },
                                { title: 'Broker Logs', desc: 'Inspect live MQTT network streams', to: '/dashboard/broker-logs', color: '#eab308', icon: <Activity size={18} /> },
                            ].map(card => (
                                <Link key={card.title} to={card.to} style={{ textDecoration: 'none' }}>
                                    <div className={`rounded-[16px] border border-black/[0.03] dark:border-white/[0.03] p-4 flex items-center gap-4 transition-all cursor-pointer group hover:bg-[#3b82f6]/5 hover:border-[#3b82f6]/20 dark:hover:bg-[#3b82f6]/10 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${card.color}12`, color: card.color }}>
                                            {card.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[15px] font-semibold group-hover:text-[#3b82f6] transition-colors mb-0.5">{card.title}</div>
                                            <div className={`text-[12px] truncate ${theme === 'dark' ? 'text-white/50' : 'text-[#86868b]'}`}>{card.desc}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-[#d2d2d7] group-hover:text-[#3b82f6] transition-colors flex-shrink-0" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
