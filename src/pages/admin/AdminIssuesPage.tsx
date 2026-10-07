import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadIssue, IssueStatus, IssueSeverity, Contractor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  UserCheck,
  HardHat,
  MessageSquare,
  Camera,
  ExternalLink,
  ChevronRight,
  Shield,
  Upload,
} from 'lucide-react';

const SAMPLE_AFTER_REPAIR_PHOTOS = [
  'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
];

export const AdminIssuesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<RoadIssue | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Status update form inside modal or drawer
  const [newStatus, setNewStatus] = useState<IssueStatus>('VERIFIED');
  const [newSeverity, setNewSeverity] = useState<IssueSeverity>('HIGH');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');
  const [repairPhotoUrl, setRepairPhotoUrl] = useState('');

  const loadData = () => {
    const all = api.getIssues();
    setIssues(all);
    setContractors(api.getContractors());
    if (selectedIssue) {
      const refreshed = api.getIssueById(selectedIssue.id);
      if (refreshed) setSelectedIssue(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.roadId.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleOpenIssue = (issue: RoadIssue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setNewSeverity(issue.severity);
    setSelectedContractorId(issue.assignedContractorId || '');
    setStatusComment('');
    setRepairPhotoUrl(issue.repairPhotoUrl || '');
  };

  const handleSaveStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    api.updateIssueStatus({
      issueId: selectedIssue.id,
      newStatus,
      user: currentUser.name,
      role: currentUser.role,
      comment: statusComment || `Status updated to ${newStatus}`,
      contractorId: selectedContractorId || undefined,
      repairPhotoUrl: repairPhotoUrl || undefined,
      overrideSeverity: newSeverity,
    });

    const updated = api.getIssueById(selectedIssue.id);
    if (updated) setSelectedIssue(updated);
    setStatusComment('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Citizen Defect &amp; Work Order Triage
          </h1>
          <p className="text-xs text-slate-500">
            Review optical AI classifications, assign contractors, and certify repair closures
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-700">
          Total Registered Tickets: {issues.length}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ticket ID, road ID, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="REPORTED">REPORTED (New)</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Main Grid: Issues List (Left) + Detail & Action Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issues Table (Left - 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Ticket ID</th>
                  <th className="py-3 px-3 font-bold">Road ID</th>
                  <th className="py-3 px-3 font-bold">Defect Type</th>
                  <th className="py-3 px-3 font-bold">Severity</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold">Reported</th>
                  <th className="py-3 px-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No issues found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <tr
                        key={issue.id}
                        onClick={() => handleOpenIssue(issue)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {issue.id}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {issue.roadId}
                        </td>
                        <td className="py-3 px-3 capitalize text-slate-800">
                          {issue.problemType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold font-mono text-[11px] ${
                              issue.severity === 'CRITICAL'
                                ? 'text-rose-700'
                                : issue.severity === 'HIGH'
                                ? 'text-orange-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              issue.status === 'CLOSED' || issue.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : issue.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : issue.status === 'ASSIGNED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(issue.reportedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenIssue(issue);
                            }}
                            className="text-xs text-blue-700 hover:underline font-bold"
                          >
                            Inspect &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Issue Review & Action Panel (Right - 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          {!selectedIssue ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Select any defect ticket from the table to inspect details, AI findings, and execute work order transitions.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedIssue.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 capitalize mt-1">
                    {selectedIssue.problemType.replace(/_/g, ' ')} &bull; {selectedIssue.roadId}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Reported on {new Date(selectedIssue.reportedAt).toLocaleString()}
                  </div>
                </div>

                <Link
                  to={`/report/${selectedIssue.id}`}
                  className="text-[11px] text-blue-700 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Public View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Photo Preview & AI Assessment */}
              <div className="space-y-2">
                <div className="rounded border border-slate-300 overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center">
                  <img
                    src={selectedIssue.photoUrl}
                    alt="Defect on site"
                    className="max-h-48 w-full object-cover"
                  />
                </div>

                {selectedIssue.aiAnalysis && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Defect Classifier</span>
                      </span>
                      <span className="text-[10px] text-blue-700">
                        {selectedIssue.aiAnalysis.confidence}% Confidence
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug">
                      <strong>AI Note:</strong> {selectedIssue.aiAnalysis.note}
                    </p>
                    <p className="text-[11px] text-slate-700 leading-snug">
                      <strong>Recommended:</strong> {selectedIssue.aiAnalysis.recommendedAction}
                    </p>
                    <div className="text-[10px] text-slate-500 italic">
                      {selectedIssue.aiAnalysis.isSimulated
                        ? 'Simulated data'
                        : 'AI-generated assessment, requires verification'}
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen Description */}
              <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Citizen Description:</span>
                <p className="text-slate-800 mt-0.5">{selectedIssue.description}</p>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleSaveStatusChange} className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Update Work Order Status &amp; Contractor
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      New Status:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-semibold bg-white"
                    >
                      <option value="REPORTED">REPORTED</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Severity:
                    </label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as IssueSeverity)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-semibold bg-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                {/* Assign Contractor */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Assign Maintenance Contractor:
                  </label>
                  <select
                    value={selectedContractorId}
                    onChange={(e) => setSelectedContractorId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="">-- Select Contractor --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} &bull; {c.company} ({c.activeIssuesCount} active)
                      </option>
                    ))}
                  </select>
                </div>

                {/* After Repair Photo (Shown if moving to RESOLVED or CLOSED) */}
                {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded space-y-2 text-xs">
                    <label className="block font-bold text-emerald-950 uppercase text-[10px]">
                      Certified After-Repair Photo (Mandatory for Closure):
                    </label>
                    <input
                      type="text"
                      placeholder="Enter photo URL or select sample below"
                      value={repairPhotoUrl}
                      onChange={(e) => setRepairPhotoUrl(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-emerald-300 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-800 font-semibold">Select Sample:</span>
                      {SAMPLE_AFTER_REPAIR_PHOTOS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRepairPhotoUrl(url)}
                          className="text-[10px] px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-900 font-bold hover:bg-emerald-100"
                        >
                          Asphalt Patch #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officer Comment */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Audit Comment / Action Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Enter inspection findings, work order instructions, or closure verification..."
                    className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                >
                  Save Status &amp; Log to Audit Ledger
                </button>
              </form>

              {/* Audit Log Trail */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Official Audit Trail ({selectedIssue.auditTrail.length} entries):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedIssue.auditTrail.map((log) => (
                    <div key={log.id} className="text-[11px] p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{log.action}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {log.comment && <p className="text-slate-600 mt-0.5">{log.comment}</p>}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        By {log.user} ({log.role})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
