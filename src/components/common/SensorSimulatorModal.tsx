import React, { useState, useEffect } from 'react';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadSegment } from '../../types';
import { Activity, AlertTriangle, Droplets, Radio, CheckCircle, WifiOff } from 'lucide-react';

interface SensorSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoadId?: string;
}

export const SensorSimulatorModal: React.FC<SensorSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialRoadId = 'MH-MUM-001',
}) => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<string>(initialRoadId);
  const [activePreset, setActivePreset] = useState<'NORMAL' | 'WARNING' | 'WATERLOGGING' | 'FAULT'>('NORMAL');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setRoads(api.getRoads());
    return subscribeToDataChanges(() => {
      setRoads(api.getRoads());
    });
  }, []);

  useEffect(() => {
    if (initialRoadId) {
      setSelectedRoadId(initialRoadId);
    }
  }, [initialRoadId]);

  if (!isOpen) return null;

  const currentRoad = roads.find((r) => r.id === selectedRoadId) || roads[0];

  const handleApplyPreset = (preset: 'NORMAL' | 'WARNING' | 'WATERLOGGING' | 'FAULT') => {
    if (!currentRoad) return;
    setActivePreset(preset);
    api.updateIoTSensorReading(currentRoad.id, preset);
    setFeedback(`Applied ${preset} telemetry to segment ${currentRoad.id}. Road health score recalculated.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            <div>
              <h3 className="text-base font-bold tracking-tight">IoT Road Sensor Simulator</h3>
              <p className="text-xs text-slate-300">
                Simulated real-time pavement telemetry node
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-2.5 text-xs flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider">
              Simulation environment active
            </span>
            <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px] font-bold">
              Simulated data
            </span>
          </div>

          {/* Road Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Target Road Segment:
            </label>
            <select
              value={selectedRoadId}
              onChange={(e) => setSelectedRoadId(e.target.value)}
              className="w-full text-sm font-medium border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {roads.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.name} ({r.condition}, Health: {r.healthScore})
                </option>
              ))}
            </select>
          </div>

          {/* Current Live Readings for Road */}
          {currentRoad && (
            <div className="bg-slate-50 rounded border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Node ID: <code className="font-mono text-slate-900">{currentRoad.iotStatus.deviceId}</code></span>
                <span
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                    currentRoad.iotStatus.isOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${currentRoad.iotStatus.isOnline ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                  {currentRoad.iotStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Water Depth</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {currentRoad.iotStatus.water_cm.toFixed(1)} cm
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Vibration</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {currentRoad.iotStatus.vibration_g.toFixed(2)} g
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Ambient Light</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {currentRoad.iotStatus.lux} lux
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Presets Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Trigger Telemetry Scenario:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('NORMAL')}
                className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-left transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Normal Condition</div>
                  <div className="text-[11px] text-slate-500">Water 0.1cm | Vib 0.08g | 560 lux</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('WARNING')}
                className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/50 text-left transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Vibration Warning</div>
                  <div className="text-[11px] text-slate-500">Deflection risk (0.58g peak)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('WATERLOGGING')}
                className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-left transition-colors"
              >
                <Droplets className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">3. Waterlogging Flood</div>
                  <div className="text-[11px] text-slate-500">Water &gt;12cm | Drain overflow</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('FAULT')}
                className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:border-rose-500 bg-white hover:bg-rose-50/50 text-left transition-colors"
              >
                <WifiOff className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">4. Sensor Fault / Offline</div>
                  <div className="text-[11px] text-slate-500">Node timeout | Power failure</div>
                </div>
              </button>
            </div>
          </div>

          {feedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-2.5 rounded font-medium">
              ✓ {feedback}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Readings are indicators needing validation, not structural diagnoses.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
