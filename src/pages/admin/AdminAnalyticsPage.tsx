import React, { useState, useEffect } from 'react';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadSegment, RoadIssue, MaintenanceRecord, SystemAlert } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const loadData = () => {
    setRoads(api.getRoads());
    setIssues(api.getIssues());
    setMaintenance(api.getMaintenanceRecords());
    setAlerts(api.getAlerts());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Issue counts by type
  const typeCounts: Record<string, number> = {};
  issues.forEach((i) => {
    typeCounts[i.problemType] = (typeCounts[i.problemType] || 0) + 1;
  });

  // Health distribution
  const healthDistribution = {
    Good: roads.filter((r) => r.condition === 'GOOD').length,
    Warning: roads.filter((r) => r.condition === 'WARNING').length,
    Poor: roads.filter((r) => r.condition === 'POOR').length,
    Critical: roads.filter((r) => r.condition === 'CRITICAL').length,
  };

  const totalSpend = maintenance.reduce((sum, m) => sum + m.costInr, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Municipal Infrastructure Analytics &amp; Strategic Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Cross-sectional defect telemetry, financial expenditure, recurring degradation clusters, and predictive AI insights
        </p>
      </div>

      {/* AI Insights Card (Labeled: AI-generated, verify before action) */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-lg p-5 shadow-sm space-y-3 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Municipal Predictive AI Pavement Insights
            </h2>
          </div>
          <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
            AI-generated, verify before action
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700 space-y-1">
            <div className="text-sky-300 font-bold uppercase text-[10px]">
              1. Monsoon Stormwater Vulnerability
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Segment <strong>MH-MUM-002 (LBS Marg Kurla)</strong> exhibits an 82% probability of sub-base saturation failure. Recommend pre-monsoon cross-culvert desilting before next rainfall cycle.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded border border-slate-700 space-y-1">
            <div className="text-amber-300 font-bold uppercase text-[10px]">
              2. Premature Fatigue Cluster
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Segment <strong>MH-MUM-008 (Sion-Dharavi Link)</strong> has averaged 35-day repair lifecycles. Patching cold mix is non-viable; full-depth bituminous overlay required to prevent base subsidence.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded border border-slate-700 space-y-1">
            <div className="text-emerald-300 font-bold uppercase text-[10px]">
              3. Asset Resilience Benchmark
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Concrete corridors <strong>MH-MUM-009 (Powai)</strong> and <strong>MH-MUM-010 (BKC)</strong> maintain health &gt;90 with zero waterlogging anomalies over 180 continuous operating days.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 pt-1">
          * Note: Municipal engineering models synthesize telemetry streams, rainfall history, and citizen defect ticket velocity. Always conduct physical core testing prior to capital tender release.
        </div>
      </div>

      {/* Analytics Charts & Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issues by Defect Category */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-700" />
            <span>Defects Classified by Category</span>
          </h3>

          <div className="space-y-2.5">
            {Object.entries(typeCounts).map(([type, count]) => {
              const pct = Math.round((count / Math.max(1, issues.length)) * 100);
              return (
                <div key={type} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="capitalize font-semibold">{type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Health Condition Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-emerald-700" />
            <span>Pavement Health Condition Distribution</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-emerald-800 font-semibold">
                <span>GOOD Condition (Score 80-100)</span>
                <span className="font-mono font-bold">{healthDistribution.Good} segments</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full"
                  style={{ width: `${(healthDistribution.Good / roads.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-amber-800 font-semibold">
                <span>WARNING Condition (Score 60-79)</span>
                <span className="font-mono font-bold">{healthDistribution.Warning} segments</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${(healthDistribution.Warning / roads.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-orange-800 font-semibold">
                <span>POOR Condition (Score 40-59)</span>
                <span className="font-mono font-bold">{healthDistribution.Poor} segments</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-2.5 rounded-full"
                  style={{ width: `${(healthDistribution.Poor / roads.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-rose-800 font-semibold">
                <span>CRITICAL Condition (Score 0-39)</span>
                <span className="font-mono font-bold">{healthDistribution.Critical} segments</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-600 h-2.5 rounded-full"
                  style={{ width: `${(healthDistribution.Critical / roads.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Expenditure & Recurring Hotspots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Issues Hotspot Table */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Recurring Failure Hotspots</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2">Road ID</th>
                  <th className="py-2">Recurring Count</th>
                  <th className="py-2">Avg Interval</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roads
                  .filter((r) => r.recurringDefectCount > 0)
                  .sort((a, b) => b.recurringDefectCount - a.recurringDefectCount)
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 font-mono font-bold text-blue-700">{r.id}</td>
                      <td className="py-2 font-mono font-bold text-rose-700">
                        {r.recurringDefectCount} failures
                      </td>
                      <td className="py-2 font-mono text-slate-600">{r.averageDaysBetweenRepairs} days</td>
                      <td className="py-2 font-bold text-[10px]">
                        {r.condition}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Spend Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>Maintenance Spend Overview</span>
          </h3>

          <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cumulative Fiscal Expenditure
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              ₹{totalSpend.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Allocated across {maintenance.length} verified work contracts
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Average Contract Cost:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{Math.round(totalSpend / Math.max(1, maintenance.length)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active IoT Alert Nodes:</span>
              <span className="font-mono font-bold text-rose-700">
                {alerts.filter((a) => !a.acknowledged).length} Active Anomaly Alerts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
