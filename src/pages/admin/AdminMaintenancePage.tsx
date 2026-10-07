import React, { useState, useEffect } from 'react';
import { api, subscribeToDataChanges } from '../../services/api';
import { MaintenanceRecord, RoadSegment, Contractor } from '../../types';
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  ExternalLink,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const AdminMaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [roadFilter, setRoadFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Record Form State
  const [formRoadId, setFormRoadId] = useState('MH-MUM-001');
  const [formType, setFormType] = useState<MaintenanceRecord['type']>('Pothole Patching');
  const [formContractorId, setFormContractorId] = useState('');
  const [formCostInr, setFormCostInr] = useState('35000');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formBeforePhoto, setFormBeforePhoto] = useState('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
  const [formAfterPhoto, setFormAfterPhoto] = useState('https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80');

  const loadData = () => {
    setRecords(api.getMaintenanceRecords());
    setRoads(api.getRoads());
    const cList = api.getContractors();
    setContractors(cList);
    if (!formContractorId && cList.length > 0) {
      setFormContractorId(cList[0].id);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.roadId.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());

    const matchesRoad = roadFilter === 'ALL' || r.roadId === roadFilter;
    return matchesSearch && matchesRoad;
  });

  const totalSpend = records.reduce((sum, r) => sum + r.costInr, 0);

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const road = api.getRoadById(formRoadId);
    const contractor = api.getContractorById(formContractorId);
    if (!road) return;

    api.createMaintenanceRecord({
      roadId: formRoadId,
      roadName: road.name,
      date: formDate,
      type: formType,
      contractorId: formContractorId,
      contractorName: contractor?.company || road.contractorName,
      costInr: Number(formCostInr) || 30000,
      description: formDescription || `Scheduled maintenance work on ${road.name}`,
      status: 'COMPLETED',
      beforePhotoUrl: formBeforePhoto,
      afterPhotoUrl: formAfterPhoto,
      healthScoreBefore: road.healthScore,
      healthScoreAfter: Math.min(100, road.healthScore + 16),
      warrantyPeriodMonths: 12,
    });

    setIsAddModalOpen(false);
    setFormDescription('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Municipal Road Maintenance &amp; Repair Registry
          </h1>
          <p className="text-xs text-slate-500">
            Work order execution, photographic before/after audits, and health score impacts
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Maintenance Record</span>
        </button>
      </div>

      {/* Aggregate Spend Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Citywide Maintenance Spend
          </span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
            ₹{totalSpend.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search record ID, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <select
            value={roadFilter}
            onChange={(e) => setRoadFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Road Segments</option>
            {roads.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} - {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Maintenance Records Table with Before/After Photos */}
      <div className="space-y-4">
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {rec.id}
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {rec.roadId}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Linked Issue Ticket</span>
                  <span className="font-bold font-mono text-blue-700 mt-0.5 block">
                    {rec.relatedIssueId || 'Routine Scheduled'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded border border-slate-300 overflow-hidden bg-slate-100">
                  <img
                    src={rec.beforePhotoUrl}
                    alt="Before Repair"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 bg-slate-900 text-white text-[11px] font-bold flex items-center justify-between">
                    <span>BEFORE REPAIR</span>
                    <span className="text-rose-400 font-semibold">Defect On Site</span>
                  </div>
                </div>

                <div className="rounded border border-emerald-300 overflow-hidden bg-emerald-50">
                  {rec.afterPhotoUrl ? (
                    <>
                      <img
                        src={rec.afterPhotoUrl}
                        alt="After Repair"
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-2 bg-emerald-900 text-white text-[11px] font-bold flex items-center justify-between">
                        <span>AFTER REPAIR</span>
                        <span className="text-emerald-300 font-semibold">Certified Rectification</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-semibold">
                      After-repair photo pending field inspection
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Maintenance Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Log Certified Road Maintenance Entry
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Road Segment:
                  </label>
                  <select
                    value={formRoadId}
                    onChange={(e) => setFormRoadId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 font-semibold bg-white"
                  >
                    {roads.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} ({r.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Repair Type:
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-1.5 font-semibold bg-white"
                  >
                    <option value="Pothole Patching">Pothole Patching</option>
                    <option value="Resurfacing">Resurfacing</option>
                    <option value="Cracks Sealing">Cracks Sealing</option>
                    <option value="Structural Repair">Structural Repair</option>
                    <option value="Drainage Desilting">Drainage Desilting</option>
                    <option value="Emergency Remediation">Emergency Remediation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Contractor:
                  </label>
                  <select
                    value={formContractorId}
                    onChange={(e) => setFormContractorId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  >
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Cost in INR (₹):
                  </label>
                  <input
                    type="number"
                    value={formCostInr}
                    onChange={(e) => setFormCostInr(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                  Description of Works:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details of bituminous mix, compaction, and area covered..."
                  className="w-full border border-slate-300 rounded p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Before Photo URL:
                  </label>
                  <input
                    type="text"
                    value={formBeforePhoto}
                    onChange={(e) => setFormBeforePhoto(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    After Photo URL:
                  </label>
                  <input
                    type="text"
                    value={formAfterPhoto}
                    onChange={(e) => setFormAfterPhoto(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold uppercase text-xs tracking-wider"
                >
                  Save &amp; Recalculate Health
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
