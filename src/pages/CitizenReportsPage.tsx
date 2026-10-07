import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, subscribeToDataChanges } from '../services/api';
import { RoadIssue } from '../types';
import { FileText, Search, Clock, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const CitizenReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [allIssues, setAllIssues] = useState<RoadIssue[]>([]);
  const [myIssues, setMyIssues] = useState<RoadIssue[]>([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setAllIssues(api.getIssues());
    setMyIssues(api.getMyReports());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const displayedList = activeTab === 'all' ? allIssues : myIssues;

  const filtered = displayedList.filter((i) => {
    return (
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.roadId.toLowerCase().includes(search.toLowerCase()) ||
      i.problemType.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Public Citizen Defect Reports Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Transparent public work orders. Displays only ticket ID, problem category, severity, relative time, and status.
          </p>
        </div>

        <Link
          to="/road/MH-MUM-001/report"
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider text-center"
        >
          + File New Report
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Public Reports ({allIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'my'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Reports ({myIssues.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search ticket ID or defect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded"
          />
        </div>
      </div>

      {/* Table list - strict zero personal data public view */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-bold">Ticket ID</th>
              <th className="py-3 px-4 font-bold">Road ID</th>
              <th className="py-3 px-4 font-bold">Defect Type</th>
              <th className="py-3 px-4 font-bold">Severity</th>
              <th className="py-3 px-4 font-bold">Reported</th>
              <th className="py-3 px-4 font-bold">Lifecycle Status</th>
              <th className="py-3 px-4 font-bold text-right">Track</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  {activeTab === 'my'
                    ? "You haven't submitted any reports yet on this browser."
                    : 'No public reports found.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {item.roadId}
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-800">
                    {item.problemType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span
                      className={`text-[11px] font-mono ${
                        item.severity === 'CRITICAL'
                          ? 'text-rose-700'
                          : item.severity === 'HIGH'
                          ? 'text-orange-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(item.reportedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.status === 'CLOSED' || item.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'ASSIGNED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/report/${item.id}`}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center justify-end gap-1"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
