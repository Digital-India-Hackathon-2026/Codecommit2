import { Shield, CreditCard, Hexagon, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';

const Notifications = () => {
    const { theme, isLoading } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        setMounted(true);
    }, []);

    const allActivity = [
        { id: 1, type: 'security', title: 'Security Alert', desc: 'New login from Nakshatra’s MacBook Pro in San Francisco, CA.', time: 'Just now', icon: <Shield size={20} />, color: '#f59e0b', bg: '#fef3c7' },
        { id: 2, type: 'payment', title: 'Payment Successful', desc: 'Your Nakshatra Professional renewal of ₹4,999 succeeded.', time: '2 hours ago', icon: <CreditCard size={20} />, color: '#10b981', bg: '#d1fae5' },
        { id: 3, type: 'system', title: 'System Update', desc: 'New features have been added to your dashboard, including advanced analytics.', time: '1 day ago', icon: <Hexagon size={20} />, color: '#0071e3', bg: '#eff6ff' },
        { id: 4, type: 'security', title: 'Recovery Key Generated', desc: 'A new recovery key was generated for your account.', time: '3 days ago', icon: <Shield size={20} />, color: '#f59e0b', bg: '#fef3c7' },
        { id: 5, type: 'payment', title: 'Payment Method Added', desc: 'Mastercard ending in 1234 was added to your account.', time: '1 week ago', icon: <CreditCard size={20} />, color: '#10b981', bg: '#d1fae5' }
    ];

    const filteredActivity = filter === 'all' ? allActivity : allActivity.filter(a => a.type === filter);

    if (isLoading) {
        return (
            <div className={`min-h-[60vh] flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-[#1d1d1f]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="animate-spin text-[#0071e3]" />
                    <p className={`text-[15px] tracking-[-0.01em] ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>Loading Notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
            className={`min-h-screen pt-24 pb-24 transition-colors duration-300 selection:bg-[#0071e3] selection:text-white ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}
        >

            <div className={`max-w-[800px] mx-auto px-4 md:px-8 relative z-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                    <div>
                        <h1 className="text-[40px] font-semibold tracking-[-0.022em] leading-tight">
                            Activity History
                        </h1>
                        <p className={`text-[19px] tracking-[-0.01em] mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-[#86868b]'}`}>
                            Review recent account events and notifications.
                        </p>
                    </div>

                    <div className={`mt-6 md:mt-0 flex p-1 rounded-[14px] ${theme === 'dark' ? 'bg-white/5' : 'bg-[#e3e3e6]'}`}>
                        {['all', 'security', 'payment', 'system'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-[10px] text-[15px] font-medium tracking-[-0.01em] transition-all capitalize ${filter === f
                                        ? (theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-[#1d1d1f] shadow-sm')
                                        : (theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-[#86868b] hover:text-[#1d1d1f]')
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                    <AnimatePresence mode="popLayout">
                        {filteredActivity.length > 0 ? (
                            filteredActivity.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    className={`relative p-6 flex gap-5 items-start cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#f8fafc]'} ${i !== filteredActivity.length - 1 ? `border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#f5f5f7]'}` : ''}`}
                                >
                                    <div className={`mt-1 w-[48px] h-[48px] flex-shrink-0 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'border-white/10' : 'border-black/5'}`} style={{ backgroundColor: theme === 'dark' ? `${item.color}22` : item.bg, color: item.color }}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                            <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{item.title}</h3>
                                            <span className={`text-[13px] font-medium hidden sm:block ${theme === 'dark' ? 'text-white/40' : 'text-[#86868b]'}`}>{item.time}</span>
                                        </div>
                                        <p className={`text-[15px] leading-relaxed mb-1 pr-6 ${theme === 'dark' ? 'text-white/70' : 'text-[#475569]'}`}>{item.desc}</p>
                                        <span className={`text-[13px] font-medium sm:hidden block mt-2 ${theme === 'dark' ? 'text-white/40' : 'text-[#86868b]'}`}>{item.time}</span>
                                    </div>
                                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/20' : 'text-[#d2d2d7]'}`}>
                                        <ChevronRight size={20} />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-12 text-center"
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-[#f5f5f7] text-[#86868b]'}`}>
                                    <Filter size={24} />
                                </div>
                                <h3 className="text-[19px] font-semibold mb-2 tracking-[-0.01em]">No activity found</h3>
                                <p className={`text-[15px] ${theme === 'dark' ? 'text-white/40' : 'text-[#86868b]'}`}>There are no events matching this filter category.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
