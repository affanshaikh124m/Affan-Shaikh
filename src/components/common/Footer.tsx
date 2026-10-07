import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ShieldCheck, RefreshCw, AlertCircle, Phone, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const handleResetData = () => {
    if (window.confirm('Reset all road conditions, issues, and sensor values back to initial demo seeds?')) {
      api.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mandate */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                M
              </span>
              <span className="text-white font-bold text-sm">MuniRoad QR System</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Civic Infrastructure Monitoring and Automated Defect Reporting Portal.
              Enabling QR-based transparency and citizen participation across municipal road segments.
            </p>
            <div className="pt-1">
              <span className="inline-block bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
                Brihanmumbai Municipal Corporation (MCGM)
              </span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Citizen Services
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  &bull; Road Segments Directory
                </Link>
              </li>
              <li>
                <Link to="/road/MH-MUM-001" className="hover:text-white transition-colors">
                  &bull; Scan Sample Road (MH-MUM-001)
                </Link>
              </li>
              <li>
                <Link to="/road/MH-MUM-001/report" className="hover:text-white transition-colors">
                  &bull; Report Road Damage
                </Link>
              </li>
              <li>
                <Link to="/report/ISSUE-2026-000841" className="hover:text-white transition-colors">
                  &bull; Track Ticket Status
                </Link>
              </li>
              <li>
                <Link to="/history/MH-MUM-001" className="hover:text-white transition-colors">
                  &bull; Maintenance History
                </Link>
              </li>
            </ul>
          </div>

          {/* Municipal Administration */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Municipal Administration
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  &bull; Admin Operations Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/roads" className="hover:text-white transition-colors">
                  &bull; QR Code Lifecycle Management
                </Link>
              </li>
              <li>
                <Link to="/admin/issues" className="hover:text-white transition-colors">
                  &bull; Issue Triage & Assignment
                </Link>
              </li>
              <li>
                <Link to="/admin/maintenance" className="hover:text-white transition-colors">
                  &bull; Repair Records & Verification
                </Link>
              </li>
              <li>
                <Link to="/admin/map" className="hover:text-white transition-colors">
                  &bull; Municipal GIS Road Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Prototype Notices & Reset */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Civic System Prototype</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Label notice: All sensor telemetries and automated AI defect models operate in simulation/supervised mode. IoT readings are indicators requiring engineering verification.
            </p>
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              Reset Demo Seeds
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>&copy; 2026 Municipal Corporation of Greater Mumbai (MCGM). All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>24x7 Civic Helpline: 1916</span>
            <span>&bull;</span>
            <span>Road Safety Cell: 022-22694725</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
