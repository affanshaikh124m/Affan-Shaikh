import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, subscribeToDataChanges } from '../services/api';
import { RoadIssue, IssueStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Search,
  ExternalLink,
} from 'lucide-react';

const TIMELINE_STAGES: { key: IssueStatus | 'AI_ANALYSIS' | 'SUBMITTED'; label: string; description: string }[] = [
  { key: 'SUBMITTED', label: 'Submitted', description: 'Defect logged by citizen with photo & GPS record' },
  { key: 'AI_ANALYSIS', label: 'AI Analysis', description: 'Defect classified & depth estimated' },
  { key: 'VERIFIED', label: 'Verified', description: 'Junior Engineer/Inspector verified on site' },
  { key: 'ASSIGNED', label: 'Assigned', description: 'Work order dispatched to road contractor' },
  { key: 'IN_PROGRESS', label: 'In Progress', description: 'Repair crew active on site' },
  { key: 'RESOLVED', label: 'Completed', description: 'Asphalt/concrete work executed' },
  { key: 'CLOSED', label: 'Closed', description: 'Inspected and certified in municipal ledger' },
];

export const TrackReportPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { currentUser, canVerifyIssues, canAssignContractor, canUpdateRepairStatus } = useAuth();

  const [issue, setIssue] = useState<RoadIssue | undefined>(undefined);
  const [searchId, setSearchId] = useState('');
  const [allIssues, setAllIssues] = useState<RoadIssue[]>([]);

  const loadData = () => {
    if (!issueId) return;
    const item = api.getIssueById(issueId);
    setIssue(item);
    setAllIssues(api.getIssues());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, [issueId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/report/${searchId.trim()}`);
    }
  };

  // Stage calculation
  const getStageIndex = (status?: IssueStatus): number => {
    switch (status) {
      case 'REPORTED':
        return 1; // Submitted + AI Analysis done
      case 'VERIFIED':
        return 2;
      case 'ASSIGNED':
        return 3;
      case 'IN_PROGRESS':
        return 4;
      case 'RESOLVED':
        return 5;
      case 'CLOSED':
        return 6;
      case 'REJECTED':
        return 1;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(issue?.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Municipal Defect Tracking Portal
          </h1>
          <p className="text-xs text-slate-500">
            Real-time public work order lifecycle and verification audit log
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="e.g. ISSUE-2026-000841"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 w-48 sm:w-56"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
          >
            Track
          </button>
        </form>
      </div>

      {!issue ? (
        <div className="bg-white rounded-lg border border-slate-300 p-8 text-center space-y-4">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">
            Ticket ID <span className="font-mono text-slate-900">{issueId}</span> Not Found
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please check the municipal ticket number or select from recent reports below.
          </p>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Recent Monitored Tickets:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {allIssues.slice(0, 4).map((i) => (
                <Link
                  key={i.id}
                  to={`/report/${i.id}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800"
                >
                  {i.id}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Ticket Card */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 rounded">
                    {issue.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Logged: {new Date(issue.reportedAt).toLocaleDateString()} at{' '}
                    {new Date(issue.reportedAt).toLocaleTimeString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1 capitalize">
                  {issue.problemType.replace(/_/g, ' ')} &bull; {issue.roadName}
                </h2>
                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Segment <strong>{issue.roadId}</strong> &mdash; {issue.locationDetails}
                  </span>
                  <Link
                    to={`/road/${issue.roadId}`}
                    className="text-sky-400 hover:underline font-semibold ml-1"
                  >
                    (View Road Record &rarr;)
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black uppercase px-3 py-1.5 rounded tracking-wider border ${
                    issue.status === 'CLOSED' || issue.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : issue.status === 'IN_PROGRESS'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : issue.status === 'ASSIGNED'
                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  STATUS: {issue.status}
                </span>
              </div>
            </div>

            {/* Quick Admin/Contractor Action Bar if authorized */}
            {currentUser.role !== 'CITIZEN' && (
              <div className="bg-slate-800 text-slate-200 px-5 py-2.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Officer Controls ({currentUser.role.replace('_', ' ')}: {currentUser.name})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/issues"
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
                  >
                    Open in Admin Issue Manager &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Vertical Tracking Timeline */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Work Order Tracking Timeline
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:z-0">
                {TIMELINE_STAGES.map((stg, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stg.key} className="flex items-start gap-3.5 relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {stg.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              CURRENT STAGE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {stg.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photos & AI Findings Side by Side */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo & Repair Photo */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Defect Photo Documentation
                </h4>

                <div className="space-y-2">
                  <div className="rounded-lg border border-slate-300 overflow-hidden bg-slate-100">
                    <img
                      src={issue.photoUrl}
                      alt="Defect"
                      className="w-full h-48 object-cover"
                    />
                    <div className="bg-slate-900 text-white text-[11px] p-2 flex items-center justify-between">
                      <span>Inspection Photo (Before Repair)</span>
                      <span className="font-mono text-slate-400">
                        {new Date(issue.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {issue.repairPhotoUrl && (
                    <div className="rounded-lg border border-emerald-300 overflow-hidden bg-emerald-50">
                      <img
                        src={issue.repairPhotoUrl}
                        alt="Repaired"
                        className="w-full h-48 object-cover"
                      />
                      <div className="bg-emerald-900 text-white text-[11px] p-2 flex items-center justify-between">
                        <span className="font-bold">✓ Certified After-Repair Verification Photo</span>
                        <span className="font-mono text-emerald-200">
                          {issue.completedAt ? new Date(issue.completedAt).toLocaleDateString() : 'Completed'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Defect Data & AI Card */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Defect Metadata &amp; AI Analysis
                </h4>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Problem Type:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {issue.problemType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Severity Assessment:</span>
                    <span className="font-bold text-rose-700">{issue.severity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Contractor:</span>
                    <span className="font-bold text-slate-900">
                      {issue.assignedContractorName || 'Pending Allocation'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Immediate Safety Hazard:</span>
                    <span className="font-bold text-slate-900">
                      {issue.isSafetyHazard ? 'Yes (Flagged Critical)' : 'No'}
                    </span>
                  </div>
                </div>

                {issue.aiAnalysis && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Defect Classifier</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-800">
                        {issue.aiAnalysis.confidence}% Confidence
                      </span>
                    </div>
                    <div className="text-slate-700 text-[11px] leading-relaxed">
                      <strong>Observation:</strong> {issue.aiAnalysis.note}
                    </div>
                    <div className="text-slate-700 text-[11px] leading-relaxed">
                      <strong>Recommended Action:</strong> {issue.aiAnalysis.recommendedAction}
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-blue-100 flex items-center justify-between">
                      <span>Area: {issue.aiAnalysis.affectedArea}</span>
                      <span className="font-bold">
                        {issue.aiAnalysis.isSimulated ? 'Simulated data' : 'AI-generated assessment, requires verification'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Citizen Description:</span>
                  <div className="p-2.5 bg-white border border-slate-200 rounded text-slate-800 leading-normal">
                    {issue.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Audit Trail Log */}
            <div className="border-t border-slate-200 p-6 bg-slate-50/40">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Official Municipal Audit Trail
              </h4>

              <div className="space-y-2">
                {issue.auditTrail.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-white rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{log.action}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {log.role}
                        </span>
                      </div>
                      {log.comment && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{log.comment}</p>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()} &bull; {log.user}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
