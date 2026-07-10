import { Outlet } from 'react-router-dom';
import { PlatformProvider, usePlatform } from '../context/PlatformContext';
import Header from '../components/Header';

function LayoutContent() {
    const { theme } = usePlatform();

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            <Header />
            <main className="pt-24 min-h-[calc(100vh-64px)] overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
}

export default function MainDashboardLayout() {
    return (
        <PlatformProvider>
            <LayoutContent />
        </PlatformProvider>
    );
}
