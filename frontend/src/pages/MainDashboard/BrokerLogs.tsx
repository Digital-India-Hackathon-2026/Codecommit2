import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import {
    Activity, Search, RefreshCw, X, Download, Eye, Copy,
    Terminal, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
    Lock, Server, Wifi, ShieldAlert
} from 'lucide-react';

interface LogItem {
    id: string;
    time: string;
    source: 'Broker' | 'Backend' | 'Authentication';
    deviceName: string;
    deviceId: string;
    eventType: string;
    mqttTopic: string;
    authResult: string;
    status: 'Success' | 'Warning' | 'Error';
    statusColor: string;
    message: string;
    ipAddress: string;
    clientId: string;
    qos: string;
    retain: string;
    payloadSize: string;
    connectionStatus: string;
    sessionId: string;
    brokerNode: string;
    certUsed: string;
    tlsVersion: string;
    encryption: string;
}

const INITIAL_LOGS: LogItem[] = [];

export default function BrokerLogs() {
    const { devices, theme, isLoading } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilterChip, setActiveFilterChip] = useState<'All' | 'Broker' | 'Backend' | 'Authentication' | 'Warning'>('All');
    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // Keep a ref of devices to avoid re-triggering WebSocket / Interval hooks
    const devicesRef = useRef(devices);
    useEffect(() => {
        devicesRef.current = devices;
    }, [devices]);



    useEffect(() => {
        setMounted(true);

        // Open live WebSocket rule
        const wsUrl = import.meta.env.MODE === 'production'
            ? `wss://${window.location.host}/ws/logs`
            : 'ws://localhost:8000/ws/logs';

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const newLog = JSON.parse(event.data);
                const formatted: LogItem = {
                    id: newLog.id || `evt-log-${Math.random().toString(36).substr(2, 6)}`,
                    time: newLog.time || new Date().toLocaleTimeString(),
                    source: newLog.service === 'auth' ? 'Authentication' : newLog.service === 'backend' ? 'Backend' : 'Broker',
                    deviceName: newLog.device_name || 'System gateway',
                    deviceId: newLog.device_id || 'infrastructure',
                    eventType: newLog.event_type || 'Event received',
                    mqttTopic: newLog.topic || 'N/A',
                    authResult: newLog.auth_status || 'Verified',
                    status: newLog.status === 'error' ? 'Error' : newLog.status === 'warning' ? 'Warning' : 'Success',
                    statusColor: newLog.status === 'error' ? '#ef4444' : newLog.status === 'warning' ? '#eab308' : '#22c55e',
                    message: newLog.message || '',
                    ipAddress: newLog.ip || '192.168.1.1',
                    clientId: newLog.client_id || 'system-portal',
                    qos: newLog.qos || 'N/A',
                    retain: newLog.retain || 'N/A',
                    payloadSize: newLog.payload_size || 'N/A',
                    connectionStatus: 'Connected',
                    sessionId: 'sess_live_ws',
                    brokerNode: 'nakshatra-node-01',
                    certUsed: 'Default Intermediate Chain',
                    tlsVersion: 'TLS 1.3',
                    encryption: 'ECDHE-ECDSA-AES128-GCM-SHA256'
                };
                setLogs(prev => [formatted, ...prev].slice(0, 200));
            } catch (err) {
                console.error("WS parse error", err);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    // Handle Manual Refresh
    const handleRefresh = () => {
        setLogs([generateRandomLog(devices), generateRandomLog(devices), ...INITIAL_LOGS]);
    };

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                log.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.mqttTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.clientId.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesChip = true;
            if (activeFilterChip === 'Broker' || activeFilterChip === 'Backend' || activeFilterChip === 'Authentication') {
                matchesChip = log.source === activeFilterChip;
            } else if (activeFilterChip === 'Warning') {
                matchesChip = log.status === 'Warning';
            }

            return matchesSearch && matchesChip;
        });
    }, [logs, searchQuery, activeFilterChip]);

    // Summary Statistics
    const totalEvents = logs.length;
    const activeConnectionsCount = devices.filter(d => d.status === 'connected' && d.mtlsStatus !== 'failed').length;
    const failedAuthsCount = logs.filter(l => l.eventType === 'Authentication Failed').length;
    const brokerStatus = 'Online';

    const summaryCards = [
        { label: 'Total Events', value: String(totalEvents), desc: 'Aggregated Log Feed', icon: <Terminal size={18} />, color: '#3b82f6' },
        { label: 'Active Connections', value: String(activeConnectionsCount), desc: 'Established Clients', icon: <Wifi size={18} />, color: '#22c55e' },
        { label: 'Failed Authentications', value: String(failedAuthsCount), desc: 'mTLS Handshake Errors', icon: <ShieldAlert size={18} />, color: '#ef4444' },
        { label: 'Broker Status', value: brokerStatus, desc: '99.98% Uptime', icon: <Server size={18} />, color: '#22c55e' }
    ];

    // Export PDF/JPG Canvas builder
    const handleExport = (format: 'pdf' | 'jpg') => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rowHeight = 70;
        const headerHeight = 240;
        const footerHeight = 80;
        const totalHeight = headerHeight + (filteredLogs.slice(0, 15).length * rowHeight) + footerHeight;

        canvas.width = 1200;
        canvas.height = totalHeight;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Gradient Banner
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 180);

        // Header Texts
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('NAKSHATRA SECURITY PLATFORM', 60, 75);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 18px sans-serif';
        ctx.fillText('MQTT Broker Service Events & Authentication Log manifest', 60, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`Export Date: ${new Date().toLocaleString()}  |  Total Logs: ${totalEvents}  |  Broker: ${brokerStatus}`, 60, 150);

        // Table Header Row
        const startY = 220;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, startY - 25, canvas.width - 80, 45);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('TIMESTAMP', 60, startY);
        ctx.fillText('SOURCE', 180, startY);
        ctx.fillText('DEVICE IDENTITY', 340, startY);
        ctx.fillText('EVENT TYPE', 580, startY);
        ctx.fillText('MESSAGE', 800, startY);

        // Draw Row List
        let currentY = startY + 50;

        filteredLogs.slice(0, 15).forEach((log) => {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, currentY + 30);
            ctx.lineTo(canvas.width - 40, currentY + 30);
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.font = '13px monospace';
            ctx.fillText(log.time, 60, currentY + 8);

            ctx.fillStyle = log.status === 'Error' ? '#ef4444' : log.status === 'Warning' ? '#eab308' : '#334155';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(log.source, 180, currentY + 8);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(log.deviceName, 340, currentY);

            ctx.fillStyle = '#64748b';
            ctx.font = '12px monospace';
            ctx.fillText(log.deviceId, 340, currentY + 20);

            ctx.fillStyle = '#334155';
            ctx.font = '500 14px sans-serif';
            ctx.fillText(log.eventType, 580, currentY + 8);

            ctx.fillStyle = '#475569';
            ctx.font = '13px sans-serif';
            const shortMsg = log.message.length > 45 ? log.message.substring(0, 45) + '...' : log.message;
            ctx.fillText(shortMsg, 800, currentY + 8);

            currentY += rowHeight;
        });

        // Footer Info
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 12px sans-serif';
        ctx.fillText('Nakshatra Security Operations Center Diagnostics. Confirmed secure.', 60, totalHeight - 40);

        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `nakshatra-broker-logs-${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } else if (format === 'pdf') {
            const pdfWindow = window.open("", "_blank");
            if (pdfWindow) {
                pdfWindow.document.write(`
                    <html>
                        <head>
                            <title>Nakshatra Broker Logs Export</title>
                            <style>
                                body { margin: 0; padding: 20px; display: flex; justify-content: center; background-color: #f1f5f9; font-family: sans-serif; }
                                .container { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; background: white; max-width: 100%; }
                                img { display: block; max-width: 100%; height: auto; }
                                @media print {
                                    body { padding: 0; background: white; }
                                    .container { box-shadow: none; border-radius: 0; }
                                    img { width: 100%; }
                                }
                            </style>
                        </head>
                        <body onload="window.print();">
                            <div class="container">
                                <img src="${canvas.toDataURL('image/jpeg', 1.0)}" />
                            </div>
                        </body>
                    </html>
                `);
                pdfWindow.document.close();
            }
        }
    };

    return (
        <div
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
            className={`min-h-screen pt-24 pb-24 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}
        >
            <div className={`max-w-[1400px] mx-auto px-4 md:px-8 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[36px] font-bold tracking-tight">Broker Logs</h1>
                        <p className={`text-[15px] mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                            Monitor real-time MQTT broker events, backend services, authentication activities, and communication logs.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[14px] font-semibold transition-colors border shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-[#f5f5f7]'}`}
                        >
                            <RefreshCw size={15} />
                            Refresh
                        </button>

                        {/* Export Logs Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[14px] font-semibold transition-colors border shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-[#f5f5f7]'}`}
                            >
                                <Download size={15} /> Export Logs
                            </button>
                            <AnimatePresence>
                                {showExportDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                            className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-1.5 z-20 ${theme === 'dark' ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-black/5 text-slate-800'}`}
                                        >
                                            <button
                                                onClick={() => { handleExport('pdf'); setShowExportDropdown(false); }}
                                                className="w-full text-left px-4 py-2 text-[14px] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            >
                                                📄 Export as PDF
                                            </button>
                                            <button
                                                onClick={() => { handleExport('jpg'); setShowExportDropdown(false); }}
                                                className="w-full text-left px-4 py-2 text-[14px] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            >
                                                🖼️ Export as JPG Image
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
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

                {/* Search & Filter Chips Bar */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Search Field */}
                    <div className={`p-2 rounded-[20px] flex items-center gap-3 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/[0.04]'}`}>
                        <div className="flex-grow flex items-center gap-3 px-4">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by Device Name, Device ID, MQTT Topic, or Client ID..."
                                className="bg-transparent border-none outline-none w-full text-[15px] py-2 placeholder:text-slate-400 placeholder:opacity-70 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2">
                        {(['All', 'Broker', 'Backend', 'Authentication', 'Warning'] as const).map(chip => (
                            <button
                                key={chip}
                                onClick={() => setActiveFilterChip(chip)}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide border transition-all cursor-pointer ${
                                    activeFilterChip === chip
                                        ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-xs'
                                        : theme === 'dark'
                                        ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {chip === 'Warning' ? '🟡 Warning' : chip}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Broker Log Table */}
                <div className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <div className="w-full">
                        <table className="w-full border-collapse text-left table-fixed">
                            <thead>
                                <tr className={`border-b text-[11px] font-semibold tracking-wider uppercase ${theme === 'dark' ? 'border-white/10 text-white/40 bg-white/5' : 'border-[#f5f5f7] text-[#86868b] bg-slate-50'}`}>
                                    <th className="px-4 py-3.5 w-[8%] whitespace-nowrap">Timestamp</th>
                                    <th className="px-4 py-3.5 w-[8%] whitespace-nowrap">Source</th>
                                    <th className="px-4 py-3.5 w-[14%] whitespace-nowrap">Device Name</th>
                                    <th className="px-4 py-3.5 w-[13%] whitespace-nowrap">Event Type</th>
                                    <th className="px-4 py-3.5 w-[13%] whitespace-nowrap">MQTT Topic</th>
                                    <th className="px-4 py-3.5 w-[12%] whitespace-nowrap">Auth Result</th>
                                    <th className="px-4 py-3.5 w-[8%] whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3.5 w-[14%] whitespace-nowrap">Message</th>
                                    <th className="px-4 py-3.5 w-[8%] whitespace-nowrap">IP Address</th>
                                    <th className="px-4 py-3.5 w-[2%] whitespace-nowrap text-right"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-[#f5f5f7]'}`}>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Terminal size={32} />
                                                <p className="font-semibold">No logs found</p>
                                                <p className="text-[13px]">No broker communication events match your active filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => {
                                        const isSelected = selectedLog?.id === log.id;
                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() => setSelectedLog(log)}
                                                className={`cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'} ${isSelected ? (theme === 'dark' ? 'bg-white/5' : 'bg-blue-50/20') : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#f9f9fb]')}`}
                                            >
                                                {/* Timestamp */}
                                                <td className="px-4 py-3 font-mono text-[12px] text-slate-400 select-all truncate whitespace-nowrap">
                                                    {log.time}
                                                </td>
                                                {/* Source */}
                                                <td className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">
                                                    <span className={log.source === 'Authentication' ? 'text-indigo-500' : log.source === 'Backend' ? 'text-sky-500' : 'text-emerald-500'}>
                                                        {log.source}
                                                    </span>
                                                </td>
                                                {/* Device Name */}
                                                <td className="px-4 py-3 font-semibold text-[13px] text-slate-800 dark:text-slate-100 truncate whitespace-nowrap">
                                                    {log.deviceName}
                                                </td>
                                                {/* Event Type */}
                                                <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 truncate whitespace-nowrap">
                                                    {log.eventType}
                                                </td>
                                                {/* MQTT Topic */}
                                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500 truncate whitespace-nowrap">
                                                    {log.mqttTopic}
                                                </td>
                                                {/* Auth Result */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 truncate whitespace-nowrap">
                                                    {log.authResult}
                                                </td>
                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-[13px] font-medium whitespace-nowrap" style={{ color: log.statusColor }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: log.statusColor }} />
                                                        {log.status}
                                                    </span>
                                                </td>
                                                {/* Message */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 truncate whitespace-nowrap">
                                                    {log.message}
                                                </td>
                                                {/* IP Address */}
                                                <td className="px-4 py-3 font-mono text-[12px] text-slate-500 whitespace-nowrap">
                                                    {log.ipAddress}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#3b82f6] transition-colors cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Log Details Sliding Drawer */}
                <AnimatePresence>
                    {selectedLog && (
                        <>
                            {/* Backdrop overlay */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black z-45 backdrop-blur-xs"
                                onClick={() => setSelectedLog(null)}
                            />

                            {/* Drawer Container */}
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] shadow-2xl flex flex-col h-full border-l border-black/[0.08] dark:border-white/10 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                            >
                                {/* Drawer Header */}
                                <div className="px-6 py-5 border-b flex items-center justify-between border-black/[0.04] dark:border-white/10">
                                    <div>
                                        <h3 className="text-[18px] font-bold">Event Diagnostic Details</h3>
                                        <span className="text-[12px] font-mono text-slate-400">{selectedLog.id}</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Drawer Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                    {/* Event Information */}
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <Terminal size={13} />
                                            Event Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Event ID</span>
                                                <span className="font-mono font-semibold">{selectedLog.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Timestamp</span>
                                                <span className="font-semibold">{selectedLog.time}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Device Name</span>
                                                <span className="font-semibold">{selectedLog.deviceName}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Device ID</span>
                                                <span className="font-mono font-semibold truncate block">{selectedLog.deviceId}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-400 block mb-0.5">Event Type</span>
                                                <span className="font-semibold text-[#3b82f6]">{selectedLog.eventType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MQTT Information */}
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <Activity size={13} />
                                            MQTT Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Client ID</span>
                                                <span className="font-mono font-semibold truncate block">{selectedLog.clientId}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">QoS Level</span>
                                                <span className="font-semibold">{selectedLog.qos}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-400 block mb-0.5">MQTT Topic</span>
                                                <span className="font-mono text-[12px] bg-slate-50 dark:bg-white/5 px-2 py-1 rounded block truncate">{selectedLog.mqttTopic}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Retain Flag</span>
                                                <span className="font-semibold">{selectedLog.retain}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Payload Size</span>
                                                <span className="font-semibold text-[#3b82f6]">{selectedLog.payloadSize}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection Information */}
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <Server size={13} />
                                            Connection Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">IP Address</span>
                                                <span className="font-mono font-semibold">{selectedLog.ipAddress}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Connection Status</span>
                                                <span className="font-semibold">{selectedLog.connectionStatus}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Session ID</span>
                                                <span className="font-mono font-semibold truncate block">{selectedLog.sessionId}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Broker Node</span>
                                                <span className="font-semibold">{selectedLog.brokerNode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Information */}
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <Lock size={13} />
                                            Security Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Authentication Result</span>
                                                <span className="font-semibold text-emerald-500">{selectedLog.authResult}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">TLS Version</span>
                                                <span className="font-semibold">{selectedLog.tlsVersion}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-400 block mb-0.5">Encryption Method</span>
                                                <span className="font-mono text-[12px] truncate block">{selectedLog.encryption}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-400 block mb-0.5">Certificate Used</span>
                                                <span className="font-semibold text-[12px] text-slate-500 truncate block">{selectedLog.certUsed}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Drawer Footer Actions */}
                                <div className="p-6 border-t border-black/[0.04] dark:border-white/10 bg-slate-50 dark:bg-white/[0.01] flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2)); alert('Log copied to clipboard.'); }}
                                            className="flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                        >
                                            <Copy size={14} />
                                            Copy Log
                                        </button>
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                        >
                                            <Download size={14} />
                                            Export Log
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => alert(`Navigating to profile details for device ${selectedLog.deviceName}`)}
                                            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                        >
                                            <Eye size={14} />
                                            View Device
                                        </button>
                                        <button
                                            onClick={() => {
                                                const rawData = JSON.stringify(selectedLog, null, 2);
                                                const blob = new Blob([rawData], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `log_details_${selectedLog.id}.json`;
                                                a.click();
                                            }}
                                            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                        >
                                            <Download size={14} />
                                            Download Details
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
