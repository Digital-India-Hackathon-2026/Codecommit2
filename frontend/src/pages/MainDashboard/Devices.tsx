import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import {
    Wifi, WifiOff, Shield, ShieldCheck, ShieldAlert,
    RefreshCw, Plus, X, Search, Filter,
    Eye, Edit2, RotateCw, Trash2, ShieldX, Server, Activity, Calendar
} from 'lucide-react';

const PulseDot = ({ color }: { color: string }) => (
    <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
);

// Map device to dynamic extended fields for realistic SOC view
const getExtendedFields = (device: any) => {
    const idHash = device.id.substring(0, 4).toUpperCase();
    const isQuarantined = device.mtlsStatus === 'failed';
    const isObservation = device.mtlsStatus === 'expiring_soon';
    
    // Status Mappings
    let statusLabel: 'Online' | 'Offline' | 'Observation' | 'Quarantined' = 'Offline';
    let statusColor = '#94a3b8';
    if (isQuarantined) {
        statusLabel = 'Quarantined';
        statusColor = '#ef4444';
    } else if (isObservation) {
        statusLabel = 'Observation';
        statusColor = '#eab308';
    } else if (device.status === 'connected') {
        statusLabel = 'Online';
        statusColor = '#22c55e';
    }

    // Trust Score Mappings
    let trustScore = 98;
    if (isQuarantined) trustScore = 15;
    else if (isObservation) trustScore = 65;
    else if (device.status === 'disconnected') trustScore = 80;

    let trustColor = '#22c55e'; // Green (80–100)
    let trustText = 'Excellent';
    if (trustScore < 60) {
        trustColor = '#ef4444'; // Red (below 60)
        trustText = 'Critical';
    } else if (trustScore < 80) {
        trustColor = '#eab308'; // Yellow (60-79)
        trustText = 'Warning';
    }

    // Risk Level (derived from Trust Score)
    let riskLabel: 'Low' | 'Medium' | 'High' = 'Low';
    let riskColor = '#22c55e';
    let riskBg = 'bg-green-50 text-green-600 dark:bg-green-950/20';
    if (trustScore < 60) {
        riskLabel = 'High';
        riskColor = '#ef4444';
        riskBg = 'bg-red-50 text-red-600 dark:bg-red-950/20';
    } else if (trustScore < 80) {
        riskLabel = 'Medium';
        riskColor = '#eab308';
        riskBg = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20';
    }

    // Cert Status Mappings: Valid, Expiring Soon, Expired, Revoked
    let certLabel = 'Valid';
    let certColor = '#22c55e';
    let certBg = 'bg-green-50 text-green-600 dark:bg-green-950/20 border border-green-200/30';
    if (isQuarantined) {
        certLabel = 'Revoked';
        certColor = '#64748b';
        certBg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300/30';
    } else if (isObservation) {
        certLabel = 'Expiring Soon';
        certColor = '#eab308';
        certBg = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 border border-amber-200/30';
    } else if (device.status === 'disconnected') {
        certLabel = 'Expired';
        certColor = '#ef4444';
        certBg = 'bg-red-50 text-red-600 dark:bg-red-950/20 border border-red-200/30';
    }

    // Firmware Status Indicator
    const isLatest = device.firmwareVersion !== '1.0.0' && device.firmwareVersion !== 'v1.0.0';
    const fwIndicator = isLatest ? '✓ Latest' : '⚠ Update Available';
    const fwColor = isLatest ? 'text-green-600 animate-pulse' : 'text-amber-500';

    // Last Heartbeat and Health Indicator
    let heartbeatValue = '5 sec ago';
    let heartbeatStatus: 'Healthy' | 'Delayed' | 'Missing' = 'Healthy';
    let heartbeatColor = '#22c55e'; // Green
    
    if (isQuarantined || device.status === 'disconnected') {
        heartbeatValue = device.lastHeartbeat && device.lastHeartbeat !== 'Just now' ? device.lastHeartbeat : '2 hours ago';
        if (heartbeatValue === '1s ago' || heartbeatValue === '2s ago' || heartbeatValue === '3s ago' || heartbeatValue === '5s ago') {
            heartbeatValue = '2 hours ago';
        }
        heartbeatStatus = 'Missing';
        heartbeatColor = '#ef4444'; // Red
    } else if (isObservation) {
        heartbeatValue = '30 sec ago';
        heartbeatStatus = 'Delayed';
        heartbeatColor = '#eab308'; // Yellow
    } else {
        if (device.lastHeartbeat === 'Just now') {
            heartbeatValue = '5 sec ago';
        } else {
            heartbeatValue = device.lastHeartbeat;
        }
    }

    return {
        statusLabel,
        statusColor,
        trustScore,
        trustColor,
        trustText,
        riskLabel,
        riskColor,
        riskBg,
        certLabel,
        certColor,
        certBg,
        fwIndicator,
        fwColor,
        heartbeatValue,
        heartbeatStatus,
        heartbeatColor,
        manufacturer: device.type === 'Gateway' ? 'Nakshatra Edge Corp' : 'Telit Solutions',
        model: device.type === 'Gateway' ? 'N-GW-V2' : device.type === 'Sensor' ? 'N-SN-102' : 'N-ACT-401',
        macAddress: `00:1A:2B:3C:5D:${idHash.slice(0, 2)}`,
        registrationDate: 'Mar 12, 2026',
        mqttTopic: `nakshatra/devices/${device.id}/telemetry`,
        signalStrength: device.status === 'connected' ? '-62 dBm' : 'N/A',
        lastSeen: device.status === 'connected' ? 'Just now' : '8m ago',
        timeline: [
            { event: 'Device Registered', date: 'Mar 12, 2026 10:24 AM', desc: 'Device provisioned by Admin.' },
            { event: 'Certificate Issued', date: 'Mar 12, 2026 10:25 AM', desc: 'mTLS certificate generated by Nakshatra Root CA.' },
            { event: 'Authenticated', date: device.status === 'connected' ? 'Jul 10, 2026 11:20 AM' : 'Jul 09, 2026 04:15 PM', desc: 'Secure connection established.' },
            { event: 'Connected', date: device.status === 'connected' ? 'Jul 10, 2026 11:20 AM' : 'Jul 09, 2026 04:15 PM', desc: 'MQTT stream active.' },
            { event: 'Trust Score Updated', date: 'Jul 10, 2026 11:25 AM', desc: `Calculated score: ${trustScore}% based on network safety.` },
            { event: 'Latest Activity', date: 'Just now', desc: 'Active communication with local broker.' }
        ]
    };
};

