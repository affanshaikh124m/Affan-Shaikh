import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { analyzeRoadImage } from '../services/aiService';
import {
  AIAnalysisResult,
  IssueSeverity,
  ProblemType,
  RoadSegment,
} from '../types';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

const SAMPLE_ROAD_IMAGES = [
  {
    label: 'Pothole Crater (Demo Photo)',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    name: 'pothole_asphalt.jpg',
  },
  {
    label: 'Monsoon Waterlogging (Demo Photo)',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80',
    name: 'road_waterlogging_flood.jpg',
  },
  {
    label: 'Surface Fatigue Cracks (Demo Photo)',
    url: 'https://images.unsplash.com/photo-1578873375972-0498bce1ff03?auto=format&fit=crop&w=800&q=80',
    name: 'surface_cracks_bitumen.jpg',
  },
];

export const ReportIssuePage: React.FC = () => {
  const { roadId } = useParams<{ roadId: string }>();
  const navigate = useNavigate();

  const [road, setRoad] = useState<RoadSegment | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Form Fields (prefilled)
  const [problemType, setProblemType] = useState<ProblemType>('pothole');
  const [severity, setSeverity] = useState<IssueSeverity>('HIGH');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Safety Hazard & Confirmation
  const [isSafetyHazard, setIsSafetyHazard] = useState(false);
  const [showHazardConfirmModal, setShowHazardConfirmModal] = useState(false);
  const [hazardConfirmed, setHazardConfirmed] = useState(false);

  // GPS Check (Optional)
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'CHECKING' | 'VERIFIED' | 'MISMATCH'>('IDLE');
  const [gpsDistanceMeters, setGpsDistanceMeters] = useState<number | null>(null);

  // Rate Limiting & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roadId) return;
    const r = api.getRoadById(roadId);
    if (!r) {
      navigate('/');
      return;
    }
    setRoad(r);
  }, [roadId, navigate]);

  // Handle Photo Selection with Validation
  const processFile = async (file: File) => {
    setFileError(null);

    // Validate type: JPG/PNG/WebP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Invalid file format. Please upload JPG, PNG, or WebP images only.');
      return;
    }

    // Validate size: max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('Image file is too large. Maximum allowed size is 5 MB.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setPhotoBase64(base64);

      // Trigger AI Analysis
      await runAiAnalysis(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sample: typeof SAMPLE_ROAD_IMAGES[0]) => {
    setFileError(null);
    setFileName(sample.name);
    setPhotoPreview(sample.url);

    // Convert sample url to base64 or run AI analysis directly
    setIsAnalyzing(true);
    try {
      // Create quick canvas representation or simulate
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPhotoBase64(base64);
        await runAiAnalysis(base64, sample.name);
      };
      reader.readAsDataURL(blob);
    } catch {
      await runAiAnalysis('', sample.name);
    }
  };

  const runAiAnalysis = async (base64: string, name: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const result = await analyzeRoadImage(base64, name);
      setAiAnalysis(result);
      // Pre-fill editable problem type and severity from AI
      setProblemType(result.problemType);
      setSeverity(result.severity);

      // Pre-fill smart description if empty
      if (!description) {
        setDescription(
          `${result.problemType.replace(/_/g, ' ').toUpperCase()} observed on roadway. ${result.note} Recommended remedial work: ${result.recommendedAction}`
        );
      }

      if (result.severity === 'CRITICAL') {
        setIsSafetyHazard(true);
        setHazardConfirmed(true);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Optional GPS verification
  const handleVerifyGps = () => {
    if (!navigator.geolocation || !road) return;
    setGpsStatus('CHECKING');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Compute approximate distance in meters
        const lat1 = pos.coords.latitude;
        const lon1 = pos.coords.longitude;
        const lat2 = road.coordinates.lat;
        const lon2 = road.coordinates.lng;

        const R = 6371e3; // metres
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = Math.round(R * c);

        setGpsDistanceMeters(distance);
        if (distance < 5000) {
          setGpsStatus('VERIFIED');
        } else {
          setGpsStatus('MISMATCH');
        }
      },
      () => {
        setGpsStatus('IDLE');
        alert('Could not retrieve device GPS coordinates. GPS verification is optional and not required to submit.');
      },
      { timeout: 8000 }
    );
  };

  const handleHazardToggle = (checked: boolean) => {
    if (checked) {
      setShowHazardConfirmModal(true);
    } else {
      setIsSafetyHazard(false);
      setHazardConfirmed(false);
    }
  };

  const handleConfirmHazard = () => {
    setIsSafetyHazard(true);
    setHazardConfirmed(true);
    setShowHazardConfirmModal(false);
    setSeverity('CRITICAL');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!road) return;

    if (!photoPreview) {
      setSubmitError('Please attach or take a photo of the road defect.');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Please provide a short description of the defect.');
      return;
    }

    // Rate Limiting Check
    const rateCheck = api.checkCanSubmitReport();
    if (!rateCheck.allowed) {
      setSubmitError(
        `Anti-spam limit active. Please wait ${rateCheck.remainingSeconds} seconds before submitting another report.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const fallbackAi: AIAnalysisResult = aiAnalysis || {
        problemType,
        confidence: 90,
        severity,
        affectedArea: 'Approx 1.0m x 1.0m',
        recommendedAction: 'Standard municipal inspection and patching',
        note: 'Reported by citizen through field portal',
        isSimulated: true,
        analyzedAt: new Date().toISOString(),
      };

      const createdIssue = api.createIssue({
        roadId: road.id,
        roadName: road.name,
        locationDetails: road.locationDescription,
        problemType,
        severity,
        description: description.trim(),
        status: 'REPORTED',
        photoUrl: photoPreview,
        aiAnalysis: fallbackAi,
        isSafetyHazard,
        hazardConfirmed,
        isPublicAnonymous: isAnonymous,
        reporterName: isAnonymous ? 'Anonymous Citizen' : reporterName || 'Concerned Citizen',
        reporterContact: isAnonymous ? undefined : reporterPhone || undefined,
        gpsCoordinates:
          gpsStatus === 'VERIFIED'
            ? { lat: road.coordinates.lat, lng: road.coordinates.lng, verified: true }
            : undefined,
      });

      api.recordReportSubmitted();

      // Redirect immediately to issue tracking page
      navigate(`/report/${createdIssue.id}`);
    } catch (err: any) {
      setSubmitError(err?.message || 'Error saving report. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!road) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      {/* Header Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to={`/road/${road.id}`} className="hover:text-slate-900 flex items-center gap-1 font-semibold">
          &larr; Back to {road.id} Record
        </Link>
        <span className="font-mono text-slate-400">Step: Defect Lodgement</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        {/* Form Title Banner */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-4 h-4" />
            <span>Citizen Defect Lodgement &bull; Municipal Works</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Report Road Infrastructure Defect
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Segment: <strong>{road.id} &mdash; {road.name}</strong> ({road.ward})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Photo Capture / Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Attach Photo of Defect</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                JPG, PNG, WebP (Max 5 MB)
              </span>
            </div>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />

            {/* Photo Action Buttons */}
            {!photoPreview ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-4 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo (Mobile Camera)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload from Device</span>
                  </button>
                </div>

                {/* Sample Photos for Testing */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-2">
                    Or select a sample photo for quick evaluation:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {SAMPLE_ROAD_IMAGES.map((sample) => (
                      <button
                        key={sample.name}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 rounded font-medium text-slate-700 hover:border-blue-500 transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg border border-slate-300 overflow-hidden bg-slate-900 max-h-72 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Defect preview"
                    className="max-h-72 w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setAiAnalysis(null);
                      }}
                      className="bg-slate-900/80 hover:bg-slate-900 text-white text-xs px-2.5 py-1 rounded font-semibold backdrop-blur-xs"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs font-medium">
                {fileError}
              </div>
            )}
          </div>

          {/* AI Defect Assessment Card */}
          {isAnalyzing && (
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  Municipal Optical AI Processing Active...
                </div>
                <div className="text-slate-500">
                  Scanning surface geometry, estimating depth footprint, and classifying defect hazard.
                </div>
              </div>
            </div>
          )}

          {aiAnalysis && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                    AI Defect Inspection Assessment
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                  {aiAnalysis.isSimulated
                    ? 'AI-generated assessment (Simulated fallback)'
                    : 'AI-generated assessment, requires verification'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-blue-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Detected Defect</div>
                  <div className="text-xs font-bold text-slate-900 capitalize mt-0.5">
                    {aiAnalysis.problemType.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-blue-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence</div>
                  <div className="text-xs font-bold font-mono text-blue-700 mt-0.5">
                    {aiAnalysis.confidence}%
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-blue-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Severity</div>
                  <div className="text-xs font-bold font-mono text-rose-700 mt-0.5">
                    {aiAnalysis.severity}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-blue-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Dimensions</div>
                  <div className="text-[11px] font-medium text-slate-800 mt-0.5 truncate" title={aiAnalysis.affectedArea}>
                    {aiAnalysis.affectedArea}
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-blue-200 text-xs space-y-1">
                <div className="text-slate-800">
                  <strong>Engineering Note:</strong> {aiAnalysis.note}
                </div>
                <div className="text-slate-600 text-[11px]">
                  <strong>Recommended Action:</strong> {aiAnalysis.recommendedAction}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Citizen may override defect classification and severity below if needed.</span>
                <span className="font-mono text-slate-400">Model: {aiAnalysis.modelUsed || 'gemini-3.8-flash'}</span>
              </div>
            </div>
          )}

          {/* Step 2: Defect Classification & Severity (Citizen overrides permitted) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Defect Category:
              </label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value as ProblemType)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="pothole">Pothole / Crater</option>
                <option value="crack">Surface Crack / Alligator Cracking</option>
                <option value="surface_damage">Surface Damage / Rutting / Ravelling</option>
                <option value="waterlogging">Waterlogging / Drainage Flooding</option>
                <option value="damaged_divider_structure">Damaged Divider / Railing / Barrier</option>
                <option value="broken_streetlight">Broken Streetlight / Dark Spot</option>
                <option value="damaged_drainage">Damaged Stormwater Grate / Culvert</option>
                <option value="debris">Debris / Hazardous Obstruction</option>
                <option value="other">Other Roadway Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity Level:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="LOW">LOW &mdash; Minor cosmetic or slight wear</option>
                <option value="MEDIUM">MEDIUM &mdash; Noticeable defect, moderate traffic effect</option>
                <option value="HIGH">HIGH &mdash; Urgent repair needed, vehicle risk</option>
                <option value="CRITICAL">CRITICAL &mdash; Extreme safety hazard, accident risk</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Defect Description &amp; Landmark Details:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact landmarks, lane orientation, or hazard specifics..."
              className="w-full text-xs border border-slate-300 rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Safety Hazard Checkbox */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isSafetyHazard}
                onChange={(e) => handleHazardToggle(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-bold text-rose-900 uppercase tracking-wider">
                  Flag as Immediate Safety Hazard
                </span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Check if defect poses immediate tipping risk to two-wheelers, pedestrians, or active vehicular collision. Triggers municipal priority queue escalation.
                </p>
              </div>
            </label>

            {hazardConfirmed && (
              <div className="text-[11px] text-rose-700 font-semibold pl-6">
                ✓ Confirmed: Marked as Critical Safety Hazard
              </div>
            )}
          </div>

          {/* Optional GPS Location Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>Geographic Location Verification (Optional)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                GPS check compares your device location with road coordinates. GPS is never required.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {gpsStatus === 'IDLE' && (
                <button
                  type="button"
                  onClick={handleVerifyGps}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100"
                >
                  Verify GPS
                </button>
              )}
              {gpsStatus === 'CHECKING' && (
                <span className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking GPS...
                </span>
              )}
              {gpsStatus === 'VERIFIED' && (
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Location Verified
                </span>
              )}
              {gpsStatus === 'MISMATCH' && (
                <span className="text-amber-700 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Mismatch ({gpsDistanceMeters ? `${(gpsDistanceMeters / 1000).toFixed(1)}km` : ''}) - Allowed
                </span>
              )}
            </div>
          </div>

          {/* Reporter Contact Info */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reporter Details (Optional)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-slate-800"
                />
                <span>Submit Anonymously</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Citizen Name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="text-xs border border-slate-300 rounded px-3 py-2"
                />
                <input
                  type="tel"
                  placeholder="Contact Mobile Number (e.g. +91 98200 ...)"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="text-xs border border-slate-300 rounded px-3 py-2"
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Public tracking lists display only ticket ID, problem type, and status. No personal data is published publicly.
            </p>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded font-medium">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzing}
              className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Municipal Ticket...</span>
                </>
              ) : (
                <>
                  <span>Submit Defect Report &amp; Generate Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Safety Hazard Confirmation Dialog */}
      {showHazardConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Critical Safety Hazard
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Flagging this report as an active safety hazard triggers emergency SMS notifications to the Municipal Ward Engineer and prioritizes the defect in the emergency triage queue.
              Please confirm this defect presents imminent accident or injury potential.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowHazardConfirmModal(false);
                  setIsSafetyHazard(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHazard}
                className="px-4 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded uppercase tracking-wider"
              >
                Yes, Flag as Hazard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
