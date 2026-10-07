import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, subscribeToDataChanges } from '../../services/api';
import { UserRole } from '../../types';
import {
  Shield,
  Activity,
  Cpu,
  Bell,
  Menu,
  X,
  QrCode,
  FileText,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import { SensorSimulatorModal } from './SensorSimulatorModal';
import { WokwiCodeModal } from './WokwiCodeModal';

export const Header: React.FC = () => {
  const { currentUser, setRole } = useAuth();
  const location = useLocation();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isWokwiOpen, setIsWokwiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  const updateAlerts = () => {
    const allAlerts = api.getAlerts();
    const unacked = allAlerts.filter((a) => !a.acknowledged);
    setAlertsCount(unacked.length);
    setRecentAlerts(allAlerts.slice(0, 5));
  };

  useEffect(() => {
    updateAlerts();
    return subscribeToDataChanges(updateAlerts);
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as UserRole);
  };

  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Municipal Admin',
    INSPECTOR: 'Field Inspector',
    CONTRACTOR: 'Contractor Lead',
    CITIZEN: 'Citizen (Public)',
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        {/* Civic Top Bar */}
        <div className="bg-slate-950 text-slate-400 text-[11px] px-4 py-1 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-300">
              Government of Maharashtra &bull; Municipal Corporation of Greater Mumbai (MCGM)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>Road Infrastructure Management Portal</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">Digital Public Infrastructure</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-black text-lg shadow group-hover:bg-blue-500 transition-colors">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                    MuniRoad <span className="text-sky-400 font-mono text-xs font-semibold px-1.5 py-0.5 bg-slate-800 rounded">QR</span>
                  </div>
                  <div className="text-[10px] text-slate-400 tracking-wider font-medium uppercase mt-0.5">
                    Smart Municipal Road Infrastructure
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                  location.pathname === '/'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Road Segments
              </Link>
              <Link
                to="/road/MH-MUM-001/report"
                className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                  location.pathname.includes('/report') && !location.pathname.startsWith('/report/')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Report Issue
              </Link>
              <Link
                to="/report/ISSUE-2026-000841"
                className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                  location.pathname.startsWith('/report/')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Track Status
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide flex items-center gap-1 transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                Admin Dashboard
              </Link>
            </nav>

            {/* Controls: IoT Simulator, ESP32 Wokwi, Role Switcher */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Sensor Simulator Button */}
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors"
                title="Launch in-browser IoT sensor telemetry simulator"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>Sensor Simulator</span>
              </button>

              {/* Wokwi Hardware Sketch Button */}
              <button
                type="button"
                onClick={() => setIsWokwiOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors"
                title="View Wokwi ESP32 Arduino hardware sketch and diagram.json"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>ESP32 Wokwi</span>
              </button>

              {/* Alert Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAlertDropdown(!showAlertDropdown)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 relative"
                  title="System Alerts"
                  aria-label="System Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {alertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {alertsCount}
                    </span>
                  )}
                </button>

                {showAlertDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        System Alerts ({alertsCount})
                      </span>
                      <button
                        onClick={() => {
                          api.getAlerts().forEach((a) => api.acknowledgeAlert(a.id));
                          setShowAlertDropdown(false);
                        }}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Dismiss all
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {recentAlerts.length === 0 ? (
                        <div className="p-3 text-center text-slate-500">No active alerts</div>
                      ) : (
                        recentAlerts.map((alt) => (
                          <div key={alt.id} className="p-2.5 hover:bg-slate-50">
                            <div className="flex items-center justify-between font-semibold">
                              <span className={alt.severity === 'CRITICAL' ? 'text-rose-700' : 'text-amber-700'}>
                                {alt.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {alt.roadId}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{alt.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Role:</span>
                <select
                  value={currentUser.role}
                  onChange={handleRoleChange}
                  aria-label="Select user role"
                  className="bg-transparent text-xs font-bold text-white border-none focus:outline-none cursor-pointer pr-1"
                >
                  <option value="CITIZEN" className="bg-slate-900 text-white">Citizen (Public)</option>
                  <option value="INSPECTOR" className="bg-slate-900 text-white">Inspector</option>
                  <option value="CONTRACTOR" className="bg-slate-900 text-white">Contractor</option>
                  <option value="ADMIN" className="bg-slate-900 text-white">Admin</option>
                  <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Admin</option>
                </select>
              </div>
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(true)}
                className="p-1.5 bg-slate-800 text-sky-400 rounded"
                title="Sensor Simulator"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 bg-slate-800 text-slate-200 rounded"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 border-b border-slate-800"
            >
              Road Segments Directory
            </Link>
            <Link
              to="/road/MH-MUM-001"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 border-b border-slate-800"
            >
              Demo Road (MH-MUM-001)
            </Link>
            <Link
              to="/road/MH-MUM-001/report"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 border-b border-slate-800"
            >
              Report an Issue
            </Link>
            <Link
              to="/report/ISSUE-2026-000841"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-200 border-b border-slate-800"
            >
              Track Issue Status
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-sky-400 border-b border-slate-800"
            >
              Admin Dashboard
            </Link>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsWokwiOpen(true);
                }}
                className="text-xs bg-slate-800 px-3 py-1.5 rounded text-emerald-400 font-semibold"
              >
                ESP32 Wokwi Code
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Role:</span>
                <select
                  value={currentUser.role}
                  onChange={handleRoleChange}
                  className="bg-slate-800 text-xs text-white p-1 rounded font-bold"
                >
                  <option value="CITIZEN">Citizen</option>
                  <option value="INSPECTOR">Inspector</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Simulator Modal */}
      <SensorSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Wokwi Sketch Modal */}
      <WokwiCodeModal
        isOpen={isWokwiOpen}
        onClose={() => setIsWokwiOpen(false)}
      />
    </>
  );
};
