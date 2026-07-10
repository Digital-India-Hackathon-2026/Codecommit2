import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    fetchDevices,
    revokeDevice as apiRevokeDevice,
} from '../services/api';

export type DeviceStatus = 'connected' | 'disconnected';
export type MTLSStatus = 'verified' | 'expiring_soon' | 'failed';

export interface Device {
    id: string;
    name: string;
    type: 'Sensor' | 'Gateway' | 'Actuator';
    ip: string;
    status: DeviceStatus;
    mtlsStatus: MTLSStatus;
    certExpiry: string;
    certFingerprint: string;
    lastHeartbeat: string;
    firmwareVersion: string;
    protocol: string;
    location: string;
}

interface PlatformContextType {
    devices: Device[];
    theme: string;
    toggleTheme: () => void;
    refreshData: () => void;
    lastRefreshed: Date;
    provisionDevice: (device: Partial<Device>) => void;
    rotateCertificate: (deviceId: string) => void;
    revokeDevice: (deviceId: string) => void;
    warningsCount: number;
    isLoading: boolean;
}

const INITIAL_DEVICES: Device[] = [
    {
        id: "iot-device-a72",
        name: "Building A HVAC Sensor",
        type: "Sensor",
        ip: "192.168.1.50",
        status: "connected",
        mtlsStatus: "verified",
        certExpiry: "Mar 12, 2027",
        certFingerprint: "SHA256: 8D:E3:4A:BC:D5:E2:81:4A:2C",
        lastHeartbeat: "Just now",
        firmwareVersion: "v1.2.4",
        protocol: "MQTT TLS 1.3",
        location: "HVAC Zone 1"
    },
    {
        id: "iot-gateway-9b4",
        name: "Main Floor Edge Gateway",
        type: "Gateway",
        ip: "192.168.1.1",
        status: "connected",
        mtlsStatus: "verified",
        certExpiry: "Apr 18, 2027",
        certFingerprint: "SHA256: 4A:9C:12:DF:8B:70:C1:F4:A5",
        lastHeartbeat: "Just now",
        firmwareVersion: "v2.1.0",
        protocol: "MQTT TLS 1.3",
        location: "Server Room A"
    },
    {
        id: "iot-device-c12",
        name: "Access Control Actuator",
        type: "Actuator",
        ip: "192.168.2.14",
        status: "connected",
        mtlsStatus: "expiring_soon",
        certExpiry: "Jul 25, 2026",
        certFingerprint: "SHA256: FE:98:C3:A2:10:89:E7:F4:11",
        lastHeartbeat: "Just now",
        firmwareVersion: "1.0.0",
        protocol: "MQTT TLS 1.3",
        location: "Front Entrance"
    },
    {
        id: "iot-device-d45",
        name: "Storage Room Temp Sensor",
        type: "Sensor",
        ip: "192.168.1.52",
        status: "disconnected",
        mtlsStatus: "failed",
        certExpiry: "Jun 01, 2026",
        certFingerprint: "SHA256: 22:5A:F4:C3:98:B7:91:EE:02",
        lastHeartbeat: "2 hours ago",
        firmwareVersion: "v1.2.4",
        protocol: "MQTT TLS 1.3",
        location: "Cold Storage"
    },
    {
        id: "iot-device-e88",
        name: "Backup Power Meter",
        type: "Sensor",
        ip: "10.209.222.15",
        status: "disconnected",
        mtlsStatus: "verified",
        certExpiry: "Jan 10, 2027",
        certFingerprint: "SHA256: 9B:5E:D1:4F:CA:2E:8F:D5:19",
        lastHeartbeat: "8 min ago",
        firmwareVersion: "v1.0.0",
        protocol: "MQTT TLS 1.3",
        location: "Generator Room"
    }
];

