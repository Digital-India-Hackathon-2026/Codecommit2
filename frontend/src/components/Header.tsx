import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, LogOut } from 'lucide-react';
import splashImg from '../assets/Splash_image.png';

const Header = ({ isClosing = false }: { isClosing?: boolean }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDashboard = location.pathname.startsWith('/dashboard');

    const landingNavItems = [
        { label: 'Home', target: '/#home', pathMatch: '/' },
        { label: 'Features', target: '/#docs', pathMatch: '/' },
        { label: 'Pricing', target: '/#pricing', pathMatch: '/' },
        { label: 'Terms', target: '/terms', pathMatch: '/terms' },
        { label: 'Privacy', target: '/privacy', pathMatch: '/privacy' },
        { label: 'Firmware', target: '/firmware', pathMatch: '/firmware' },
        { label: 'Contact Us', target: '/contact', pathMatch: '/contact' }
    ];

    const dashboardNavItems = [
        { label: 'Overview', target: '/dashboard', pathMatch: '/dashboard' },
        { label: 'Devices', target: '/dashboard/devices', pathMatch: '/dashboard/devices' },
        { label: 'Certificates', target: '/dashboard/certificates', pathMatch: '/dashboard/certificates' },
        { label: 'Broker Logs', target: '/dashboard/broker-logs', pathMatch: '/dashboard/broker-logs' },
    ];

    const navItems = isDashboard ? dashboardNavItems : landingNavItems;

    // Helper to determine if a link is "active" based on current path and hash
    const isLinkActive = (item: typeof navItems[0]) => {
        if (location.pathname === item.pathMatch) {
            // If we are on the home page, we need to check the hash. 
            // If there's no hash, 'Home' is active.
            if (item.pathMatch === '/') {
                if (item.target === '/#home' && (!location.hash || location.hash === '#home')) return true;
                if (location.hash === item.target.replace('/', '')) return true;
                return false;
            }
            // For other pages like /terms, just matching the path is enough
            return true;
        }
        return false;
    };

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '16px',
                pointerEvents: isClosing ? 'none' : 'auto', // Disable interactions when closing
            }}
        >
            {/* Glassmorphic bar with morph animation */}
            <div
                style={{
                    // Initial styles will be overridden by animation keyframes
                    width: '100%',
                    maxWidth: '1600px',
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
                    padding: '0px 0px', // Reduced padding to push content to edges
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: isClosing
                        ? 'headerMorphReverse 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
                        : 'headerMorph 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
                    transformOrigin: 'top center',
                    overflow: 'hidden',
                }}
            >
                {/* Logo & Brand Name - Logo moves from center to left via margin animation */}
                <Link to="/" style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: isClosing
                        ? 'logoMoveReverse 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
                        : 'logoMove 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}>
                    {/* Replaced generic "S" with Splash Image */}
                    <img
                        src={splashImg}
                        alt="Logo"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '12px' }}
                    />

                    {/* Text fades in later */}
                    <span style={{
                        fontFamily: "'Syncopate', sans-serif",
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        animation: isClosing
                            ? 'contentHide 0.5s ease both'
                            : 'contentReveal 0.5s ease 0.4s both'
                    }}>
                        Nakshatra
                    </span>
                </Link>

                {/* Desktop Navigation - Fades in */}
                {!isMobile && (
                    <nav style={{
                        animation: isClosing
                            ? 'contentHide 0.5s ease both'
                            : 'contentReveal 0.5s ease 0.4s both',
                        display: 'flex', gap: '6px'
                    }}>
                        {navItems.map((item) => {
                            const active = isLinkActive(item);
                            const isExternal = item.target.startsWith('http');

                            const linkStyles: React.CSSProperties = {
                                textDecoration: 'none',
                                fontFamily: "'Kanit', sans-serif",
                                color: active ? '#0f172a' : '#475569',
                                fontSize: active ? '15px' : '14px',
                                fontWeight: active ? 700 : 500,
                                padding: '8px 18px',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                            };

                            const Indicator = active && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        left: '18px',
                                        right: '18px',
                                        height: '2px',
                                        backgroundColor: '#3b82f6',
                                        borderRadius: '2px',
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            );

                            return isExternal ? (
                                <a
                                    key={item.label}
                                    href={item.target}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={linkStyles}
                                    className="nav-link"
                                >
                                    {item.label}
                                    {Indicator}
                                </a>
                            ) : (
                                <Link
                                    key={item.label}
                                    to={item.target}
                                    style={linkStyles}
                                    className="nav-link"
                                >
                                    {item.label}
                                    {Indicator}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                {/* Desktop Auth Buttons - Fades in */}
                {!isMobile && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: isClosing
                            ? 'contentHide 0.5s ease both'
                            : 'contentReveal 0.5s ease 0.4s both'
                    }}>
                        {isDashboard ? (
                            <div className="flex items-center gap-2 md:gap-4">
                                {/* Search Icon/Button */}
                                <button className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <Search size={20} />
                                </button>

                                {/* Notifications */}
                                <Link to="/dashboard/notifications" className="relative p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <Bell size={20} />
                                </Link>

                                {/* Profile */}
                                <Link to="/dashboard/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <User size={20} />
                                </Link>

                                {/* Splitter */}
                                <span style={{ color: 'rgba(71, 85, 105, 0.2)', userSelect: 'none', margin: '0 4px' }}>|</span>

                                {/* Logout Icon */}
                                <Link
                                    to="/"
                                    className="p-2 rounded-full hover:bg-red-50 text-[#475569] hover:text-red-500 transition-colors"
                                    title="Log out"
                                >
                                    <LogOut size={20} />
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    style={{
                                        textDecoration: 'none',
                                        fontFamily: "'Kanit', sans-serif",
                                        color: '#475569',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        padding: '8px 20px',
                                        borderRadius: '99px',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        background: 'transparent',
                                        border: '1px solid rgba(71, 85, 105, 0.2)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#0f172a';
                                        e.currentTarget.style.transform = 'translateY(-2px)'; // Slight lift
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#475569';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Log in
                                </Link>
                                <span style={{ color: 'rgba(71, 85, 105, 0.4)', userSelect: 'none' }}>|</span>
                                <Link to="/signup" style={{
                                    textDecoration: 'none',
                                    fontFamily: "'Kanit', sans-serif",
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white',
                                    padding: '8px 24px',
                                    borderRadius: '99px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 246, 0.3)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile Menu Toggle */}
                {isMobile && (
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            animation: isClosing
                                ? 'contentHide 0.5s ease both'
                                : 'contentReveal 0.5s ease 0.4s both'
                        }}
                        aria-label="Toggle menu"
                    >
                        <span
                            style={{
                                display: 'block',
                                width: '18px',
                                height: '2px',
                                backgroundColor: '#1e293b',
                                borderRadius: '99px',
                                transition: 'all 0.3s ease',
                                transform: menuOpen ? 'rotate(45deg) translateY(3.5px) translateX(3.5px)' : 'none',
                            }}
                        />
                        <span
                            style={{
                                display: 'block',
                                width: '18px',
                                height: '2px',
                                backgroundColor: '#1e293b',
                                borderRadius: '99px',
                                transition: 'all 0.3s ease',
                                transform: menuOpen ? 'rotate(-45deg) translateY(-3.5px) translateX(3.5px)' : 'none',
                            }}
                        />
                    </button>
                )}
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMobile && menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '80px',
                            left: '20px',
                            right: '20px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        {navItems.map((item) => {
                            const isExternal = item.target.startsWith('http');
                            const linkStyles = {
                                textDecoration: 'none',
                                fontFamily: "'Kanit', sans-serif",
                                color: '#0f172a',
                                fontSize: '18px',
                                fontWeight: 500,
                            };

                            return isExternal ? (
                                <a
                                    key={item.label}
                                    href={item.target}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={linkStyles}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <Link
                                    key={item.label}
                                    to={item.target}
                                    style={linkStyles}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '8px 0' }} />

                        {isDashboard ? (
                            <div className="flex items-center gap-2 md:gap-4">
                                {/* Search Icon/Button */}
                                <button className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <Search size={20} />
                                </button>

                                {/* Notifications */}
                                <Link to="/dashboard/notifications" className="relative p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <Bell size={20} />
                                </Link>

                                {/* Profile */}
                                <Link to="/dashboard/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#475569] hover:text-[#0f172a]">
                                    <User size={20} />
                                </Link>

                                {/* Splitter */}
                                <span style={{ color: 'rgba(71, 85, 105, 0.2)', userSelect: 'none', margin: '0 4px' }}>|</span>

                                {/* Logout Icon */}
                                <Link
                                    to="/"
                                    className="p-2 rounded-full hover:bg-red-50 text-[#475569] hover:text-red-500 transition-colors"
                                    title="Log out"
                                >
                                    <LogOut size={20} />
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Link
                                    to="/login"
                                    style={{
                                        textDecoration: 'none',
                                        fontFamily: "'Kanit', sans-serif",
                                        color: '#0f172a',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        textAlign: 'center',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(15, 23, 42, 0.1)',
                                    }}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    style={{
                                        textDecoration: 'none',
                                        fontFamily: "'Kanit', sans-serif",
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        textAlign: 'center',
                                        padding: '12px',
                                        borderRadius: '16px',
                                    }}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
