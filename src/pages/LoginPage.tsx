import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, UserCheck, HardHat, CheckCircle, Users } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { currentUser, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectRole = (role: UserRole) => {
    setRole(role);
    if (role === 'CITIZEN') {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };

  const rolesList: {
    role: UserRole;
    title: string;
    description: string;
    badge: string;
    icon: any;
    permissions: string[];
  }[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Admin (Chief Engineer)',
      description: 'Complete operational and governance access across all wards, contractors, audits, and configuration.',
      badge: 'All Permissions',
      icon: Shield,
      permissions: ['Manage all roads & QR tags', 'Override severities', 'Reassign contractors', 'View analytics & audit logs'],
    },
    {
      role: 'ADMIN',
      title: 'Municipal Admin (Executive Engineer)',
      description: 'Oversees road registries, issues triage, contractor dispatching, and maintenance ledger records.',
      badge: 'Admin Access',
      icon: UserCheck,
      permissions: ['Roads management', 'Triage issues', 'Assign contractors', 'Approve maintenance'],
    },
    {
      role: 'INSPECTOR',
      title: 'Field Inspector (Junior Engineer)',
      description: 'Performs physical site inspections, verifies citizen reports, and certifies completion.',
      badge: 'Field Inspections',
      icon: CheckCircle,
      permissions: ['Verify reported issues', 'Flag safety hazards', 'Inspect repair quality', 'Add audit comments'],
    },
    {
      role: 'CONTRACTOR',
      title: 'Contractor Lead (BMC Central Highway Works)',
      description: 'Executes assigned work orders, updates status to IN_PROGRESS, and submits after-repair photos.',
      badge: 'Contractor Execution',
      icon: HardHat,
      permissions: ['View assigned work orders', 'Update repair progress', 'Upload after-repair photos', 'Log remediation costs'],
    },
    {
      role: 'CITIZEN',
      title: 'Citizen (Public User)',
      description: 'Scans QR plaques, views road digital records, reports potholes via camera/AI, and tracks tickets.',
      badge: 'Public Access',
      icon: Users,
      permissions: ['Scan road QR codes', 'Submit defect reports', 'Optical AI defect analysis', 'Track ticket timelines'],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 font-sans">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-blue-700" />
          <span>Municipal Access Control Simulation</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Select Active User Role Profile
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Switch roles without passwords to evaluate role-based workflows, permissions, and administrative functions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rolesList.map((item) => {
          const Icon = item.icon;
          const isCurrent = currentUser.role === item.role;

          return (
            <div
              key={item.role}
              className={`rounded-lg border p-5 transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
                      <Icon className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Capabilities:</span>
                  <ul className="text-[11px] text-slate-600 space-y-0.5">
                    {item.permissions.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">&bull;</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => handleSelectRole(item.role)}
                  className={`w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrent ? 'Continue as Active Role' : `Switch to ${item.role.replace('_', ' ')}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