const HEARTBEATS = ['Just now', '1s ago', '2s ago', '3s ago', '5s ago', '8s ago', '12s ago'];

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
    const [isLoading, setIsLoading] = useState(true);
    const theme = 'light';
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const loadDevices = async (isSilent = false) => {
        if (!isSilent) {
            setIsLoading(true);
        }
        try {
            const fetchedData = await fetchDevices();
            if (fetchedData && Array.isArray(fetchedData)) {
                const formattedDevices: Device[] = fetchedData.map((d: any) => ({
                    id: d.id,
                    name: d.name || `Node ${d.id.substring(0, 6)}`,
                    type: d.fw_ver && d.fw_ver.includes('esp32') ? 'Microcontroller' : 'Edge Gateway',
                    ip: d.ip || 'DHCP',
                    status: d.is_active ? 'connected' : 'disconnected',
                    mtlsStatus: d.is_active ? 'verified' : 'failed',
                    certExpiry: d.cert_expiry || 'Unknown',
                    certFingerprint: d.cert_fingerprint || 'Unknown',
                    lastHeartbeat: d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : 'Just now',
                    firmwareVersion: d.fw_ver || '1.0.0',
                    protocol: 'MQTT TLS 1.2',
                    location: d.location || 'Field Network'
                }));
                setDevices(formattedDevices);
            } else {
                setDevices([]);
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
            setDevices([]);
        } finally {
            setLastRefreshed(new Date());
            if (!isSilent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadDevices(false);
        // Poll every 30 seconds silently in the background
        const interval = setInterval(() => loadDevices(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => { };

    const refreshData = () => {
        loadDevices(false);
    };

    const provisionDevice = (newDevice: Partial<Device>) => {
        const fullDevice: Device = {
            id: `iot_${Math.random().toString(36).substr(2, 6)}`,
            name: newDevice.name || 'New Device',
            type: newDevice.type || 'Sensor',
            ip: newDevice.ip || '0.0.0.0',
            status: 'connected',
            mtlsStatus: 'verified',
            certExpiry: 'Mar 08, 2027',
            certFingerprint: `SHA256:${Math.random().toString(16).substr(2, 2).toUpperCase()}:...`,
            lastHeartbeat: 'Just now',
            firmwareVersion: 'v1.0.0',
            protocol: 'MQTT over TLS 1.3',
            location: newDevice.location || 'Unknown',
        };
        setDevices(prev => [...prev, fullDevice]);
    };

    const API_BASE = 'http://localhost:8000';

    const rotateCertificate = async (deviceId: string) => {
        try {
            const res = await fetch(`${API_BASE}/device/rotate?device_id=${deviceId}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                console.error('Rotate failed:', data);
            } else {
                console.log('[ROTATE] Success:', data);
            }
        } catch (err) {
            console.error('Rotate error:', err);
            // Optimistic local fallback
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, mtlsStatus: 'verified' as MTLSStatus, certExpiry: 'Mar 08, 2027' } : d));
        }
    };

    const revokeDevice = async (deviceId: string) => {
        try {
            const success = await apiRevokeDevice(deviceId);
            if (success) {
                console.log('[REVOKE] Success');
                setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'disconnected' as DeviceStatus, mtlsStatus: 'failed' as MTLSStatus } : d));
            } else {
                console.error('Revoke failed');
            }
        } catch (err) {
            console.error('Revoke error:', err);
            // Optimistic fallback: toggle fail/verified status
            setDevices(prev => prev.map(d => {
                if (d.id === deviceId) {
                    const nextMtls = d.mtlsStatus === 'failed' ? 'verified' as MTLSStatus : 'failed' as MTLSStatus;
                    const nextStatus = nextMtls === 'failed' ? 'disconnected' as DeviceStatus : 'connected' as DeviceStatus;
                    return { ...d, status: nextStatus, mtlsStatus: nextMtls };
                }
                return d;
            }));
        }
    };

    const warningsCount = devices.filter(d => d.mtlsStatus !== 'verified').length;

    return (
        <PlatformContext.Provider value={{
            devices, theme, toggleTheme, refreshData, lastRefreshed,
            provisionDevice, rotateCertificate, revokeDevice, warningsCount, isLoading
        }}>
            {children}
        </PlatformContext.Provider>
    );
};

export const usePlatform = () => {
    const context = useContext(PlatformContext);
    if (!context) throw new Error('usePlatform must be used within a PlatformProvider');
    return context;
};
