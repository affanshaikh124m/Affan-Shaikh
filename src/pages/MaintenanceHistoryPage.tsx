import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, subscribeToDataChanges } from '../services/api';
import { RoadSegment, MaintenanceRecord } from '../types';
import { ConditionBadge } from '../components/common/ConditionBadge';
import {
  History,
  ArrowLeft,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const MaintenanceHistoryPage: React.FC = () => {
  const { roadId } = useParams<{ roadId: string }>();
  const [road, setRoad] = useState<RoadSegment | undefined>(undefined);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);

  const loadData = () => {
    if (!roadId) return;
    setRoad(api.getRoadById(roadId));
    setRecords(api.getMaintenanceRecords(roadId));
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, [roadId]);

  if (!road) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Road Not Found</h2>
        <Link to="/" className="text-xs text-blue-700 font-bold underline mt-2 block">
          &larr; Return to directory
        </Link>
      </div>
    );
  }

  const totalSpend = records.reduce((sum, r) => sum + r.costInr, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to={`/road/${road.id}`} className="hover:text-slate-900 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {road.id} Digital Record</span>
        </Link>
        <span className="font-mono text-slate-400">Ledger: Municipal Works</span>
      </div>

      {/* Road Summary Banner */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
              {road.id}
            </span>
            <span className="text-xs text-slate-500">{road.ward} &bull; {road.surfaceType}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Official Maintenance &amp; Repair History
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">{road.locationDescription}</p>
        </div>

        <div className="flex items-center gap-3">
          <ConditionBadge condition={road.condition} size="md" showHealthScore={road.healthScore} />
        </div>
      </div>

      {/* Aggregate Spend Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total Municipal Expenditure
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across {records.length} registered repair contracts</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Last Completed Repair
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {road.lastMaintenanceDate}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{road.lastRepairDaysAgo} days since last asphalt work</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Recurring Defect Frequency
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {road.recurringDefectCount > 0 ? `${road.recurringDefectCount} incidents` : 'None (Stable)'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg interval: {road.averageDaysBetweenRepairs} days between repairs
          </div>
        </div>
      </div>

      {/* Recurring Failure Notice if applicable */}
      {road.recurringDefectCount > 2 && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-900 uppercase tracking-wider block">
              Repeated Pavement Remediation Alert
            </span>
            <p className="text-rose-800 mt-0.5 leading-normal">
              This segment has required <strong>{road.recurringDefectCount} interventions</strong> within the past 180 days.
              Continuous patching has failed to arrest subgrade movement. An engineering audit for complete bituminous milling and sub-base reconstruction is warranted.
            </p>
          </div>
        </div>
      )}

      {/* Historical Records List with Before & After Photo Comparison */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Certified Repair Records Ledger ({records.length})
        </h2>

        {records.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
            No historical maintenance work orders logged for this road segment yet.
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                      {rec.id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{rec.type}</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {rec.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ₹{rec.costInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 font-mono">{rec.date}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50/70 p-3 rounded border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Executing Contractor</span>
                      <span className="font-bold text-slate-900 mt-0.5 block truncate">{rec.contractorName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Health Score Shift</span>
                      <span className="font-bold text-emerald-700 font-mono mt-0.5 block">
                        {rec.healthScoreBefore} &rarr; {rec.healthScoreAfter} (+{rec.healthScoreAfter - rec.healthScoreBefore} pts)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Contractor Guarantee</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{rec.warrantyPeriodMonths} Months</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Linked Citizen Ticket</span>
                      <span className="font-bold font-mono text-blue-700 mt-0.5 block">
                        {rec.relatedIssueId || 'Routine Scheduled'}
                      </span>
                    </div>
                  </div>

                  {/* Before and After Photos Side-by-Side */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                      Photographic Verification (Before vs After Repair Execution):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="rounded border border-slate-300 overflow-hidden bg-slate-100">
                        <img
                          src={rec.beforePhotoUrl}
                          alt="Before Repair"
                          className="w-full h-44 object-cover"
                        />
                        <div className="p-2 bg-slate-900 text-white text-[11px] font-bold flex items-center justify-between">
                          <span>BEFORE REPAIR</span>
                          <span className="text-rose-400 font-semibold">Defect On Site</span>
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="rounded border border-emerald-300 overflow-hidden bg-emerald-50">
                        {rec.afterPhotoUrl ? (
                          <>
                            <img
                              src={rec.afterPhotoUrl}
                              alt="After Repair"
                              className="w-full h-44 object-cover"
                            />
                            <div className="p-2 bg-emerald-900 text-white text-[11px] font-bold flex items-center justify-between">
                              <span>AFTER REPAIR</span>
                              <span className="text-emerald-300 font-semibold">Certified Rectification</span>
                            </div>
                          </>
                        ) : (
                          <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-semibold">
                            After-repair photo pending field inspection
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
