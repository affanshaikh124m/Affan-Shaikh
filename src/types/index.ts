export type ConditionStatus = 'GOOD' | 'WARNING' | 'POOR' | 'CRITICAL';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'INSPECTOR' | 'CONTRACTOR' | 'CITIZEN';

export type ProblemType =
  | 'pothole'
  | 'crack'
  | 'surface_damage'
  | 'waterlogging'
  | 'damaged_divider_structure'
  | 'broken_streetlight'
  | 'damaged_drainage'
  | 'debris'
  | 'other';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type QRStatus = 'ACTIVE' | 'DISABLED' | 'REPLACEMENT_REQUIRED';

export type IoTSensorStatus = 'NORMAL' | 'WARNING' | 'WATERLOGGING' | 'FAULT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  comment?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface AIAnalysisResult {
  problemType: ProblemType;
  confidence: number;
  severity: IssueSeverity;
  affectedArea: string;
  recommendedAction: string;
  note: string;
  isSimulated: boolean;
  analyzedAt: string;
  modelUsed?: string;
}

export interface IoTSensorData {
  deviceId: string;
  status: IoTSensorStatus;
  water_cm: number;
  vibration_g: number;
  lux: number;
  isOnline: boolean;
  lastUpdate: string;
  anomalyDetected: boolean;
  alertMessage?: string;
}

export interface RoadSegment {
  id: string; // e.g. "MH-MUM-001"
  name: string;
  ward: string;
  zone: string;
  lengthKm: number;
  surfaceType: 'Asphalt' | 'Concrete' | 'Paver Block' | 'Bituminous Mix';
  lanes: number;
  condition: ConditionStatus;
  healthScore: number; // 0-100
  locationDescription: string;
  coordinates: {
    lat: number;
    lng: number;
    startPoint: string;
    endPoint: string;
  };
  contractorId: string;
  contractorName: string;
  lastMaintenanceDate: string;
  nextScheduledMaintenance: string;
  openIssuesCount: number;
  resolvedIssuesCount: number;
  iotStatus: IoTSensorData;
  qrStatus: QRStatus;
  qrGeneratedDate: string;
  recurringDefectCount: number;
  lastRepairDaysAgo: number;
  averageDaysBetweenRepairs: number;
  isPriorityFlagged?: boolean;
}

export interface RoadIssue {
  id: string; // e.g. "ISSUE-2026-001052"
  roadId: string;
  roadName: string;
  locationDetails: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
    verified: boolean;
  };
  reportedAt: string;
  reporterName?: string;
  reporterContact?: string;
  isPublicAnonymous: boolean;
  isSafetyHazard: boolean;
  hazardConfirmed: boolean;
  problemType: ProblemType;
  severity: IssueSeverity;
  description: string;
  status: IssueStatus;
  photoUrl: string;
  aiAnalysis: AIAnalysisResult;
  assignedContractorId?: string;
  assignedContractorName?: string;
  estimatedCostInr?: number;
  completedAt?: string;
  repairPhotoUrl?: string;
  auditTrail: AuditLogEntry[];
}

export interface MaintenanceRecord {
  id: string;
  roadId: string;
  roadName: string;
  relatedIssueId?: string;
  date: string;
  type: 'Pothole Patching' | 'Resurfacing' | 'Structural Repair' | 'Drainage Desilting' | 'Streetlight Replacement' | 'Cracks Sealing' | 'Emergency Remediation';
  contractorId: string;
  contractorName: string;
  costInr: number;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  beforePhotoUrl: string;
  afterPhotoUrl?: string;
  healthScoreBefore: number;
  healthScoreAfter: number;
  warrantyPeriodMonths: number;
}

export interface Contractor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  assignedZones: string[];
  activeIssuesCount: number;
  completedIssuesCount: number;
  averageResolutionDays: number;
  rating: number; // 1 to 5
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
}

export interface SystemAlert {
  id: string;
  type: 'LOW_HEALTH' | 'HIGH_WATER' | 'MULTIPLE_COMPLAINTS' | 'CRITICAL_AI' | 'OVERDUE_MAINTENANCE' | 'SENSOR_OFFLINE' | 'RECURRING_ISSUE';
  title: string;
  message: string;
  roadId: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
  acknowledged: boolean;
}

export interface UserSession {
  role: UserRole;
  name: string;
  email: string;
  department?: string;
  contractorId?: string;
}
