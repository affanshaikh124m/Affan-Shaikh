import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadSegment, RoadIssue, SystemAlert } from '../../types';
import { ConditionBadge } from '../../components/common/ConditionBadge';
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  Route,
  Wrench,
  Clock,
  Shield,
  Bell,
  Radio,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<{ road: RoadSegment; priorityScore: number; reason: string }[]>([]);

  const loadData = () => {
    setRoads(api.getRoads());
    setIssues(api.getIssues());
    setAlerts(api.getAlerts());
    setPriorityQueue(api.getPriorityQueue());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const totalSimulatedSegments = 250;
  const goodCount = roads.filter((r) => r.condition === 'GOOD').length;
  const warningCount = roads.filter((r) => r.condition === 'WARNING').length;
  const poorCount = roads.filter((r) => r.condition === 'POOR').length;
  const criticalCount = roads.filter((r) => r.condition === 'CRITICAL').length;

  const openIssues = issues.filter((i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status));
  const inProgressIssues = issues.filter((i) => i.status === 'IN_PROGRESS');
  const resolvedIssues = issues.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status));

  const handleAcknowledgeAlert = (id: string) => {
    api.acknowledgeAlert(id);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Municipal Command &amp; Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Brihanmumbai Municipal Corporation &bull; Citywide Infrastructure Health &amp; Dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-900 text-white rounded">
            SURVEILLANCE: ACTIVE
          </span>
          <Link
            to="/admin/issues"
            className="text-xs font-bold px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Triage Issues &rarr;
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Road Segments */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Road Segments
            </span>
            <Route className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalSimulatedSegments}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            10 pilot IoT-monitored segments
          </div>
        </div>

        {/* Condition Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Condition Breakdown
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-bold font-mono">
            <span className="text-emerald-700">{goodCount}G</span>
            <span className="text-amber-700">{warningCount}W</span>
            <span className="text-orange-700">{poorCount}P</span>
            <span className="text-rose-700">{criticalCount}C</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {criticalCount} segment(s) require emergency repair
          </div>
        </div>

        {/* Open & Active Complaints */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Issues Queue
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {openIssues.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {inProgressIssues.length} currently undergoing repair
          </div>
        </div>

        {/* Resolved Defect Work Orders */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Resolved Work Orders
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {resolvedIssues.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Certified with before/after photos
          </div>
        </div>
      </div>

      {/* Two Column Grid: Maintenance Priority Queue & Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maintenance Priority Queue (Left - 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Maintenance Priority Queue (Algorithmic Ranking)
              </h2>
              <p className="text-[11px] text-slate-500">
                Formula: Severity + Low Health + Complaint Volume + AI Defect Urgency + IoT Flood
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Ranks Roads Only
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityQueue.slice(0, 6).map((item, idx) => (
              <div
                key={item.road.id}
                className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0
                        ? 'bg-rose-600 text-white'
                        : idx === 1
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/road/${item.road.id}`}
                        className="font-mono font-bold text-blue-700 hover:underline"
                      >
                        {item.road.id}
                      </Link>
                      <span className="font-semibold text-slate-900 truncate max-w-xs">
                        {item.road.name}
                      </span>
                      <ConditionBadge condition={item.road.condition} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <strong className="text-slate-700">Driver:</strong> {item.reason}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black font-mono text-slate-900">
                    Priority Score: {item.priorityScore}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Health: {item.road.healthScore}/100 &bull; {item.road.openIssuesCount} issues
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              to="/admin/roads"
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              View Full Road Asset Register &rarr;
            </Link>
          </div>
        </div>

        {/* System Alerts Panel (Right - 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Incident &amp; Telemetry Alerts
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              {alerts.filter((a) => !a.acknowledged).length} Pending
            </span>
          </div>

          <div className="p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No active alerts</div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-3 rounded border text-xs space-y-1 transition-all ${
                    alt.acknowledged
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : alt.severity === 'CRITICAL'
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`font-bold ${
                        alt.severity === 'CRITICAL' ? 'text-rose-900' : 'text-amber-900'
                      }`}
                    >
                      {alt.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {alt.roadId}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {alt.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {new Date(alt.timestamp).toLocaleTimeString()}
                    </span>
                    {!alt.acknowledged ? (
                      <button
                        onClick={() => handleAcknowledgeAlert(alt.id)}
                        className="font-bold text-blue-700 hover:underline"
                      >
                        Acknowledge &check;
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Acknowledged</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
