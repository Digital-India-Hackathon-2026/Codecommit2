import { User, Shield, Lock, CreditCard, Monitor, LogOut, ChevronRight, CheckCircle2, AlertCircle, Plus, Camera, Layers, ChevronDown, X, Smartphone, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../locales';
import { fetchProfile, updateProfile } from '../../services/api';
const Profile = () => {
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');
    const [showOtherPlans, setShowOtherPlans] = useState(false);

    const location = useLocation();

    // Catch routing parameters to pre-select a section
    useEffect(() => {
        if (location.state && location.state.section) {
            setActiveSection(location.state.section);
        }
    }, [location]);

    // --- State Management for Interactivity ---

    // Personal Info
    const [personalInfo, setPersonalInfo] = useState({
        name: 'Nakshatra Admin',
        birthday: '2000-01-01',
        email: 'Nakshatra@admin.dev',
        language: 'English (US)',
        avatarUrl: ''
    });

    const t = useTranslation(personalInfo.language);

    // Security
    const [security, setSecurity] = useState({
        twoFactor: true,
        recoveryKey: false,
        trustedNumbers: ['•••• ••• ••89'],
        recoveryContact: 'None'
    });

    // Subscriptions
    const [activePlan, setActivePlan] = useState('Professional');

    // Devices
    const [devices, setDevices] = useState([
        { id: 1, name: 'Nakshatra’s MacBook Pro', os: 'macOS 14.2', current: true, type: 'mac' },
        { id: 2, name: 'Nakshatra’s iPhone 15 Pro', os: 'iOS 17.3', current: false, type: 'iphone' }
    ]);

    // Payment Methods
    const [payments, setPayments] = useState([
        { id: 'Nakshatra_card', name: 'Nakshatra Card', last4: '1234', isNakshatraCard: true },
        { id: 'mastercard_1', name: 'Mastercard', last4: '1234', isPrimary: true }
    ]);

    // Privacy
    const [privacy, setPrivacy] = useState({
        hideMyEmail: true,
        privateRelay: true,
        appTracking: false
    });

    // Modal State
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [tempValue, setTempValue] = useState<any>('');

    useEffect(() => {
        setMounted(true);
        fetchProfile().then(profile => {
            if (profile) {
                setPersonalInfo(prev => ({
                    ...prev,
                    name: `${profile.first_name} ${profile.last_name}`.trim(),
                    email: profile.email
                }));
            }
        });
    }, []);

    // --- Modal Handlers ---
    const openModal = (id: string, data?: any) => {
        setActiveModal(id);
        setModalData(data);

        // Pre-fill tempValue based on modal type
        if (id === 'name') setTempValue(personalInfo.name);
        if (id === 'birthday') setTempValue(personalInfo.birthday);
        if (id === 'email') setTempValue(personalInfo.email);
        if (id === 'language') setTempValue(personalInfo.language);
        if (id === 'avatar') setTempValue(personalInfo.avatarUrl || '');
        if (id === 'add_payment') setTempValue({ cardString: '' });
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalData(null);
        setTempValue('');
    };

    const handleSave = async () => {
        if (activeModal === 'name') {
            setPersonalInfo(prev => ({ ...prev, name: tempValue }));
            const parts = tempValue.split(' ');
            await updateProfile({ 
                first_name: parts[0] || '', 
                last_name: parts.slice(1).join(' ') || '', 
                email: personalInfo.email, 
                role: 'Security Administrator', 
                department: 'Infrastructure Security' 
            });
        } else if (activeModal === 'email') {
            setPersonalInfo(prev => ({ ...prev, email: tempValue }));
            const parts = personalInfo.name.split(' ');
            await updateProfile({ 
                first_name: parts[0] || '', 
                last_name: parts.slice(1).join(' ') || '', 
                email: tempValue, 
                role: 'Security Administrator', 
                department: 'Infrastructure Security' 
            });
        } else if (activeModal === 'avatar') {
            setPersonalInfo(prev => ({ ...prev, avatarUrl: tempValue }));
        } else if (activeModal === 'birthday') {
            setPersonalInfo(prev => ({ ...prev, birthday: tempValue }));
        } else if (activeModal === 'language') {
            setPersonalInfo(prev => ({ ...prev, language: tempValue }));
        } else if (activeModal === 'twoFactor') {
            setSecurity(prev => ({ ...prev, twoFactor: !prev.twoFactor }));
        } else if (activeModal === 'recoveryKey') {
            setSecurity(prev => ({ ...prev, recoveryKey: !prev.recoveryKey }));
        } else if (activeModal === 'edit_device' && modalData) {
            setDevices(prev => prev.filter(d => d.id !== modalData.id));
        } else if (activeModal === 'edit_payment' && modalData) {
            setPayments(prev => prev.filter(p => p.id !== modalData.id));
        } else if (activeModal === 'add_payment') {
            if (tempValue.cardString.trim() !== '') {
                setPayments(prev => [...prev, { id: `card_${Date.now()}`, name: 'Visa', last4: tempValue.cardString.slice(-4) || '0000', isPrimary: false }]);
            }
        } else if (activeModal === 'hideMyEmail') {
            setPrivacy(prev => ({ ...prev, hideMyEmail: !prev.hideMyEmail }));
        } else if (activeModal === 'privateRelay') {
            setPrivacy(prev => ({ ...prev, privateRelay: !prev.privateRelay }));
        } else if (activeModal === 'appTracking') {
            setPrivacy(prev => ({ ...prev, appTracking: !prev.appTracking }));
        }

        closeModal();
    };

    const navItems = [
        { id: 'personal', label: t('nav_personal', 'Personal Information'), icon: <User size={20} strokeWidth={1.5} /> },
        { id: 'security', label: t('nav_security', 'Sign-In and Security'), icon: <Shield size={20} strokeWidth={1.5} /> },
        { id: 'payment', label: t('nav_payment', 'Payment Methods'), icon: <CreditCard size={20} strokeWidth={1.5} /> },
        { id: 'subscriptions', label: t('nav_subscriptions', 'Subscriptions'), icon: <Layers size={20} strokeWidth={1.5} /> },
        { id: 'devices', label: t('nav_devices', 'Devices'), icon: <Monitor size={20} strokeWidth={1.5} /> },
        { id: 'privacy', label: t('nav_privacy', 'Privacy'), icon: <Lock size={20} strokeWidth={1.5} /> },
    ];

    // Reusable Apple Card Component for consistency
    const AppleCard = ({ children, title, description = "", action = "", onActionClick = () => { } }: { children: React.ReactNode, title?: string, description?: string, action?: string, onActionClick?: () => void }) => (
        <div className="bg-white dark:bg-slate-900 rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/5 overflow-hidden mb-6">
            {(title || description || action) && (
                <div className="px-5 pt-[18px] pb-3 border-b border-[#f5f5f7] dark:border-white/5">
                    <div className="flex justify-between items-start">
                        <div>
                            {title && <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.01em]">{title}</h3>}
                            {description && <p className="text-[15px] text-[#86868b] dark:text-slate-400 mt-[2px] tracking-[-0.01em]">{description}</p>}
                        </div>
                        {action && <button onClick={onActionClick} className="text-[15px] text-[#0071e3] font-medium tracking-[-0.01em] hover:underline outline-none">{action}</button>}
                    </div>
                </div>
            )}
            {children}
        </div>
    );

    // Reusable Row Component
    const AppleRow = ({ label, value, subtext = "", status = null, onClick = null, last = false }: any) => (
        <>
            <div className={`px-5 py-[18px] ${onClick ? 'cursor-pointer hover:bg-[#f5f5f7]/50 dark:hover:bg-white/5 transition-colors' : ''}`} onClick={onClick}>
                <div className="flex justify-between items-center group">
                    <div>
                        <h4 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.01em]">{label}</h4>
                        <div className="flex items-center gap-2 mt-[2px]">
                            {status === 'verified' && <CheckCircle2 size={14} className="text-[#34c759]" strokeWidth={2.5} />}
                            {status === 'warning' && <AlertCircle size={14} className="text-[#ff9500]" strokeWidth={2.5} />}
                            <p className="text-[15px] text-[#1d1d1f] dark:text-slate-300 tracking-[-0.01em]">{value}</p>
                            {subtext && <span className="px-[6px] py-[2px] bg-[#f5f5f7] dark:bg-white/5 border border-[#d2d2d7] dark:border-white/10 text-[#1d1d1f] dark:text-slate-300 text-[10px] font-semibold tracking-wider uppercase rounded">{subtext}</span>}
                        </div>
                    </div>
                    {onClick && <ChevronRight size={20} className="text-[#c7c7cc] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors" strokeWidth={2.5} />}
                </div>
            </div>
            {!last && <div className="border-t border-[#d2d2d7] dark:border-white/5 ml-5"></div>}
        </>
    );

    // Reusable Toggle implementation imitating iOS settings
    const AppleToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`w-[50px] h-[30px] rounded-full p-[2px] transition-colors duration-300 ease-in-out ${checked ? 'bg-[#34c759]' : 'bg-[#e3e3e6]'}`}
        >
            <motion.div
                layout
                className="w-[26px] h-[26px] bg-white rounded-full shadow-sm"
                animate={{ x: checked ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );

    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }} className="min-h-screen bg-[#f5f5f7] dark:bg-slate-950 text-[#1d1d1f] dark:text-white pt-24 pb-24 selection:bg-[#0071e3] selection:text-white relative">

            <div className={`max-w-[1020px] mx-auto px-4 md:px-8 relative z-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

                {/* Header Section */}
                <div className="flex flex-col items-center mb-14 mt-8 cursor-pointer group" onClick={() => openModal('avatar')}>
                    <div className="relative">
                        <div className="w-[100px] h-[100px] bg-gradient-to-b from-[#a1a1a6] to-[#86868b] dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center text-white text-[40px] font-medium tracking-tight mb-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                            {personalInfo.avatarUrl ? (
                                <img src={personalInfo.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                personalInfo.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-[#d2d2d7] dark:border-white/10 shadow-sm text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">
                            <Camera size={16} strokeWidth={2} />
                        </div>
                    </div>
                    <h1 className="text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] dark:text-white leading-tight group-hover:text-[#0071e3] transition-colors cursor-pointer">
                        {personalInfo.name}
                    </h1>
                    <p className="text-[21px] font-normal text-[#1d1d1f] dark:text-slate-400 tracking-[-0.01em] mt-1">
                        {personalInfo.email}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-[40px] md:gap-[60px]">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-[260px] shrink-0">
                        <nav className="flex flex-col space-y-[2px]">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]
                                        ${activeSection === item.id
                                            ? 'bg-[#e3e3e6] dark:bg-slate-800 text-[#1d1d1f] dark:text-white font-semibold'
                                            : 'text-[#1d1d1f] dark:text-slate-300 font-normal hover:bg-[#e8e8ed] dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <span className={activeSection === item.id ? 'text-[#0071e3]' : 'text-[#1d1d1f] dark:text-slate-400'}>
                                        {item.icon}
                                    </span>
                                    <span className="text-[15px] tracking-[-0.01em]">
                                        {item.label}
                                    </span>
                                </button>
                            ))}

                            <div className="pt-4 mt-2">
                                <button onClick={() => { window.location.assign('/'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left text-[#e30000] hover:bg-[#ffe5e5] dark:hover:bg-red-500/10 transition-colors duration-150 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#e30000]">
                                    <LogOut size={20} strokeWidth={1.5} />
                                    <span className="text-[15px] tracking-[-0.01em]">{t('sign_out', 'Sign Out')}</span>
                                </button>
                            </div>
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">

                            {/* Personal Information */}
                            {activeSection === 'personal' && (
                                <motion.div
                                    key="personal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">{t('header_personal', 'Personal Information')}</h2>

                                    <AppleCard>
                                        <AppleRow label={t('label_name', 'Name')} value={personalInfo.name} onClick={() => openModal('name')} />
                                        <AppleRow label={t('label_birthday', 'Birthday')} value={new Date(personalInfo.birthday).toLocaleDateString(personalInfo.language === 'Español' ? 'es-ES' : personalInfo.language === 'Français' ? 'fr-FR' : personalInfo.language === 'Deutsch' ? 'de-DE' : personalInfo.language === '日本語' ? 'ja-JP' : personalInfo.language === '中文 (简体)' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} onClick={() => openModal('birthday')} last />
                                    </AppleCard>

                                    <AppleCard title={t('title_contactable', 'Contactable At')} description={t('desc_contactable', 'These email addresses and phone numbers can be used to reach you.')}>
                                        <AppleRow label={t('label_email', 'Email')} value={personalInfo.email} subtext="Primary" onClick={() => openModal('email')} last />
                                    </AppleCard>

                                    <AppleCard>
                                        <AppleRow label={t('label_language', 'Language')} value={personalInfo.language} onClick={() => openModal('language')} last />
                                    </AppleCard>
                                </motion.div>
                            )}

                            {/* Sign-In and Security */}
                            {activeSection === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">Sign-In and Security</h2>

                                    <AppleCard title="Sign-In Methods" description="How you sign in to Nakshatra and its services.">
                                        <AppleRow label="Password" value="Last changed 3 months ago" onClick={() => openModal('password')} />
                                        <AppleRow label="Passkeys" value="Zero passkeys registered" onClick={() => openModal('passkeys')} />
                                        <AppleRow label="Two-Factor Authentication" value={security.twoFactor ? "On" : "Off"} status={security.twoFactor ? 'verified' : 'warning'} onClick={() => openModal('twoFactor')} last />
                                    </AppleCard>

                                    <AppleCard title="Account Security" description="Options to help you access your account and verify your identity.">
                                        <AppleRow label="Trusted Phone Numbers" value={security.trustedNumbers[0]} onClick={() => openModal('trustedNumbers')} />
                                        <AppleRow label="Recovery Key" value={security.recoveryKey ? "On" : "Off"} status={!security.recoveryKey ? 'warning' : 'verified'} onClick={() => openModal('recoveryKey')} />
                                        <AppleRow label="Account Recovery Contact" value={security.recoveryContact} onClick={() => openModal('recoveryContact')} last />
                                    </AppleCard>
                                </motion.div>
                            )}

                            {/* Payment Methods */}
                            {activeSection === 'payment' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">Payment Methods</h2>

                                    {payments.some(p => p.isNakshatraCard) && (
                                        <div className="bg-gradient-to-r from-[#000000] to-[#333333] rounded-[18px] p-6 text-white mb-6 shadow-md relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => openModal('edit_payment', payments.find(p => p.isNakshatraCard))}>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                            <h3 className="text-[21px] font-semibold tracking-tight mb-1">Nakshatra Card</h3>
                                            <p className="text-[15px] opacity-80 mb-6">•••• 1234</p>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[13px] opacity-60 uppercase tracking-widest font-semibold">Cardholder</p>
                                                    <p className="text-[17px] font-medium tracking-tight">{personalInfo.name}</p>
                                                </div>
                                                <div className="w-12 h-8 bg-white/20 backdrop-blur-md rounded flex items-center justify-center">
                                                    <CreditCard size={18} className="text-white opacity-80" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <AppleCard title="Saved Methods">
                                        {payments.filter(p => !p.isNakshatraCard).length > 0 ? (
                                            payments.filter(p => !p.isNakshatraCard).map((p, i, arr) => (
                                                <AppleRow key={p.id} label={p.name} value={`•••• ${p.last4} ${p.isPrimary ? '(Primary)' : ''}`} onClick={() => openModal('edit_payment', p)} last={i === arr.length - 1} />
                                            ))
                                        ) : (
                                            <div className="px-5 py-6 text-center text-[#86868b] text-[15px]">No other saved cards.</div>
                                        )}
                                        <div className="border-t border-[#d2d2d7]"></div>
                                        <div className="px-5 py-[16px] cursor-pointer hover:bg-[#f5f5f7]/50 transition-colors" onClick={() => openModal('add_payment')}>
                                            <div className="flex items-center gap-3 text-[#0071e3]">
                                                <Plus size={20} />
                                                <span className="text-[17px] font-normal tracking-[-0.01em]">Add Payment Method</span>
                                            </div>
                                        </div>
                                    </AppleCard>
                                </motion.div>
                            )}

                            {/* Subscriptions */}
                            {activeSection === 'subscriptions' && (
                                <motion.div
                                    key="subscriptions"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">Subscriptions</h2>

                                    {activePlan ? (
                                        <div className="mb-2">
                                            <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.01em] mb-[6px] ml-2">Active</h3>

                                            <div className="bg-white dark:bg-slate-900 rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-[19px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Nakshatra {activePlan}</h4>
                                                    </div>
                                                    <p className="text-[13px] text-[#86868b] tracking-[-0.01em] leading-relaxed max-w-sm mt-1">
                                                        {activePlan === 'Professional' ? 'Up to 20,000 devices, 10M events/day, and Automated Zero-Touch Provisioning. Next billing date: April 1, 2026.' : 'Your active subscription details.'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:gap-2">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[19px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">{activePlan === 'Basic' ? '₹499' : activePlan === 'Professional' ? '₹3,799' : '₹10,990'}</span>
                                                        <span className="text-[13px] text-[#86868b] tracking-[-0.01em]">/mo</span>
                                                    </div>
                                                    <button onClick={() => { if (confirm('Cancel subscription?')) setActivePlan(''); }} className="text-[#e30000] hover:text-[#ff3b30] text-[15px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none">
                                                        Cancel Subscription
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 p-6 bg-white rounded-[18px] text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
                                            <p className="text-[17px] font-medium text-[#1d1d1f]">No active subscriptions.</p>
                                        </div>
                                    )}

                                    <div className="mt-8 mb-2">
                                        <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.01em] mb-[6px] ml-2">Options</h3>

                                        <div className="bg-white dark:bg-slate-900 rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/5 overflow-hidden">
                                            <button
                                                onClick={() => setShowOtherPlans(!showOtherPlans)}
                                                className="w-full flex justify-between items-center px-5 py-[18px] hover:bg-[#f5f5f7]/50 transition-colors focus-visible:outline-none focus-visible:bg-[#f5f5f7]"
                                            >
                                                <span className="text-[17px] font-normal text-[#1d1d1f] dark:text-white tracking-[-0.01em]">See All Plans</span>
                                                <motion.div
                                                    animate={{ rotate: showOtherPlans ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown size={20} className="text-[#c7c7cc]" strokeWidth={2.5} />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence>
                                                {showOtherPlans && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden bg-[#f5f5f7]/30 dark:bg-white/[0.02]"
                                                    >
                                                        <div className="border-t border-[#d2d2d7] dark:border-white/5 mx-5"></div>

                                                        {/* Other Plans List */}
                                                        <div className="divide-y divide-[#d2d2d7] dark:divide-white/5">

                                                            {/* Basic */}
                                                            {activePlan !== 'Basic' && (
                                                                <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Basic</h4>
                                                                        </div>
                                                                        <p className="text-[13px] text-[#86868b] tracking-[-0.01em] max-w-sm">Up to 500 devices with standard encryption.</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">₹499<span className="font-normal text-[#86868b]">/mo</span></span>
                                                                        </div>
                                                                        <button onClick={() => { setActivePlan('Basic'); setShowOtherPlans(false); }} className="bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#1d1d1f] font-medium text-[13px] px-4 py-1.5 rounded-full transition-colors tracking-[-0.01em] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                            Select
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Professional */}
                                                            {activePlan !== 'Professional' && (
                                                                <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Professional</h4>
                                                                        </div>
                                                                        <p className="text-[13px] text-[#86868b] tracking-[-0.01em] max-w-sm">20,000 devices, 10M events/day, automated provisioning.</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">₹3,799<span className="font-normal text-[#86868b]">/mo</span></span>
                                                                        </div>
                                                                        <button onClick={() => { setActivePlan('Professional'); setShowOtherPlans(false); }} className="bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#1d1d1f] font-medium text-[13px] px-4 py-1.5 rounded-full transition-colors tracking-[-0.01em] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                            Select
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Scale */}
                                                            {activePlan !== 'Scale' && (
                                                                <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group bg-[#f5fbfd]">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Scale <span className="text-[#0071e3] font-normal text-[13px] ml-1">Most Popular</span></h4>
                                                                        </div>
                                                                        <p className="text-[13px] text-[#86868b] tracking-[-0.01em] max-w-sm">150,000 devices, Threat Anomaly Detection.</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">₹10,990<span className="font-normal text-[#86868b]">/mo</span></span>
                                                                        </div>
                                                                        <button onClick={() => { setActivePlan('Scale'); setShowOtherPlans(false); }} className="bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#0071e3] font-medium text-[13px] px-4 py-1.5 rounded-full transition-colors tracking-[-0.01em] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                            Upgrade
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Custom */}
                                                            <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Custom</h4>
                                                                    </div>
                                                                    <p className="text-[13px] text-[#86868b] tracking-[-0.01em] max-w-sm">Dedicated infrastructure for critical deployments.</p>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">Let's Talk</span>
                                                                    </div>
                                                                    <button onClick={() => alert('Support team will contact you shortly.')} className="bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#1d1d1f] font-medium text-[13px] px-4 py-1.5 rounded-full transition-colors tracking-[-0.01em] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                        Contact
                                                                    </button>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                </motion.div>
                            )}

                            {/* Devices */}
                            {activeSection === 'devices' && (
                                <motion.div
                                    key="devices"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">Devices</h2>

                                    <AppleCard title="Your Devices" description="These devices are currently signed in to your account.">
                                        {devices.length > 0 ? devices.map((device, i, arr) => (
                                            <div key={device.id}>
                                                <div onClick={() => openModal('edit_device', device)} className="px-5 py-[18px] cursor-pointer hover:bg-[#f5f5f7]/50 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 flex items-center justify-center bg-[#f5f5f7] dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                                                            {device.type === 'mac' ? (
                                                                <Monitor size={24} className="text-[#1d1d1f]" strokeWidth={1.5} />
                                                            ) : (
                                                                <Smartphone size={24} className="text-[#1d1d1f]" strokeWidth={1.5} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">{device.name}</h4>
                                                            <p className="text-[15px] text-[#86868b] tracking-[-0.01em]">{device.os} {device.current ? '• This Device' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="text-[#c7c7cc] group-hover:text-[#1d1d1f] transition-colors" strokeWidth={2.5} />
                                                </div>
                                                {i !== arr.length - 1 && <div className="border-t border-[#d2d2d7] ml-20"></div>}
                                            </div>
                                        )) : (
                                            <div className="px-5 py-6 text-[#86868b] text-[15px] text-center">No devices signed in.</div>
                                        )}
                                    </AppleCard>
                                </motion.div>
                            )}

                            {/* Privacy */}
                            {activeSection === 'privacy' && (
                                <motion.div
                                    key="privacy"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <h2 className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-white mb-6">Privacy</h2>

                                    <AppleCard title="Data & Privacy" description="Manage your data, privacy settings, and learn how we protect your information.">
                                        <AppleRow label="Manage Your Data" value="Get a copy of your data or delete your account" onClick={() => alert('Redirecting to external privacy portal...')} last />
                                    </AppleCard>

                                    <AppleCard title="Privacy Features">
                                        <AppleRow label="Hide My Email" value={privacy.hideMyEmail ? "Active" : "Inactive"} status={privacy.hideMyEmail ? 'verified' : null} onClick={() => openModal('hideMyEmail')} />
                                        <AppleRow label="Private Relay" value={privacy.privateRelay ? "Active" : "Inactive"} status={privacy.privateRelay ? 'verified' : null} onClick={() => openModal('privateRelay')} />
                                        <AppleRow label="App Tracking Transparency" value={privacy.appTracking ? "Allow Apps to Request" : "Denied for all Apps"} status={privacy.appTracking ? 'verified' : null} onClick={() => openModal('appTracking')} last />
                                    </AppleCard>
                                </motion.div>
                            )}

                        </AnimatePresence>

                        {/* Common Footer Link */}
                        <div className="flex items-center justify-center pt-6 pb-12">
                            <a href="#" className="flex items-center gap-1 text-[17px] text-[#0071e3] hover:underline tracking-[-0.01em]">
                                {t('return_home', 'Return to Nakshatra Homepage')}
                                <ChevronRight size={16} strokeWidth={2.5} className="mt-[2px]" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Level Edit Modal - Apple iOS style Center Sheet */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        ></motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-[440px] rounded-[20px] shadow-2xl relative z-10 overflow-hidden border border-white/20 dark:border-white/10"
                        >
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#f5f5f7] dark:border-white/5">
                                <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-white">
                                    {activeModal === 'name' ? 'Edit Name' :
                                        activeModal === 'birthday' ? 'Edit Birthday' :
                                            activeModal === 'language' ? 'Language Setup' :
                                                activeModal === 'email' ? 'Update Email' :
                                                    activeModal === 'avatar' ? 'Update Profile Picture' :
                                                        activeModal === 'password' ? 'Change Password' :
                                                            activeModal === 'edit_device' ? 'Device Options' :
                                                                activeModal === 'add_payment' ? 'Add Payment Method' :
                                                                    activeModal === 'edit_payment' ? 'Edit Payment' :
                                                                        activeModal === 'twoFactor' ? 'Two-Factor Authentication' :
                                                                            activeModal === 'recoveryKey' ? 'Recovery Key' :
                                                                                activeModal === 'hideMyEmail' || activeModal === 'privateRelay' || activeModal === 'appTracking' ? 'Privacy Settings' :
                                                                                    'Update Data'}
                                </h3>
                                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-[#f5f5f7] dark:bg-slate-800 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-[#e8e8ed] dark:hover:bg-slate-700 transition-colors focus-visible:outline-none">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="p-5">
                                {/* AVATAR MODAL */}
                                {(activeModal === 'avatar') && (
                                    <div className="flex flex-col items-center pb-2">
                                        <div className="w-[80px] h-[80px] bg-gradient-to-b from-[#a1a1a6] to-[#86868b] rounded-full flex items-center justify-center text-white text-[32px] font-medium tracking-tight mb-5 shadow-sm overflow-hidden border border-black/5">
                                            {tempValue ? <img src={tempValue} alt="Preview" className="w-full h-full object-cover" /> : personalInfo.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <p className="text-[15px] text-[#86868b] mb-4 text-center px-4">Enter an image URL to update your profile picture. Leave blank to use your initials.</p>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/photo.jpg"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-full bg-[#f5f5f7] dark:bg-slate-800 border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-slate-700 text-[15px] text-[#1d1d1f] dark:text-white px-4 py-3 rounded-[12px] outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* TEXT INPUT MODALS */}
                                {(activeModal === 'name' || activeModal === 'email') && (
                                    <>
                                        <p className="text-[15px] text-[#86868b] mb-4">Update the primary information associated with your Nakshatra account.</p>
                                        <input
                                            type="text"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-full bg-[#f5f5f7] dark:bg-slate-800 border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-slate-700 text-[17px] text-[#1d1d1f] dark:text-white px-4 py-3 rounded-[12px] outline-none transition-colors"
                                            autoFocus
                                        />
                                    </>
                                )}

                                {/* LANGUAGE MODAL */}
                                {(activeModal === 'language') && (
                                    <>
                                        <p className="text-[15px] text-[#86868b] dark:text-slate-400 mb-4">Choose your preferred language for the Nakshatra interface.</p>
                                        <div className="bg-[#f5f5f7] dark:bg-slate-800 rounded-[14px] overflow-hidden border border-black/[0.04] dark:border-white/5">
                                            {['English (US)', 'Español', 'Français', 'Deutsch', '日本語', '中文 (简体)'].map((lang, index, arr) => (
                                                <div key={lang}>
                                                    <button
                                                        onClick={() => setTempValue(lang)}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#e8e8ed] dark:hover:bg-slate-700 transition-colors focus-visible:outline-none"
                                                    >
                                                        <span className={`text-[17px] tracking-[-0.01em] ${tempValue === lang ? 'text-[#0071e3] font-medium' : 'text-[#1d1d1f] dark:text-slate-300'}`}>
                                                            {lang}
                                                        </span>
                                                        {tempValue === lang && <CheckCircle2 size={20} className="text-[#0071e3]" strokeWidth={2.5} />}
                                                    </button>
                                                    {index !== arr.length - 1 && <div className="border-t border-[#d2d2d7] dark:border-white/5 ml-4"></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {(activeModal === 'birthday') && (
                                    <>
                                        <p className="text-[15px] text-[#86868b] mb-4">Your date of birth is used to verify account ownership.</p>
                                        <input
                                            type="date"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-full bg-[#f5f5f7] dark:bg-slate-800 border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-slate-700 text-[17px] text-[#1d1d1f] dark:text-white px-4 py-3 rounded-[12px] outline-none transition-colors"
                                            autoFocus
                                        />
                                    </>
                                )}

                                {/* PASSWORD MODAL */}
                                {(activeModal === 'password') && (
                                    <div className="space-y-3">
                                        <input type="password" placeholder="Current Password" disabled className="w-full bg-[#f5f5f7] opacity-60 text-[17px] px-4 py-3 rounded-[12px] outline-none cursor-not-allowed" />
                                        <input type="password" placeholder="New Password" disabled className="w-full bg-[#f5f5f7] opacity-60 text-[17px] px-4 py-3 rounded-[12px] outline-none cursor-not-allowed" />
                                        <p className="text-[13px] text-[#86868b] text-center mt-2">Password resets are disabled in this demo mode.</p>
                                    </div>
                                )}

                                {/* TOGGLE MODALS (Privacy / Security) */}
                                {(activeModal === 'twoFactor' || activeModal === 'recoveryKey' || activeModal === 'hideMyEmail' || activeModal === 'privateRelay' || activeModal === 'appTracking') && (
                                    <div className="flex items-center justify-between p-4 bg-[#f5f5f7] dark:bg-slate-800 rounded-[14px]">
                                        <div className="pr-4">
                                            <h4 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.01em] mb-1">
                                                {activeModal === 'twoFactor' && 'Two-Factor Auth'}
                                                {activeModal === 'recoveryKey' && 'Recovery Key'}
                                                {activeModal === 'hideMyEmail' && 'Hide My Email'}
                                                {activeModal === 'privateRelay' && 'Private Relay'}
                                                {activeModal === 'appTracking' && 'App Tracking'}
                                            </h4>
                                            <p className="text-[13px] text-[#86868b] dark:text-slate-400 leading-tight">
                                                {activeModal === 'twoFactor' && 'Adds an extra layer of security when signing in.'}
                                                {activeModal === 'recoveryKey' && 'Generate a 28-character key to recover data.'}
                                                {activeModal === 'hideMyEmail' && 'Keep your personal email private.'}
                                                {activeModal === 'privateRelay' && 'Hide your IP address and browsing activity.'}
                                                {activeModal === 'appTracking' && 'Allow apps to ask to track your activity.'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex items-center">
                                            <AppleToggle
                                                checked={
                                                    activeModal === 'twoFactor' ? security.twoFactor :
                                                        activeModal === 'recoveryKey' ? security.recoveryKey :
                                                            activeModal === 'hideMyEmail' ? privacy.hideMyEmail :
                                                                activeModal === 'privateRelay' ? privacy.privateRelay :
                                                                    privacy.appTracking
                                                }
                                                onChange={handleSave}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* REMOVE DEVICE MODAL */}
                                {(activeModal === 'edit_device' && modalData) && (
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto bg-[#f5f5f7] dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-[#1d1d1f] dark:text-white">
                                            {modalData.type === 'mac' ? <Monitor size={32} strokeWidth={1.5} /> : <Smartphone size={32} strokeWidth={1.5} />}
                                        </div>
                                        <h4 className="text-[19px] font-semibold tracking-[-0.01em] dark:text-white mb-1">{modalData.name}</h4>
                                        <p className="text-[15px] text-[#86868b] dark:text-slate-400 mb-6">{modalData.os}</p>
                                        <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-[#ffe5e5] dark:bg-red-500/10 hover:bg-[#ffd1d1] dark:hover:bg-red-500/20 text-[#e30000] py-3 rounded-[12px] font-medium text-[17px] transition-colors focus-visible:outline-none">
                                            <Trash2 size={18} />
                                            Remove from Account
                                        </button>
                                    </div>
                                )}

                                {/* EDIT PAYMENT MODAL */}
                                {(activeModal === 'edit_payment' && modalData) && (
                                    <div className="text-center">
                                        <div className="w-16 h-12 mx-auto bg-[#1d1d1f] rounded-lg flex items-center justify-center mb-4 text-white">
                                            <CreditCard size={24} strokeWidth={1.5} />
                                        </div>
                                        <h4 className="text-[19px] font-semibold tracking-[-0.01em] dark:text-white mb-1">{modalData.name}</h4>
                                        <p className="text-[15px] text-[#86868b] dark:text-slate-400 mb-6">•••• {modalData.last4}</p>
                                        <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-[#ffe5e5] dark:bg-red-500/10 hover:bg-[#ffd1d1] dark:hover:bg-red-500/20 text-[#e30000] py-3 rounded-[12px] font-medium text-[17px] transition-colors focus-visible:outline-none">
                                            <Trash2 size={18} />
                                            Remove Payment Method
                                        </button>
                                    </div>
                                )}

                                {/* ADD PAYMENT MODAL */}
                                {(activeModal === 'add_payment') && (
                                    <div>
                                        <p className="text-[15px] text-[#86868b] mb-4">Enter your card details. We will charge a temporary ₹1 hold to verify it.</p>
                                        <input
                                            type="text"
                                            placeholder="Card Number (eg. 4242)"
                                            maxLength={16}
                                            value={tempValue.cardString || ''}
                                            onChange={(e) => setTempValue({ cardString: e.target.value })}
                                            className="w-full bg-[#f5f5f7] dark:bg-slate-800 border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-slate-700 text-[17px] text-[#1d1d1f] dark:text-white px-4 py-3 rounded-[12px] outline-none transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* GENERIC MISSING HANDLER MODAL */}
                                {(!['name', 'birthday', 'email', 'language', 'avatar', 'password', 'twoFactor', 'recoveryKey', 'hideMyEmail', 'privateRelay', 'appTracking', 'edit_device', 'edit_payment', 'add_payment'].includes(activeModal)) && (
                                    <p className="text-[15px] text-[#86868b] text-center">Feature coming soon.</p>
                                )}

                            </div>

                            {/* Standard Modal Footer Actions */}
                            {['name', 'birthday', 'email', 'language', 'avatar', 'add_payment', 'password'].includes(activeModal) && (
                                <div className="px-5 pb-5 pt-2 flex gap-3">
                                    <button onClick={closeModal} className="flex-1 bg-[#f5f5f7] dark:bg-slate-800 hover:bg-[#e8e8ed] dark:hover:bg-slate-700 text-[#1d1d1f] dark:text-white font-medium text-[17px] tracking-[-0.01em] py-3 rounded-[12px] transition-colors focus-visible:outline-none">
                                        {t('btn_cancel', 'Cancel')}
                                    </button>
                                    <button onClick={handleSave} className="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-[17px] tracking-[-0.01em] py-3 rounded-[12px] transition-colors focus-visible:outline-none shadow-sm disabled:opacity-50">
                                        {t('btn_save', 'Save')}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    letter-spacing: -0.01em;
                }
            `}</style>
        </div>
    );
};

export default Profile;
