import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadSegment, ConditionStatus, QRStatus } from '../../types';
import { ConditionBadge } from '../../components/common/ConditionBadge';
import {
  Search,
  Filter,
  QrCode,
  Download,
  RefreshCw,
  ExternalLink,
  Ban,
  CheckCircle,
  AlertTriangle,
  Printer,
  ChevronDown,
} from 'lucide-react';

export const AdminRoadsPage: React.FC = () => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('ALL');
  const [onlyOpenIssues, setOnlyOpenIssues] = useState(false);
  const [activeQrModalRoad, setActiveQrModalRoad] = useState<RoadSegment | null>(null);

  const loadData = () => {
    setRoads(api.getRoads());
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const contractors = api.getContractors();

  const filteredRoads = roads.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.locationDescription.toLowerCase().includes(search.toLowerCase());

    const matchesCondition = conditionFilter === 'ALL' || r.condition === conditionFilter;
    const matchesContractor = contractorFilter === 'ALL' || r.contractorId === contractorFilter;
    const matchesQr = qrStatusFilter === 'ALL' || r.qrStatus === qrStatusFilter;
    const matchesOpen = !onlyOpenIssues || r.openIssuesCount > 0;

    return matchesSearch && matchesCondition && matchesContractor && matchesQr && matchesOpen;
  });

  const handleUpdateQrStatus = (roadId: string, status: QRStatus) => {
    api.updateQRStatus(roadId, status);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const downloadQrCode = (roadId: string) => {
    const svg = document.getElementById(`qr-svg-${roadId}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${roadId}-QR-PLAQUE.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Road Infrastructure &amp; QR Tag Directory
          </h1>
          <p className="text-xs text-slate-500">
            Official municipal asset ledger, condition ratings, and digital QR plaques
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 border border-slate-300 rounded text-slate-700">
            Total Monitored: {roads.length} Segments
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search segment ID, road..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Conditions</option>
            <option value="GOOD">GOOD (80-100)</option>
            <option value="WARNING">WARNING (60-79)</option>
            <option value="POOR">POOR (40-59)</option>
            <option value="CRITICAL">CRITICAL (0-39)</option>
          </select>

          {/* Contractor Filter */}
          <select
            value={contractorFilter}
            onChange={(e) => setContractorFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All Contractors</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>

          {/* QR Status Filter */}
          <select
            value={qrStatusFilter}
            onChange={(e) => setQrStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="ALL">All QR Statuses</option>
            <option value="ACTIVE">ACTIVE Plaque</option>
            <option value="DISABLED">DISABLED Plaque</option>
            <option value="REPLACEMENT_REQUIRED">REPLACEMENT REQUIRED</option>
          </select>

          {/* Only Open Issues Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
            <input
              type="checkbox"
              checked={onlyOpenIssues}
              onChange={(e) => setOnlyOpenIssues(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>With Open Issues Only</span>
          </label>
        </div>
      </div>

      {/* Roads Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 font-bold">Road ID</th>
                <th className="py-3 px-3 font-bold">Segment Name &amp; Ward</th>
                <th className="py-3 px-3 font-bold">Condition</th>
                <th className="py-3 px-3 font-bold">Health</th>
                <th className="py-3 px-3 font-bold">Issues</th>
                <th className="py-3 px-3 font-bold">Last Maint</th>
                <th className="py-3 px-3 font-bold">QR Plaque Status</th>
                <th className="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRoads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No road segments matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRoads.map((road) => (
                  <tr key={road.id} className="hover:bg-slate-50 transition-colors">
                    {/* Road ID */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <Link
                        to={`/road/${road.id}`}
                        className="text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <span>{road.id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>

                    {/* Segment Name & Ward */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{road.name}</div>
                      <div className="text-[11px] text-slate-500">{road.ward} &bull; {road.surfaceType}</div>
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-3">
                      <ConditionBadge condition={road.condition} size="sm" />
                    </td>

                    {/* Health */}
                    <td className="py-3 px-3 font-mono font-bold">
                      <span
                        className={
                          road.healthScore >= 80
                            ? 'text-emerald-700'
                            : road.healthScore >= 60
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }
                      >
                        {road.healthScore}/100
                      </span>
                    </td>

                    {/* Issues */}
                    <td className="py-3 px-3 font-mono">
                      <span className={road.openIssuesCount > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                        {road.openIssuesCount} Open
                      </span>
                      <span className="text-slate-400"> / {road.resolvedIssuesCount} Res</span>
                    </td>

                    {/* Last Maint */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{road.lastMaintenanceDate}</div>
                      <div className="text-[10px] text-slate-400">{road.lastRepairDaysAgo}d ago</div>
                    </td>

                    {/* QR Plaque Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          road.qrStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : road.qrStatus === 'REPLACEMENT_REQUIRED'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {road.qrStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveQrModalRoad(road)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                          title="Generate / Download QR Plaque"
                        >
                          <QrCode className="w-3 h-3 text-sky-400" />
                          <span>QR Plaque</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Management Modal */}
      {activeQrModalRoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Municipal QR Plaque Generator
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeQrModalRoad.id} &mdash; {activeQrModalRoad.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveQrModalRoad(null)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Plaque Card */}
            <div className="border-4 border-slate-900 rounded p-4 text-center space-y-3 bg-white">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1">
                Brihanmumbai Municipal Corporation &bull; Roads Department
              </div>

              <div className="flex justify-center p-2">
                <QRCodeSVG
                  id={`qr-svg-${activeQrModalRoad.id}`}
                  value={`${currentHost}#/road/${activeQrModalRoad.id}`}
                  size={150}
                  level="H"
                />
              </div>

              <div>
                <div className="font-mono text-xl font-black text-slate-900 tracking-tight">
                  {activeQrModalRoad.id}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  Scan to View Digital Health Record &amp; Report Defects
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  URL: {currentHost}#/road/{activeQrModalRoad.id}
                </div>
              </div>
            </div>

            {/* QR Status Controls */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider block">
                Manage Plaque Lifecycle:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateQrStatus(activeQrModalRoad.id, 'ACTIVE')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-xs uppercase ${
                    activeQrModalRoad.qrStatus === 'ACTIVE'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateQrStatus(activeQrModalRoad.id, 'REPLACEMENT_REQUIRED')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-xs uppercase ${
                    activeQrModalRoad.qrStatus === 'REPLACEMENT_REQUIRED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Damaged
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateQrStatus(activeQrModalRoad.id, 'DISABLED')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-xs uppercase ${
                    activeQrModalRoad.qrStatus === 'DISABLED'
                      ? 'bg-rose-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Disable
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => downloadQrCode(activeQrModalRoad.id)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable PNG</span>
              </button>
              <button
                onClick={() => setActiveQrModalRoad(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
