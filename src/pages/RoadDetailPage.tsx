import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, subscribeToDataChanges } from '../services/api';
import { RoadSegment, RoadIssue, MaintenanceRecord } from '../types';
import { ConditionBadge } from '../components/common/ConditionBadge';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import { SensorSimulatorModal } from '../components/common/SensorSimulatorModal';
import {
  Camera,
  History,
  FileText,
  MapPin,
  Calendar,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';

export const RoadDetailPage: React.FC = () => {
  const { roadId } = useParams<{ roadId: string }>();
  const navigate = useNavigate();
  const [road, setRoad] = useState<RoadSegment | undefined>(undefined);
  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = () => {
    if (!roadId) return;
    const r = api.getRoadById(roadId);
    setRoad(r);
    setIssues(api.getIssues({ roadId }));
    setMaintenance(api.getMaintenanceRecords(roadId));
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, [roadId]);

  if (!road) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-amber-50 text-amber-900 border border-amber-300 p-6 rounded-lg max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Road Record Not Found</h2>
          <p className="text-xs text-amber-800 mt-1">
            Segment ID <code>{roadId}</code> is not registered in the municipal infrastructure registry.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const openIssues = issues.filter((i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status));
  const recentRepairs = maintenance.slice(0, 3);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Link to="/" className="hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Roads Directory</span>
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-slate-800">{road.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Record'}</span>
          </button>
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Simulate IoT Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Digital Record Card */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-blue-600 text-white rounded">
                ROAD ID: {road.id}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {road.ward} &bull; {road.zone}
              </span>
              <span className="text-[11px] text-slate-400">
                Plaque Status: {road.qrStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {road.name}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{road.locationDescription}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ConditionBadge condition={road.condition} size="lg" showHealthScore={road.healthScore} />
          </div>
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <Link
            to={`/road/${road.id}/report`}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs"
          >
            <Camera className="w-4 h-4 text-sky-300" />
            <span>Report an Issue</span>
          </Link>
          <Link
            to={`/history/${road.id}`}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Maintenance History ({maintenance.length})</span>
          </Link>
          <Link
            to={`/report/${issues[0]?.id || 'ISSUE-2026-000841'}`}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Citizen Reports ({issues.length})</span>
          </Link>
          <Link
            to="/admin/map"
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>Road on GIS Map</span>
          </Link>
        </div>

        {/* Recurring Defect Alert Banner */}
        {road.recurringDefectCount > 2 && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-rose-900 uppercase tracking-wider block">
                Recurring Maintenance Issue Flagged
              </span>
              <p className="text-rose-800 mt-0.5 leading-normal">
                This segment has recorded <strong>{road.recurringDefectCount} reports</strong> and repeated repairs.
                Average interval between repairs is only <strong>{road.averageDaysBetweenRepairs} days</strong> (civic threshold: &gt;180 days). Sub-base stabilization recommended.
              </p>
            </div>
          </div>
        )}

        {/* Health Score & Key Metrics Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Health Score Ring (Left) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Official Pavement Health Score
            </span>
            <HealthScoreRing score={road.healthScore} size={130} strokeWidth={11} />
            <div className="mt-3 text-[11px] text-slate-500 max-w-xs">
              Recalculated upon citizen complaints, sensor deviations, maintenance age, and AI defect audits.
            </div>
          </div>

          {/* Infrastructure Specs (Right) */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Surface Type</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{road.surfaceType}</div>
              <div className="text-[10px] text-slate-500">{road.lanes} Traffic Lanes &bull; {road.lengthKm} km</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Contractor</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{road.contractorName}</div>
              <div className="text-[10px] text-slate-500">ID: {road.contractorId}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Maintenance</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{road.lastMaintenanceDate}</div>
              <div className="text-[10px] text-slate-500">{road.lastRepairDaysAgo} days ago</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Scheduled</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{road.nextScheduledMaintenance}</div>
              <div className="text-[10px] text-slate-500">Routine pavement audit</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Complaints</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                <span className={openIssues.length > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {openIssues.length} Open
                </span>
                <span className="text-slate-400 font-normal"> / {road.resolvedIssuesCount} Resolved</span>
              </div>
              <div className="text-[10px] text-slate-500">Total tickets logged: {openIssues.length + road.resolvedIssuesCount}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plaque Location</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {road.coordinates.lat.toFixed(4)}, {road.coordinates.lng.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{road.coordinates.startPoint}</div>
            </div>
          </div>
        </div>

        {/* Live IoT Sensor Telemetry Box */}
        <div className="border-t border-slate-200 p-6 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Embedded Road Telemetry Node ({road.iotStatus.deviceId})
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Simulated data
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                  road.iotStatus.isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${road.iotStatus.isOnline ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                {road.iotStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="text-xs text-blue-700 hover:underline font-bold"
              >
                Change Telemetry &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Surface Water Depth</div>
              <div className={`text-base font-black font-mono mt-0.5 ${road.iotStatus.water_cm > 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {road.iotStatus.water_cm.toFixed(1)} cm
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Threshold: &lt; 5.0 cm</div>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Pavement Vibration</div>
              <div className={`text-base font-black font-mono mt-0.5 ${road.iotStatus.vibration_g > 0.4 ? 'text-amber-600' : 'text-slate-900'}`}>
                {road.iotStatus.vibration_g.toFixed(2)} g
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Axle impact index</div>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Ambient Illumination</div>
              <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                {road.iotStatus.lux} lux
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Streetlight health check</div>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Node Condition</div>
              <div className="text-xs font-bold text-slate-900 mt-1 uppercase">
                {road.iotStatus.status}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {road.iotStatus.lastUpdate ? new Date(road.iotStatus.lastUpdate).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>

          {road.iotStatus.alertMessage && (
            <div className="mt-2.5 bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{road.iotStatus.alertMessage}</span>
            </div>
          )}

          <div className="mt-2 text-[10px] text-slate-500 italic">
            * Note: IoT readings are indicators needing field validation, not structural diagnoses.
          </div>
        </div>
      </div>

      {/* Two Column Section: Open Issues & Maintenance History Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open Citizen Reports */}
        <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Citizen Defect Reports ({issues.length})
              </h3>
            </div>
            <Link
              to={`/road/${road.id}/report`}
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              + File New Report
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No active or historical defect reports logged for this segment.
            </div>
          ) : (
            <div className="space-y-3">
              {issues.slice(0, 4).map((issue) => (
                <Link
                  key={issue.id}
                  to={`/report/${issue.id}`}
                  className="block p-3 rounded border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {issue.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        issue.status === 'CLOSED' || issue.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : issue.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 capitalize">
                    {issue.problemType.replace(/_/g, ' ')} &bull; <span className="font-semibold text-rose-700">{issue.severity}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {issue.description}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                    <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                      Track Timeline <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance History Preview */}
        <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Official Maintenance Log ({maintenance.length})
              </h3>
            </div>
            <Link
              to={`/history/${road.id}`}
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              View Full History &rarr;
            </Link>
          </div>

          {recentRepairs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No historical repairs recorded in the digital register yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentRepairs.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{rec.type}</span>
                    <span className="font-mono text-xs text-slate-600 font-bold">
                      ₹{rec.costInr.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    {rec.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Completed: {rec.date}</span>
                    <span className="text-emerald-700 font-bold">
                      Health Impact: {rec.healthScoreBefore} &rarr; {rec.healthScoreAfter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SensorSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        initialRoadId={road.id}
      />
    </div>
  );
};