export default function Devices() {
    const { devices, theme, rotateCertificate, revokeDevice, provisionDevice, isLoading } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [restartingId, setRestartingId] = useState<string | null>(null);
    const [showProvisionModal, setShowProvisionModal] = useState(false);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Provisioning Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'Sensor' | 'Gateway' | 'Actuator'>('Sensor');
    const [newIp, setNewIp] = useState('');
    const [newLoc, setNewLoc] = useState('');

    // Editing State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const handleRotate = async (id: string) => {
        setRotatingId(id);
        await rotateCertificate(id);
        setTimeout(() => {
            setRotatingId(null);
            // Refresh detail view if panel is open
            if (selectedDevice && selectedDevice.id === id) {
                const updated = devices.find(d => d.id === id);
                if (updated) setSelectedDevice(updated);
            }
        }, 1000);
    };

    const handleRestart = (id: string) => {
        setRestartingId(id);
        setTimeout(() => {
            setRestartingId(null);
            alert(`Device ${id} restarted successfully.`);
        }, 1500);
    };

    const handleQuarantineToggle = async (id: string) => {
        await revokeDevice(id);
        setTimeout(() => {
            // Refresh detail view if panel is open
            if (selectedDevice && selectedDevice.id === id) {
                const updated = devices.find(d => d.id === id);
                if (updated) setSelectedDevice(updated);
            }
        }, 500);
    };

    const handleProvision = (e: React.FormEvent) => {
        e.preventDefault();
        provisionDevice({
            name: newName,
            type: newType,
            ip: newIp,
            location: newLoc
        });
        setShowProvisionModal(false);
        setNewName(''); setNewIp(''); setNewLoc('');
    };

    const handleEditClick = (device: any) => {
        setEditingDevice(device);
        setEditName(device.name);
        setShowEditModal(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDevice) {
            editingDevice.name = editName;
            setShowEditModal(false);
            setEditingDevice(null);
        }
    };

    // Calculate Partition Statistics
    const quarantinedCount = devices.filter(d => d.mtlsStatus === 'failed').length;
    const onlineCount = devices.filter(d => d.status === 'connected' && d.mtlsStatus !== 'failed').length;
    const offlineCount = devices.filter(d => d.status === 'disconnected').length;
    const totalCount = devices.length;

    // Filter logic
    const filteredDevices = devices.filter(device => {
        const ext = getExtendedFields(device);
        const matchesSearch = 
            device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.ip.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = statusFilter === 'all' || ext.statusLabel.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const summaryCards = [
        { label: 'Total Devices', value: String(totalCount), desc: 'Fleet Size', icon: <Server size={18} />, color: '#3b82f6' },
        { label: 'Online Devices', value: String(onlineCount), desc: 'Connected & Secure', icon: <Wifi size={18} />, color: '#22c55e' },
        { label: 'Offline Devices', value: String(offlineCount), desc: 'Unreachable Nodes', icon: <WifiOff size={18} />, color: '#94a3b8' },
        { label: 'Unauthorized Devices', value: String(quarantinedCount), desc: 'Identity Revoked', icon: <ShieldAlert size={18} />, color: '#ef4444' },
    ];

    if (isLoading) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="animate-spin text-[#3b82f6]" />
                    <p className={`text-[15px] tracking-[-0.01em] ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>Loading Devices...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
            className={`min-h-screen pt-24 pb-24 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}
        >
            <div className={`max-w-[1400px] mx-auto px-4 md:px-8 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[36px] font-bold tracking-tight">IoT Devices</h1>
                        <p className={`text-[15px] mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                            Manage, monitor, and secure all connected IoT devices.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search Device"
                                className={`pl-10 pr-4 py-2.5 rounded-[12px] text-[14px] border outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all w-[220px] ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                            />
                        </div>
                        <div className="relative flex items-center">
                            <Filter size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className={`pl-10 pr-8 py-2.5 rounded-[12px] text-[14px] border outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all appearance-none cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                            >
                                <option value="all">Filter</option>
                                <option value="online">🟢 Online</option>
                                <option value="offline">⚪ Offline</option>
                                <option value="observation">🟡 Observation</option>
                                <option value="quarantined">🔴 Unauthorized</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {summaryCards.map((c) => (
                        <div key={c.label} className={`relative rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between gap-4 overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                            <div className="absolute top-0 left-5 right-5 h-[3px] rounded-b-full" style={{ backgroundColor: c.color }} />
                            <div className="flex items-center justify-between mt-1">
                                <span className={`text-[12px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>{c.label}</span>
                                <div className="p-1.5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}12`, color: c.color }}>
                                    {c.icon}
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <div className="text-[28px] font-bold tracking-tight leading-none">{c.value}</div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full`} style={{ backgroundColor: `${c.color}12`, color: c.color }}>
                                    {c.desc}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Inventory Table */}
                <div className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className={`border-b text-[11px] font-semibold tracking-wider uppercase ${theme === 'dark' ? 'border-white/10 text-white/40 bg-white/5' : 'border-[#f5f5f7] text-[#86868b] bg-slate-50'}`}>
                                    <th className="px-4 py-3 whitespace-nowrap">Device ID</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Device Name</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Device Type</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Certificate Status</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Firmware Version</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Last Heartbeat</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Last Seen</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-[#f5f5f7]'}`}>
                                {filteredDevices.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Server size={32} className="text-slate-400" />
                                                <p className="font-semibold">No devices found</p>
                                                <p className="text-[13px] text-slate-400">Try adjusting your search query or filter settings.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDevices.map(device => {
                                        const ext = getExtendedFields(device);
                                        const isSelected = selectedDevice?.id === device.id;
                                        
                                        return (
                                            <tr 
                                                key={device.id} 
                                                onClick={() => setSelectedDevice(device)}
                                                className={`cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'} ${isSelected ? (theme === 'dark' ? 'bg-white/5' : 'bg-blue-50/20') : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#f9f9fb]')}`}
                                            >
                                                {/* Device ID */}
                                                <td className="px-4 py-3 font-mono text-[12px] text-slate-400 select-all max-w-[110px] truncate whitespace-nowrap">
                                                    {device.id}
                                                </td>
                                                {/* Device Name */}
                                                <td className="px-4 py-3 font-semibold text-[13px] whitespace-nowrap text-slate-800 dark:text-slate-100">
                                                    {device.name}
                                                </td>
                                                {/* Device Type */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                                                    {device.type}
                                                </td>
                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-2 text-[13px] font-medium whitespace-nowrap">
                                                        <PulseDot color={ext.statusColor} />
                                                        {ext.statusLabel}
                                                    </span>
                                                </td>
                                                {/* Certificate Status */}
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap" style={{ color: ext.certColor }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ext.certColor }} />
                                                        {ext.certLabel}
                                                    </span>
                                                </td>
                                                {/* Firmware */}
                                                <td className="px-4 py-3 text-[13px] font-medium whitespace-nowrap">
                                                    <span className="font-mono text-slate-500 mr-1.5">{device.firmwareVersion}</span>
                                                    <span className={`text-[11px] font-sans font-semibold ${ext.fwColor}`}>{ext.fwIndicator}</span>
                                                </td>
                                                {/* Last Heartbeat */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ext.heartbeatColor }} />
                                                        <span>{ext.heartbeatValue}</span>
                                                    </div>
                                                </td>
                                                {/* Last Seen */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                                                    {ext.lastSeen}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button 
                                                            onClick={() => setSelectedDevice(device)} 
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#3b82f6] transition-colors cursor-pointer" 
                                                            title="View details"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditClick(device)} 
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#3b82f6] transition-colors cursor-pointer" 
                                                            title="Edit device"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRestart(device.id)} 
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#eab308] transition-colors cursor-pointer" 
                                                            title="Restart device"
                                                        >
                                                            <RotateCw size={14} className={restartingId === device.id ? 'animate-spin' : ''} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleQuarantineToggle(device.id)} 
                                                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer ${device.mtlsStatus === 'failed' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} 
                                                            title={device.mtlsStatus === 'failed' ? 'Remove quarantine' : 'Quarantine device'}
                                                        >
                                                            <ShieldX size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sliding Details Panel Overlay */}
                <AnimatePresence>
                    {selectedDevice && (
                        <>
                            {/* Backdrop overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black z-40 backdrop-blur-xs"
                                onClick={() => setSelectedDevice(null)}
                            />

                            {/* sliding panel content */}
                            {(() => {
                                const ext = getExtendedFields(selectedDevice);
                                return (
                                    <motion.div
                                        initial={{ x: '100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] shadow-2xl flex flex-col h-full border-l border-black/[0.08] dark:border-white/10 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                                    >
                                        {/* Header */}
                                        <div className="px-6 py-5 border-b flex items-center justify-between border-black/[0.04] dark:border-white/10">
                                            <div>
                                                <h3 className="text-[18px] font-bold">{selectedDevice.name}</h3>
                                                <span className="text-[12px] font-mono text-slate-400">{selectedDevice.id}</span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedDevice(null)} 
                                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Scrollable details */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                            
                                            {/* Basic Information */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Server size={13} />
                                                    Basic Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Device Name</span>
                                                        <span className="font-semibold">{selectedDevice.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Device ID</span>
                                                        <span className="font-mono font-semibold truncate block">{selectedDevice.id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Device Type</span>
                                                        <span className="font-semibold">{selectedDevice.type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Manufacturer</span>
                                                        <span className="font-semibold">{ext.manufacturer}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Model</span>
                                                        <span className="font-semibold">{ext.model}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">MAC Address</span>
                                                        <span className="font-mono font-semibold">{ext.macAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">IP Address</span>
                                                        <span className="font-mono font-semibold">{selectedDevice.ip}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Registration Date</span>
                                                        <span className="font-semibold">{ext.registrationDate}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Information */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Shield size={13} />
                                                    Security Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div>
                                                        <span className="text-slate-400 block mb-1">Trust Score</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                                                <div className="h-full rounded-full" style={{ width: `${ext.trustScore}%`, backgroundColor: ext.trustColor }} />
                                                            </div>
                                                            <span className="font-bold" style={{ color: ext.trustColor }}>{ext.trustScore}%</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Risk Level</span>
                                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${ext.riskBg}`}>
                                                            {ext.riskLabel === 'High' ? '🔴' : ext.riskLabel === 'Medium' ? '🟡' : '🟢'} {ext.riskLabel}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Certificate Status</span>
                                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${ext.certBg}`}>
                                                            {ext.certLabel === 'Valid' ? '🟢' : ext.certLabel === 'Expiring Soon' ? '🟡' : ext.certLabel === 'Expired' ? '🔴' : '⚫'} {ext.certLabel}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Certificate Expiry Date</span>
                                                        <span className="font-semibold">{selectedDevice.certExpiry}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Firmware Version</span>
                                                        <span className="font-mono font-semibold">{selectedDevice.firmwareVersion}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Authentication Method (mTLS)</span>
                                                        <span className="font-semibold text-[#3b82f6]">mTLS (X.509)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Network Information */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Activity size={13} />
                                                    Network Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">MQTT Topic</span>
                                                        <span className="font-mono text-[12px] bg-slate-50 dark:bg-white/5 px-2 py-1 rounded block truncate">{ext.mqttTopic}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Connection Status</span>
                                                        <span className="font-semibold">{selectedDevice.status === 'connected' ? 'Established' : 'Idle'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Last Heartbeat</span>
                                                        <span className="font-semibold">{ext.heartbeatValue}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Last Seen</span>
                                                        <span className="font-semibold">{ext.lastSeen}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Calendar size={13} />
                                                    Timeline
                                                </h4>
                                                <div className="relative pl-6 border-l border-slate-200 dark:border-white/10 space-y-5 text-[13px] ml-2 mt-2">
                                                    {ext.timeline.map((item, idx) => (
                                                        <div key={idx} className="relative">
                                                            <span className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-[#3b82f6] border-2 border-white dark:border-[#0f172a]" />
                                                            <div className="font-semibold">{item.event}</div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5">{item.date}</div>
                                                            <div className="text-[12px] text-slate-500 mt-0.5">{item.desc}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Actions Footer */}
                                        <div className="p-6 border-t border-black/[0.04] dark:border-white/10 bg-slate-50 dark:bg-white/[0.01] flex flex-col gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleRestart(selectedDevice.id)}
                                                    className="flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <RotateCw size={14} className={restartingId === selectedDevice.id ? 'animate-spin' : ''} />
                                                    Restart Device
                                                </button>
                                                <button 
                                                    onClick={() => handleRotate(selectedDevice.id)}
                                                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <RotateCw size={14} className={rotatingId === selectedDevice.id ? 'animate-spin' : ''} />
                                                    Renew Certificate
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleQuarantineToggle(selectedDevice.id)}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <ShieldX size={14} />
                                                    {selectedDevice.mtlsStatus === 'failed' ? 'Unquarantine Node' : 'Quarantine Device'}
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to remove this device permanently?')) {
                                                            alert('Device removal requested.');
                                                            setSelectedDevice(null);
                                                        }
                                                    }}
                                                    className="flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                    Remove Device
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </>
                    )}
                </AnimatePresence>

                {/* Provisioning Modal */}
                <AnimatePresence>
                    {showProvisionModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
                                onClick={() => setShowProvisionModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] z-[51] rounded-[24px] border border-black/[0.08] dark:border-white/10 shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                            >
                                <div className="px-6 py-5 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
                                    <h3 className="text-[18px] font-bold tracking-tight">Provision Device</h3>
                                    <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleProvision} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-slate-400 ml-1">Device Name</label>
                                        <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Smart Sensor Hub" className={`w-full px-4 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-slate-400 ml-1">Type</label>
                                            <select value={newType} onChange={e => setNewType(e.target.value as any)} className={`w-full px-3 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-[#0f172a] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                                <option value="Sensor">Sensor</option>
                                                <option value="Gateway">Gateway</option>
                                                <option value="Actuator">Actuator</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-slate-400 ml-1">IP Address</label>
                                            <input required value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.10" className={`w-full px-4 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-slate-400 ml-1">Location</label>
                                        <input required value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="e.g. Server Room A" className={`w-full px-4 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                                    </div>
                                    <div className="pt-4 flex flex-col gap-3">
                                        <div className={`flex items-start gap-2 text-[12px] p-3 rounded-[12px] ${theme === 'dark' ? 'bg-[#3b82f6]/10 text-white/70' : 'bg-blue-50/50 text-[#86868b]'}`}>
                                            <ShieldCheck size={14} className="text-[#3b82f6] mt-0.5 flex-shrink-0" />
                                            <span>Provisioning will automatically generate an mTLS 1.3 certificate and sign it with the platform root CA.</span>
                                        </div>
                                        <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3.5 rounded-[12px] transition-all shadow-md active:scale-[0.98] cursor-pointer">
                                            Generate & Register
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Edit Name Modal */}
                <AnimatePresence>
                    {showEditModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
                                onClick={() => setShowEditModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] z-[51] rounded-[24px] border border-black/[0.08] dark:border-white/10 shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                            >
                                <div className="px-6 py-5 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
                                    <h3 className="text-[18px] font-bold tracking-tight">Edit Device</h3>
                                    <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-slate-400 ml-1">Device Name</label>
                                        <input required value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Smart Sensor Hub" className={`w-full px-4 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                                    </div>
                                    <div className="pt-4 flex flex-col gap-3">
                                        <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3.5 rounded-[12px] transition-all shadow-md active:scale-[0.98] cursor-pointer">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
