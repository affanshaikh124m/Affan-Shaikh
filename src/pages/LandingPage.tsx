import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, subscribeToDataChanges } from '../services/api';
import { RoadSegment } from '../types';
import { ConditionBadge } from '../components/common/ConditionBadge';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import {
  QrCode,
  Search,
  Camera,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('ALL');

  useEffect(() => {
    setRoads(api.getRoads());
    return subscribeToDataChanges(() => {
      setRoads(api.getRoads());
    });
  }, []);

  const filteredRoads = roads.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWard = selectedWard === 'ALL' || r.ward === selectedWard;
    return matchesSearch && matchesWard;
  });

  const uniqueWards = Array.from(new Set(roads.map((r) => r.ward)));

  // Aggregate stats (including simulated 250 municipal total segments)
  const totalSimulatedSegments = 250;
  const goodCount = roads.filter((r) => r.condition === 'GOOD').length;
  const warningCount = roads.filter((r) => r.condition === 'WARNING').length;
  const poorCount = roads.filter((r) => r.condition === 'POOR').length;
  const criticalCount = roads.filter((r) => r.condition === 'CRITICAL').length;

  const handleQuickJump = (id: string) => {
    navigate(`/road/${id}`);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  return (
    <div className="space-y-10 pb-12 font-sans">
      {/* Hero Civic Banner */}
      <section className="bg-slate-900 text-white border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-slate-800 text-sky-400 px-3 py-1 rounded text-xs font-semibold tracking-wide border border-slate-700">
              <QrCode className="w-4 h-4" />
              <span>Smart Public Works Digital Record System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Municipal Road Management &amp; Citizen Reporting System
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Every municipal road segment is assigned a unique digital record and QR plaque.
              Citizens scan the plaque to inspect pavement health, report potholes with optical AI verification,
              and track repair work orders through verified civic contractors.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/road/MH-MUM-001"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow"
              >
                <span>Inspect Road (MH-MUM-001)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/road/MH-MUM-001/report"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Report Pothole / Defect</span>
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Console</span>
              </Link>
            </div>
          </div>

          {/* Quick Demo Scan Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-lg p-5 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                    Public Road QR Marker
                  </span>
                  <h3 className="text-base font-bold text-slate-900">MH-MUM-001</h3>
                  <p className="text-xs text-slate-600">Marine Drive Promenade Segment A</p>
                </div>
                <ConditionBadge condition="GOOD" size="sm" showHealthScore={87} />
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                <div className="bg-white p-2 rounded border border-slate-300 shrink-0 shadow-xs">
                  <QRCodeSVG
                    value={`${currentHost}#/road/MH-MUM-001`}
                    size={88}
                    level="M"
                  />
                </div>
                <div className="text-xs space-y-1.5 flex-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Point mobile camera or click below</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-tight">
                    Encodes URL <code>#/road/MH-MUM-001</code> for instantaneous field access without typing.
                  </p>
                  <button
                    onClick={() => handleQuickJump('MH-MUM-001')}
                    className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Digital Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secondary Demo for Critical Road */}
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-600">
                  <span className="font-bold text-rose-700">Test Critical Scenario: </span>
                  <span className="font-mono font-semibold">MH-MUM-002</span> (LBS Marg Kurla)
                </div>
                <button
                  onClick={() => handleQuickJump('MH-MUM-002')}
                  className="text-blue-700 hover:text-blue-900 font-bold underline"
                >
                  View Critical Road &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate Municipal Metric Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Citywide Road Network Overview
              </h2>
              <p className="text-xs text-slate-500">
                Brihanmumbai Municipal Infrastructure Telemetry &amp; Surveillance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                Active Segments: 250 (Simulated Aggregate)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded p-3">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Condition: GOOD
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                {Math.round((goodCount / 10) * 250)} <span className="text-xs text-emerald-600 font-sans font-normal">segments</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">Health Score: 80 - 100</div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded p-3">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Condition: WARNING
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono mt-0.5">
                {Math.round((warningCount / 10) * 250)} <span className="text-xs text-amber-600 font-sans font-normal">segments</span>
              </div>
              <div className="text-[11px] text-amber-700 mt-1">Health Score: 60 - 79</div>
            </div>

            <div className="bg-orange-50/70 border border-orange-200 rounded p-3">
              <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
                Condition: POOR
              </div>
              <div className="text-2xl font-black text-orange-700 font-mono mt-0.5">
                {Math.round((poorCount / 10) * 250)} <span className="text-xs text-orange-600 font-sans font-normal">segments</span>
              </div>
              <div className="text-[11px] text-orange-700 mt-1">Health Score: 40 - 59</div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded p-3">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Condition: CRITICAL
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono mt-0.5">
                {Math.round((criticalCount / 10) * 250)} <span className="text-xs text-rose-600 font-sans font-normal">segments</span>
              </div>
              <div className="text-[11px] text-rose-700 mt-1">Health Score: 0 - 39</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Citizen Flow) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Citizen Reporting &amp; Transparency Lifecycle
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Scan Plaque QR</h4>
              <p className="text-xs text-slate-600 leading-normal">
                Road signs host durable QR codes. Scanning instantly pulls up the authoritative digital record, historical repairs, and assigned contractor.
              </p>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Upload Photo &amp; AI Analysis</h4>
              <p className="text-xs text-slate-600 leading-normal">
                Take a photo directly on mobile. Gemini AI classifies the defect (pothole, crack, waterlogging), measures severity, and recommends municipal action.
              </p>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Track Public Timeline</h4>
              <p className="text-xs text-slate-600 leading-normal">
                A public tracking ticket (e.g., ISSUE-2026-001052) is created with a 7-stage verifiable audit log from verification to contractor dispatch.
              </p>
            </div>

            <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Repair &amp; Health Recalculation</h4>
              <p className="text-xs text-slate-600 leading-normal">
                Contractors upload before/after photos upon repair. Health score automatically recalculates and adds an indelible record in the maintenance ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Road Segments Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monitored Municipal Road Segments
            </h2>
            <p className="text-xs text-slate-500">
              Select any segment to inspect its live health score, IoT telemetry, maintenance history, or report a defect.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search road ID, name, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="ALL">All Municipal Wards</option>
              {uniqueWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Roads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoads.map((road) => (
            <div
              key={road.id}
              className="bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                      {road.id}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2 font-semibold">
                      {road.ward} &bull; {road.surfaceType}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {road.name}
                    </h3>
                  </div>
                  <ConditionBadge condition={road.condition} size="sm" showHealthScore={road.healthScore} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {road.locationDescription}
                </p>

                {/* Road Indicators */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Health Score</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {road.healthScore}/100
                    </div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Open Issues</div>
                    <div className={`text-sm font-bold font-mono ${road.openIssuesCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {road.openIssuesCount}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">IoT Node</div>
                    <div className="text-xs font-bold font-mono truncate text-slate-800">
                      {road.iotStatus.isOnline ? `${road.iotStatus.water_cm.toFixed(1)}cm` : 'Offline'}
                    </div>
                  </div>
                </div>

                {road.recurringDefectCount > 2 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2 rounded flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Recurring issue: {road.recurringDefectCount} defects in 120 days</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <Link
                  to={`/road/${road.id}`}
                  className="flex-1 text-center py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold tracking-wide transition-colors"
                >
                  View Digital Record
                </Link>
                <Link
                  to={`/road/${road.id}/report`}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors"
                  title="Report Defect on this road"
                >
                  Report
                </Link>
                <Link
                  to={`/history/${road.id}`}
                  className="py-1.5 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors"
                  title="Maintenance History"
                >
                  History
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
