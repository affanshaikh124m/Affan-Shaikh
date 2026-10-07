import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { api, subscribeToDataChanges } from '../../services/api';
import { RoadSegment, ConditionStatus } from '../../types';
import { ConditionBadge } from '../../components/common/ConditionBadge';
import { HealthScoreRing } from '../../components/common/HealthScoreRing';
import { MapPin, ExternalLink, Layers, Radio, Camera, ArrowRight } from 'lucide-react';

export const AdminMapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');

  const loadData = () => {
    const list = api.getRoads();
    setRoads(list);
    if (!selectedRoad && list.length > 0) {
      setSelectedRoad(list[0]);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    // Mumbai center coordinates
    const map = L.map(mapContainerRef.current, {
      center: [19.076, 72.8777],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; MCGM Roads',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const colorMap: Record<ConditionStatus, string> = {
      GOOD: '#10b981',
      WARNING: '#f59e0b',
      POOR: '#f97316',
      CRITICAL: '#ef4444',
    };

    roads.forEach((road) => {
      if (conditionFilter !== 'ALL' && road.condition !== conditionFilter) return;

      const markerColor = colorMap[road.condition] || '#3b82f6';

      const customIcon = L.divIcon({
        className: 'custom-road-marker',
        html: `
          <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11px; font-weight: bold; color: white;">
            ${road.healthScore}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([road.coordinates.lat, road.coordinates.lng], {
        icon: customIcon,
      });

      marker.on('click', () => {
        setSelectedRoad(road);
      });

      marker.bindTooltip(`<strong>${road.id}</strong>: ${road.name} (${road.condition})`, {
        direction: 'top',
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [roads, conditionFilter]);

  const handleSelectRoad = (road: RoadSegment) => {
    setSelectedRoad(road);
    leafletMapRef.current?.setView([road.coordinates.lat, road.coordinates.lng], 14, {
      animate: true,
    });
  };

  return (
    <div className="space-y-4 font-sans h-full flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Municipal GIS Road Map &amp; Geo-Telemetry
          </h1>
          <p className="text-xs text-slate-500">
            Spatial distribution of monitored road segments with health score overlays
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Condition Filter:</span>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white font-medium"
          >
            <option value="ALL">All Segments (10 Pilot)</option>
            <option value="GOOD">GOOD (80-100)</option>
            <option value="WARNING">WARNING (60-79)</option>
            <option value="POOR">POOR (40-59)</option>
            <option value="CRITICAL">CRITICAL (0-39)</option>
          </select>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
        {/* Interactive Leaflet Map Container (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden relative flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-10" />

          {/* Map Legend Floating Box */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2.5 rounded border border-slate-300 shadow text-[11px] font-sans space-y-1">
            <span className="font-bold text-slate-800 uppercase text-[10px] block">
              Pavement Health Key:
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> GOOD (80-100)
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> WARNING (60-79)
              </span>
              <span className="flex items-center gap-1 font-semibold text-orange-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> POOR (40-59)
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> CRITICAL (0-39)
              </span>
            </div>
          </div>
        </div>

        {/* Selected Road Details Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-300 shadow-xs p-5 flex flex-col justify-between space-y-4">
          {!selectedRoad ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Click any road marker on the map to view live parameters.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedRoad.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedRoad.name}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {selectedRoad.ward} &bull; {selectedRoad.surfaceType}
                  </div>
                </div>

                <ConditionBadge condition={selectedRoad.condition} size="sm" showHealthScore={selectedRoad.healthScore} />
              </div>

              {/* Health Ring Center */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-around">
                <HealthScoreRing score={selectedRoad.healthScore} size={90} strokeWidth={8} showBreakdownLabel={false} />
                <div className="text-xs space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Health Score</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {selectedRoad.healthScore} / 100
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedRoad.openIssuesCount} active issues logged
                  </div>
                </div>
              </div>

              {/* Live IoT Node Preview */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>IoT Sensor ({selectedRoad.iotStatus.deviceId})</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {selectedRoad.iotStatus.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1">
                  <div>Water: <strong>{selectedRoad.iotStatus.water_cm.toFixed(1)} cm</strong></div>
                  <div>Vibration: <strong>{selectedRoad.iotStatus.vibration_g.toFixed(2)} g</strong></div>
                  <div>Light: <strong>{selectedRoad.iotStatus.lux} lux</strong></div>
                  <div>Last Sync: <strong>{selectedRoad.iotStatus.isOnline ? 'Online' : 'Offline'}</strong></div>
                </div>
              </div>

              {/* Quick Road List Selector */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Quick Select Segment:
                </span>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs border border-slate-200 rounded">
                  {roads.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRoad(r)}
                      className={`w-full text-left p-2 flex items-center justify-between transition-colors ${
                        selectedRoad.id === r.id ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-slate-800">{r.id}</span>
                      <span className="text-slate-600 truncate max-w-[140px]">{r.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.healthScore}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to={`/road/${selectedRoad.id}`}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider text-center transition-colors"
                >
                  Open Complete Digital Record &rarr;
                </Link>
                <Link
                  to={`/road/${selectedRoad.id}/report`}
                  className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider text-center transition-colors"
                >
                  Report Defect on this Road
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
