import React, { useState, useEffect } from 'react';
import { api, subscribeToDataChanges } from '../../services/api';
import { Contractor, RoadIssue } from '../../types';
import { Users, HardHat, Phone, Mail, Clock, CheckCircle, AlertCircle, Star } from 'lucide-react';

export const AdminContractorsPage: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [issues, setIssues] = useState<RoadIssue[]>([]);

  const loadData = () => {
    setContractors(api.getContractors());
    setIssues(api.getIssues());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Municipal Highway Maintenance Contractors
          </h1>
          <p className="text-xs text-slate-500">
            Work order allocation, SLA resolution metrics, performance ratings, and active workload
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-700">
          Registered Entities: {contractors.length}
        </div>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractors.map((contractor) => {
          // Dynamic calculation of active issues assigned
          const contractorIssues = issues.filter((i) => i.assignedContractorId === contractor.id);
          const activeCount = contractorIssues.filter(
            (i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status)
          ).length;
          const completedCount = contractor.completedIssuesCount;

          return (
            <div
              key={contractor.id}
              className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800">
                      {contractor.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {contractor.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {contractor.company}
                  </h3>
                  <div className="text-xs text-slate-600 font-semibold mt-0.5">
                    Lead Engineer: {contractor.name}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-amber-900 font-mono text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{contractor.rating} / 5.0</span>
                </div>
              </div>

              {/* Contact & Zones */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${contractor.email}`} className="text-blue-700 hover:underline">
                    {contractor.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{contractor.phone}</span>
                </div>
                <div className="pt-1 flex flex-wrap gap-1">
                  {contractor.assignedZones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Workload</span>
                  <span className="text-base font-black font-mono text-amber-700 mt-0.5 block">
                    {activeCount} Jobs
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Completed SLA</span>
                  <span className="text-base font-black font-mono text-emerald-700 mt-0.5 block">
                    {completedCount} Repaired
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Avg Turnaround</span>
                  <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">
                    {contractor.averageResolutionDays} Days
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
