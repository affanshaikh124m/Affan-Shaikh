import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Route,
  AlertTriangle,
  Wrench,
  Users,
  BarChart3,
  MapPin,
  ArrowLeft,
  Shield,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const { currentUser } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Operations Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/roads', label: 'Roads & QR Codes', icon: Route },
    { to: '/admin/issues', label: 'Citizen Issues', icon: AlertTriangle },
    { to: '/admin/maintenance', label: 'Maintenance Records', icon: Wrench },
    { to: '/admin/contractors', label: 'Contractors', icon: Users },
    { to: '/admin/map', label: 'GIS Road Map', icon: MapPin },
    { to: '/admin/analytics', label: 'Analytics & AI Insights', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Admin Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5 text-sky-400" />
          <span className="font-bold text-sm tracking-tight">Municipal Command Center</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Ward Infrastructure Monitoring
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Active Officer Profile
        </div>
        <div className="text-xs font-bold text-white truncate mt-0.5">
          {currentUser.name}
        </div>
        <div className="text-[11px] text-sky-400 font-medium">
          {currentUser.role.replace('_', ' ')}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom return link */}
      <div className="p-3 border-t border-slate-800">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Portal</span>
        </NavLink>
      </div>
    </aside>
  );
};
