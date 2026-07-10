import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import About from './pages/About'
import Contact from './pages/Contact'
import Cookies from './pages/Cookies'
import DataProtection from './pages/DataProtection'
import Documentation from './pages/Documentation'
import Community from './pages/Community'
import HelpCenter from './pages/HelpCenter'
import Firmware from './pages/Firmware'
import MainDashboardLayout from './layouts/MainDashboardLayout'
import Dashboard from './pages/MainDashboard/Dashboard'
import Profile from './pages/MainDashboard/Profile'
import Notifications from './pages/MainDashboard/Notifications'
import BrokerLogs from './pages/MainDashboard/BrokerLogs'
import Devices from './pages/MainDashboard/Devices'
import Certificates from './pages/MainDashboard/Certificates'
import ScrollToTop from './components/ScrollToTop'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/data-protection" element={<DataProtection />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/community" element={<Community />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/firmware" element={<Firmware />} />

          {/* Protected Dashboard Routes (Business/Admin) */}
          <Route path="/dashboard" element={<MainDashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="broker-logs" element={<BrokerLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App

