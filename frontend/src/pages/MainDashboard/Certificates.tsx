import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import type { Device } from '../../context/PlatformContext';
import {
    ShieldCheck, ShieldAlert, Shield, RefreshCw,
    FileText, Search, Download, Trash2, Plus, X, Filter,
    Eye, RotateCw, Copy, Check, Info, Calendar
} from 'lucide-react';

interface CertificateItem {
    id: string;
    deviceId: string;
    deviceName: string;
    type: 'Device Certificate' | 'Broker Certificate' | 'Root CA' | 'Server Certificate';
    status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Revoked';
    statusColor: string;
    issuedDate: string;
    expiryDate: string;
    fingerprint: string;
    serialNumber: string;
    trustLevel: string;
}

export default function Certificates() {
    const { devices, theme, rotateCertificate, revokeDevice, provisionDevice, isLoading } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Valid' | 'Expiring Soon' | 'Expired' | 'Revoked'>('All');
    const [sortBy, setSortBy] = useState<'expiry' | 'issued' | 'name'>('expiry');
    const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // PEM Modal State
    const [showPemModal, setShowPemModal] = useState<CertificateItem | null>(null);

    // Issue Certificate Modal State
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newCertType, setNewCertType] = useState<'Device Certificate' | 'Broker Certificate' | 'Server Certificate'>('Device Certificate');

    // Copied feedback state
    const [copiedFingerprint, setCopiedFingerprint] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Helper: Days remaining calculation
    const getDaysRemaining = (expiryStr: string, status: string) => {
        if (status === 'Revoked' || status === 'Expired') return 0;
        try {
            let expDate = new Date(expiryStr);
            if (isNaN(expDate.getTime())) {
                expDate = new Date(Date.parse(expiryStr));
            }
            if (isNaN(expDate.getTime())) {
                return 245;
            }
            const diffTime = expDate.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays < 0 ? 0 : diffDays;
        } catch {
            return 245;
        }
    };

    // Construct Certificates Inventory
    const certsFromDevices = devices.map((d: Device): CertificateItem => {
        const isQuarantined = d.mtlsStatus === 'failed';
        const isObservation = d.mtlsStatus === 'expiring_soon';

        let status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Revoked' = 'Valid';
        let statusColor = '#22c55e';
        if (isQuarantined) {
            status = 'Revoked';
            statusColor = '#64748b';
        } else if (isObservation) {
            status = 'Expiring Soon';
            statusColor = '#eab308';
        } else if (d.status === 'disconnected') {
            status = 'Expired';
            statusColor = '#ef4444';
        }

        const idHash = d.id.substring(4);

        return {
            id: `cert-${idHash}`,
            deviceId: d.id,
            deviceName: d.name,
            type: 'Device Certificate',
            status,
            statusColor,
            issuedDate: '2026-03-12',
            expiryDate: d.certExpiry === 'Unknown' ? '2027-03-12' : d.certExpiry,
            fingerprint: d.certFingerprint,
            serialNumber: `0A:F5:${idHash.toUpperCase()}:10:E4:56`,
            trustLevel: 'Validated Leaf Certificate'
        };
    });

    const allCerts = [...certsFromDevices];

    // Search, Filter, and Sort Calculations
    const filteredCerts = allCerts.filter(c => {
        const matchesSearch = c.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = statusFilter === 'All' || c.status === statusFilter;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        if (sortBy === 'name') {
            return a.deviceName.localeCompare(b.deviceName);
        } else if (sortBy === 'issued') {
            return new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime();
        } else {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
    });

    // Summary Card Stats
    const totalCount = allCerts.length;
    const validCount = allCerts.filter(c => c.status === 'Valid').length;
    const expiringCount = allCerts.filter(c => c.status === 'Expiring Soon').length;
    const revokedCount = allCerts.filter(c => c.status === 'Revoked').length;

    const summaryCards = [
        { label: 'Total Certificates', value: String(totalCount), desc: 'Active Lifecycles', icon: <FileText size={18} />, color: '#3b82f6' },
        { label: 'Valid Certificates', value: String(validCount), desc: 'Secure & Verified', icon: <ShieldCheck size={18} />, color: '#22c55e' },
        { label: 'Expiring Soon', value: String(expiringCount), desc: 'Action Required', icon: <ShieldAlert size={18} />, color: '#eab308' },
        { label: 'Revoked Certificates', value: String(revokedCount), desc: 'Quarantined Identities', icon: <Shield size={18} />, color: '#64748b' }
    ];

    const handleCopyFingerprint = (fingerprint: string) => {
        navigator.clipboard.writeText(fingerprint);
        setCopiedFingerprint(true);
        setTimeout(() => setCopiedFingerprint(false), 2000);
    };

    const handleIssueCertificate = (e: React.FormEvent) => {
        e.preventDefault();
        provisionDevice({
            name: newDeviceName,
            type: newCertType === 'Device Certificate' ? 'Sensor' : 'Gateway',
            ip: '192.168.1.99',
            location: 'Provisioned Certificate'
        });
        setNewDeviceName('');
        setShowIssueModal(false);
    };

    const handleExport = (format: 'pdf' | 'jpg') => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rowHeight = 70;
        const headerHeight = 240;
        const footerHeight = 80;
        const totalHeight = headerHeight + (filteredCerts.length * rowHeight) + footerHeight;

        canvas.width = 1200;
        canvas.height = totalHeight;

        // 1. Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Header Gradient Banner
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 180);

        // 3. Header Texts
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('NAKSHATRA SECURITY PLATFORM', 60, 75);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 18px sans-serif';
        ctx.fillText('mTLS Certificate Lifecycle Inventory', 60, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`Export Date: ${new Date().toLocaleString()}  |  Active: ${validCount}  |  Critical: ${expiringCount}  |  Revoked: ${revokedCount}`, 60, 150);

        // 4. Table Header Row
        const startY = 220;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, startY - 25, canvas.width - 80, 45);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('CERTIFICATE ID', 60, startY);
        ctx.fillText('DEVICE NAME', 300, startY);
        ctx.fillText('TYPE', 580, startY);
        ctx.fillText('STATUS', 800, startY);
        ctx.fillText('EXPIRY DATE', 980, startY);

        // 5. Draw Row List
        let currentY = startY + 50;

        filteredCerts.forEach((cert) => {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, currentY + 30);
            ctx.lineTo(canvas.width - 40, currentY + 30);
            ctx.stroke();

            // ID
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText(cert.id, 60, currentY);

            // Name
            ctx.fillStyle = '#334155';
            ctx.font = '500 15px sans-serif';
            ctx.fillText(cert.deviceName, 300, currentY);

            // Type
            ctx.fillStyle = '#64748b';
            ctx.font = '14px sans-serif';
            ctx.fillText(cert.type, 580, currentY);

            // Status label
            const isExpired = cert.status === 'Expired';
            const isWarning = cert.status === 'Expiring Soon';
            const isRevoked = cert.status === 'Revoked';
            const statusColor = isRevoked ? '#64748b' : isExpired ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

            ctx.fillStyle = statusColor;
            ctx.beginPath();
            ctx.arc(810, currentY + 5, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillText(cert.status, 830, currentY + 10);

            // Expiry
            ctx.fillStyle = '#0f172a';
            ctx.font = '500 14px sans-serif';
            ctx.fillText(cert.expiryDate, 980, currentY + 8);

            currentY += rowHeight;
        });

        // 6. Footer Info
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 12px sans-serif';
        ctx.fillText('Nakshatra Edge Security Core. Confirmed digitally secure.', 60, totalHeight - 40);

        // 7. Output
        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `nakshatra-certificates-${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } else if (format === 'pdf') {
            const pdfWindow = window.open("", "_blank");
            if (pdfWindow) {
                pdfWindow.document.write(`
                    <html>
                        <head>
                            <title>Nakshatra Certificates Export</title>
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

    if (isLoading) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="animate-spin text-[#3b82f6]" />
                    <p className={`text-[15px] tracking-[-0.01em] ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>Loading Certificates...</p>
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
                        <h1 className="text-[36px] font-bold tracking-tight">Certificates</h1>
                        <p className={`text-[15px] mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                            Manage, monitor, renew, and revoke digital certificates used to authenticate IoT devices securely.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search"
                                className={`pl-10 pr-4 py-2.5 rounded-[12px] text-[14px] border outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all w-[220px] ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                            />
                        </div>

                        {/* Filter Status select */}
                        <div className="relative flex items-center">
                            <Filter size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className={`pl-10 pr-8 py-2.5 rounded-[12px] text-[14px] border outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all appearance-none cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                            >
                                <option value="All">All Certificates</option>
                                <option value="Valid">🟢 Valid</option>
                                <option value="Expiring Soon">🟡 Expiring Soon</option>
                                <option value="Expired">🔴 Expired</option>
                                <option value="Revoked">⚫ Revoked</option>
                            </select>
                        </div>

                        {/* Sorting Select */}
                        <div className="relative flex items-center">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className={`pl-4 pr-8 py-2.5 rounded-[12px] text-[14px] border outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all appearance-none cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                            >
                                <option value="expiry">Sort: Expiry Date</option>
                                <option value="issued">Sort: Issued Date</option>
                                <option value="name">Sort: Device Name</option>
                            </select>
                        </div>

                        {/* Export Menu Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[14px] font-semibold transition-colors border shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-[#f5f5f7]'}`}
                            >
                                <Download size={15} /> Export
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

                {/* Certificate Inventory Table */}
                <div className={`rounded-[20px] border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <div className="w-full">
                        <table className="w-full border-collapse text-left table-fixed">
                            <thead>
                                <tr className={`border-b text-[11px] font-semibold tracking-wider uppercase ${theme === 'dark' ? 'border-white/10 text-white/40 bg-white/5' : 'border-[#f5f5f7] text-[#86868b] bg-slate-50'}`}>
                                    <th className="px-4 py-3.5 w-[11%] whitespace-nowrap">Certificate ID</th>
                                    <th className="px-4 py-3.5 w-[18%] whitespace-nowrap">Device Name</th>
                                    <th className="px-4 py-3.5 w-[17%] whitespace-nowrap">Certificate Type</th>
                                    <th className="px-4 py-3.5 w-[11%] whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3.5 w-[10%] whitespace-nowrap">Issued Date</th>
                                    <th className="px-4 py-3.5 w-[10%] whitespace-nowrap">Expiry Date</th>
                                    <th className="px-4 py-3.5 w-[11%] whitespace-nowrap">Days Left</th>
                                    <th className="px-4 py-3.5 w-[12%] whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-[#f5f5f7]'}`}>
                                {filteredCerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FileText size={32} className="text-slate-400" />
                                                <p className="font-semibold">No certificates found</p>
                                                <p className="text-[13px] text-slate-400">Try adjusting your filters or search keywords.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCerts.map(cert => {
                                        const daysLeft = getDaysRemaining(cert.expiryDate, cert.status);
                                        const isSelected = selectedCert?.id === cert.id;

                                        return (
                                            <tr
                                                key={cert.id}
                                                onClick={() => setSelectedCert(cert)}
                                                className={`cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'} ${isSelected ? (theme === 'dark' ? 'bg-white/5' : 'bg-blue-50/20') : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#f9f9fb]')}`}
                                            >
                                                {/* Certificate ID */}
                                                <td className="px-4 py-3 font-mono text-[12px] text-slate-400 select-all truncate whitespace-nowrap">
                                                    {cert.id}
                                                </td>
                                                {/* Device Name */}
                                                <td className="px-4 py-3 font-semibold text-[13px] text-slate-800 dark:text-slate-100 truncate whitespace-nowrap">
                                                    {cert.deviceName}
                                                </td>
                                                {/* Certificate Type */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 truncate whitespace-nowrap">
                                                    {cert.type}
                                                </td>
                                                {/* Status Badges */}
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap" style={{ color: cert.statusColor }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cert.statusColor }} />
                                                        {cert.status}
                                                    </span>
                                                </td>
                                                {/* Issued Date */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                                                    {cert.issuedDate}
                                                </td>
                                                {/* Expiry Date */}
                                                <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                                                    {cert.expiryDate}
                                                </td>
                                                {/* Days Remaining */}
                                                <td className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">
                                                    <span className={daysLeft < 30 ? 'text-[#ef4444]' : 'text-slate-600 dark:text-slate-300'}>
                                                        {daysLeft} days
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setSelectedCert(cert)}
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#3b82f6] transition-colors cursor-pointer"
                                                            title="View Details"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { rotateCertificate(cert.deviceId); alert(`Renewal signature generated for ${cert.id}`); }}
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-[#eab308] transition-colors cursor-pointer"
                                                            title="Renew Certificate"
                                                        >
                                                            <RotateCw size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { handleExport('jpg'); }}
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                                                            title="Download Certificate"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { revokeDevice(cert.deviceId); alert(`Revocation broadcast sent for ${cert.id}`); }}
                                                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                                            title="Revoke Certificate"
                                                        >
                                                            <Trash2 size={14} />
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

                {/* Certificate Details Sliding Drawer */}
                <AnimatePresence>
                    {selectedCert && (
                        <>
                            {/* Backdrop overlay */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black z-40 backdrop-blur-xs"
                                onClick={() => setSelectedCert(null)}
                            />

                            {/* Drawer Content */}
                            {(() => {
                                const daysLeft = getDaysRemaining(selectedCert.expiryDate, selectedCert.status);
                                return (
                                    <motion.div
                                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[500px] shadow-2xl flex flex-col h-full border-l border-black/[0.08] dark:border-white/10 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                                    >
                                        {/* Header */}
                                        <div className="px-6 py-5 border-b flex items-center justify-between border-black/[0.04] dark:border-white/10">
                                            <div>
                                                <h3 className="text-[18px] font-bold">Certificate Details</h3>
                                                <span className="text-[12px] font-mono text-slate-400">{selectedCert.id}</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCert(null)}
                                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Scrollable Area */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                            {/* Certificate Information */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Info size={13} />
                                                    Certificate Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Certificate ID</span>
                                                        <span className="font-mono font-semibold truncate block">{selectedCert.id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Device Name</span>
                                                        <span className="font-semibold truncate block">{selectedCert.deviceName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Device ID</span>
                                                        <span className="font-mono font-semibold truncate block">{selectedCert.deviceId}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Certificate Type</span>
                                                        <span className="font-semibold">{selectedCert.type}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">Status</span>
                                                        <span className="flex items-center gap-1.5 font-semibold" style={{ color: selectedCert.statusColor }}>
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCert.statusColor }} />
                                                            {selectedCert.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Certificate Cryptographic Details */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <FileText size={13} />
                                                    Certificate Details
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">Issuer</span>
                                                        <span className="font-semibold">CN=Nakshatra Intermediate CA, O=Nakshatra Core, C=IN</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">Subject</span>
                                                        <span className="font-semibold truncate block">CN={selectedCert.deviceName}, OU=IoT Fleet, O=Nakshatra</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Serial Number</span>
                                                        <span className="font-mono font-semibold truncate block">{selectedCert.serialNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Certificate Version</span>
                                                        <span className="font-semibold">X.509 v3</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Public Key Algorithm</span>
                                                        <span className="font-semibold">ECC (NIST P-256)</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Signature Algorithm</span>
                                                        <span className="font-semibold">ECDSA-with-SHA256</span>
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
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">SHA-256 Fingerprint</span>
                                                        <span className="font-mono text-[12px] bg-slate-50 dark:bg-white/5 px-2 py-1 rounded block truncate">{selectedCert.fingerprint}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Key Size</span>
                                                        <span className="font-semibold">256-bit ECC</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Trust Level</span>
                                                        <span className="font-semibold text-emerald-500">{selectedCert.trustLevel}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">Certificate Chain</span>
                                                        <span className="font-semibold text-[12px] text-slate-500">Nakshatra Root CA → Nakshatra Intermediate CA → {selectedCert.deviceName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Validity Information */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <Calendar size={13} />
                                                    Validity Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-[13px] border border-black/[0.03] dark:border-white/[0.03] p-4 rounded-xl">
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Issued Date</span>
                                                        <span className="font-semibold">{selectedCert.issuedDate}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">Expiry Date</span>
                                                        <span className="font-semibold">{selectedCert.expiryDate}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block mb-0.5">Days Remaining</span>
                                                        <span className={`font-bold text-[15px] ${daysLeft < 30 ? 'text-[#ef4444]' : 'text-slate-800 dark:text-slate-100'}`}>
                                                            {daysLeft} Days Remaining
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Actions Footer */}
                                        <div className="p-6 border-t border-black/[0.04] dark:border-white/10 bg-slate-50 dark:bg-white/[0.01] flex flex-col gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => { rotateCertificate(selectedCert.deviceId); alert('Certificate renewal triggered.'); }}
                                                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <RotateCw size={14} />
                                                    Renew Certificate
                                                </button>
                                                <button
                                                    onClick={() => { revokeDevice(selectedCert.deviceId); alert('Certificate revocation triggered.'); }}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                    Revoke Certificate
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleExport('jpg')}
                                                    className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-semibold text-[12px] transition-colors cursor-pointer"
                                                >
                                                    <Download size={13} />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => setShowPemModal(selectedCert)}
                                                    className="flex items-center justify-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 rounded-xl font-semibold text-[12px] transition-colors cursor-pointer"
                                                >
                                                    <FileText size={13} />
                                                    PEM Block
                                                </button>
                                                <button
                                                    onClick={() => handleCopyFingerprint(selectedCert.fingerprint)}
                                                    className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-semibold text-[12px] transition-colors cursor-pointer"
                                                >
                                                    {copiedFingerprint ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                                    {copiedFingerprint ? 'Copied' : 'Copy SHA'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </>
                    )}
                </AnimatePresence>

                {/* PEM block Modal */}
                <AnimatePresence>
                    {showPemModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100]"
                                onClick={() => setShowPemModal(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] z-[101] rounded-[24px] border border-black/[0.08] dark:border-white/10 shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                            >
                                <div className="px-6 py-5 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[17px] font-bold tracking-tight">X.509 Certificate PEM Block</h3>
                                        <span className="text-[11px] text-slate-400 font-mono">{showPemModal.id}</span>
                                    </div>
                                    <button onClick={() => setShowPemModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl overflow-x-auto select-all leading-normal">
                                        <div>-----BEGIN CERTIFICATE-----</div>
                                        <div>MIIB7TCCAVegAwIBAgIQCg/1icLQ5FZWw6G1MHRaVjAKBggqhkjOPQQDAjAzMTEw</div>
                                        <div>LwYDVQQDDChOYWtzaGF0cmEgSW50ZXJtZWRpYXRlIENBLCBPPU5ha3NoYXRyYTAe</div>
                                        <div>Fw0yNjAzMTIxMDI0MDBaFw0yNzAzMTIxMDI0MDBaMB8xHTAbBgNVBAMMFGJ1aWxk</div>
                                        <div>aW5nLWEtaHZhYy1zZW5zb3IwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARhD7ZJ</div>
                                        <div>jU+aQf+UvP1RkYjJk3A6mK7T8qQc6Y7B5K3JvH2M8G3X3P1N9z7m5Z7h8G7K8x9X</div>
                                        <div>q7X8z8C7M8X8z8C7o4GOMIGLMAsGA1UdDwQEAwIHgDATBgNVHSUEDDAKBggrBgEF</div>
                                        <div>BQcDAgAwHQYDVR0OBBYEFP3f9z7m5Z7h8G7K8x9Xq7X8z8C7MB8GA1UdIwQYMBaA</div>
                                        <div>FP3f9z7m5Z7h8G7K8x9Xq7X8z8C7MAoGCCqGSM49BAMDA2gAMGUCMQDhD7ZJjU+a</div>
                                        <div>Qf+UvP1RkYjJk3A6mK7T8qQc6Y7B5K3JvH2M8G3X3P1N9z7m5Z7h8G7KCMQDhD7ZJ</div>
                                        <div>-----END CERTIFICATE-----</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleCopyFingerprint(showPemModal.fingerprint)}
                                            className="flex-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 py-3.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
                                        >
                                            Copy SHA Fingerprint
                                        </button>
                                        <button
                                            onClick={() => setShowPemModal(null)}
                                            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Issue Certificate Modal Form */}
                <AnimatePresence>
                    {showIssueModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
                                onClick={() => setShowIssueModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] z-[51] rounded-[24px] border border-black/[0.08] dark:border-white/10 shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-[#1d1d1f]'}`}
                            >
                                <div className="px-6 py-5 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
                                    <h3 className="text-[18px] font-bold tracking-tight">Issue New Certificate</h3>
                                    <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleIssueCertificate} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-slate-400 ml-1">Device Name / Common Name (CN)</label>
                                        <input required value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="e.g. Lobby Thermostat Sensor" className={`w-full px-4 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-slate-400 ml-1">Certificate Type</label>
                                        <select value={newCertType} onChange={e => setNewCertType(e.target.value as any)} className={`w-full px-3 py-3 rounded-[12px] border focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all ${theme === 'dark' ? 'bg-[#0f172a] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <option value="Device Certificate">Device Certificate</option>
                                            <option value="Broker Certificate">Broker Certificate</option>
                                            <option value="Server Certificate">Server Certificate</option>
                                        </select>
                                    </div>
                                    <div className="pt-4 flex flex-col gap-3">
                                        <div className={`flex items-start gap-2 text-[12px] p-3 rounded-[12px] ${theme === 'dark' ? 'bg-[#3b82f6]/10 text-white/70' : 'bg-blue-50/50 text-[#86868b]'}`}>
                                            <ShieldCheck size={14} className="text-[#3b82f6] mt-0.5 flex-shrink-0" />
                                            <span>Issues a cryptographically signed X.509 v3 certificate. Signature algorithm: ECDSA-with-SHA256, public key algorithm: ECC (NIST P-256).</span>
                                        </div>
                                        <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3.5 rounded-[12px] transition-all shadow-md active:scale-[0.98] cursor-pointer">
                                            Issue Certificate
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
