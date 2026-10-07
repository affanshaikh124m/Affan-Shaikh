import {
  AuditLogEntry,
  Contractor,
  ConditionStatus,
  IoTSensorData,
  IoTSensorStatus,
  IssueStatus,
  MaintenanceRecord,
  RoadIssue,
  RoadSegment,
  SystemAlert,
  UserRole,
} from '../types';
import { calculateRoadHealthScore, calculateRoadPriorityScore } from './healthCalculator';
import {
  SEED_ALERTS,
  SEED_CONTRACTORS,
  SEED_ISSUES,
  SEED_MAINTENANCE,
  SEED_ROADS,
} from './seedData';

const STORAGE_KEYS = {
  ROADS: 'muniroad_roads_v1',
  ISSUES: 'muniroad_issues_v1',
  MAINTENANCE: 'muniroad_maintenance_v1',
  CONTRACTORS: 'muniroad_contractors_v1',
  ALERTS: 'muniroad_alerts_v1',
  MY_REPORTS: 'muniroad_my_reports_v1',
  RATE_LIMIT: 'muniroad_report_rate_limit_v1',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('Error in API listener:', err);
    }
  });
}

export function subscribeToDataChanges(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultData;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse ${key} from localStorage, using seed`, e);
    return defaultData;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

// In-memory cache
let roads: RoadSegment[] = loadFromStorage(STORAGE_KEYS.ROADS, SEED_ROADS);
let issues: RoadIssue[] = loadFromStorage(STORAGE_KEYS.ISSUES, SEED_ISSUES);
let maintenanceRecords: MaintenanceRecord[] = loadFromStorage(STORAGE_KEYS.MAINTENANCE, SEED_MAINTENANCE);
let contractors: Contractor[] = loadFromStorage(STORAGE_KEYS.CONTRACTORS, SEED_CONTRACTORS);
let alerts: SystemAlert[] = loadFromStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);

export const api = {
  // ROADS
  getRoads(): RoadSegment[] {
    return [...roads];
  },

  getRoadById(id: string): RoadSegment | undefined {
    return roads.find((r) => r.id.toLowerCase() === id.toLowerCase());
  },

  updateRoad(updated: RoadSegment) {
    roads = roads.map((r) => (r.id === updated.id ? updated : r));
    saveToStorage(STORAGE_KEYS.ROADS, roads);
    notifyListeners();
  },

  updateQRStatus(roadId: string, qrStatus: RoadSegment['qrStatus']) {
    const road = this.getRoadById(roadId);
    if (!road) return;
    road.qrStatus = qrStatus;
    if (qrStatus === 'ACTIVE') {
      road.qrGeneratedDate = new Date().toISOString().split('T')[0];
    }
    this.updateRoad(road);
  },

  // ISSUES
  getIssues(filter?: { roadId?: string; status?: IssueStatus }): RoadIssue[] {
    let result = [...issues];
    if (filter?.roadId) {
      result = result.filter((i) => i.roadId.toLowerCase() === filter.roadId!.toLowerCase());
    }
    if (filter?.status) {
      result = result.filter((i) => i.status === filter.status);
    }
    return result.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  },

  getIssueById(id: string): RoadIssue | undefined {
    return issues.find((i) => i.id.toLowerCase() === id.toLowerCase());
  },

  createIssue(issueData: Omit<RoadIssue, 'id' | 'reportedAt' | 'auditTrail'>): RoadIssue {
    // Generate standard municipal issue ID: ISSUE-2026-001052
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `ISSUE-2026-00${randomSuffix}`;
    const now = new Date().toISOString();

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      user: issueData.reporterName || 'Citizen (Mobile/Web)',
      role: 'CITIZEN',
      action: 'Report Submitted',
      comment: issueData.isSafetyHazard ? 'Flagged as Critical Safety Hazard by citizen' : 'Issue logged',
    };

    const newIssue: RoadIssue = {
      ...issueData,
      id: newId,
      reportedAt: now,
      auditTrail: [auditEntry],
    };

    if (newIssue.aiAnalysis) {
      newIssue.auditTrail.push({
        id: `aud-ai-${Date.now()}`,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        user: 'Municipal AI Engine',
        role: 'SUPER_ADMIN',
        action: 'AI Defect Assessment Attached',
        comment: `Automated detection: ${newIssue.aiAnalysis.problemType.toUpperCase()} (${newIssue.aiAnalysis.confidence}% confidence, ${newIssue.aiAnalysis.severity} severity)`,
      });
    }

    issues = [newIssue, ...issues];
    saveToStorage(STORAGE_KEYS.ISSUES, issues);

    // Save to user's "My Reports"
    this.saveToMyReports(newId);

    // Recalculate Road Health & Counts
    this.recalculateRoad(newIssue.roadId);

    // Create system alert if severity is high/critical
    if (newIssue.severity === 'CRITICAL' || newIssue.isSafetyHazard) {
      this.createAlert({
        type: 'CRITICAL_AI',
        title: `Critical Hazard Reported on ${newIssue.roadId}`,
        message: `${newIssue.problemType.toUpperCase()} on ${newIssue.roadName}: ${newIssue.description.slice(0, 80)}...`,
        roadId: newIssue.roadId,
        severity: 'CRITICAL',
      });
    }

    notifyListeners();
    return newIssue;
  },

  updateIssueStatus(params: {
    issueId: string;
    newStatus: IssueStatus;
    user: string;
    role: UserRole;
    comment?: string;
    contractorId?: string;
    repairPhotoUrl?: string;
    overrideSeverity?: RoadIssue['severity'];
  }): RoadIssue | undefined {
    const issue = this.getIssueById(params.issueId);
    if (!issue) return undefined;

    const previousStatus = issue.status;
    issue.status = params.newStatus;

    if (params.overrideSeverity) {
      issue.severity = params.overrideSeverity;
    }

    if (params.contractorId) {
      const contractor = this.getContractorById(params.contractorId);
      if (contractor) {
        issue.assignedContractorId = contractor.id;
        issue.assignedContractorName = contractor.company;
      }
    }

    if (params.repairPhotoUrl) {
      issue.repairPhotoUrl = params.repairPhotoUrl;
    }

    if (['RESOLVED', 'CLOSED'].includes(params.newStatus)) {
      issue.completedAt = new Date().toISOString();
    }

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: params.user,
      role: params.role,
      action: `Status changed to ${params.newStatus}`,
      previousStatus,
      newStatus: params.newStatus,
      comment: params.comment || `Updated by ${params.user} (${params.role})`,
    };

    issue.auditTrail.push(auditEntry);

    issues = issues.map((i) => (i.id === issue.id ? issue : i));
    saveToStorage(STORAGE_KEYS.ISSUES, issues);

    // If marked CLOSED or RESOLVED and has repair photo, automatically generate maintenance record if none exists yet
    if (['RESOLVED', 'CLOSED'].includes(params.newStatus) && issue.repairPhotoUrl) {
      const road = this.getRoadById(issue.roadId);
      const existingMaint = maintenanceRecords.find((m) => m.relatedIssueId === issue.id);
      if (!existingMaint && road) {
        this.createMaintenanceRecord({
          roadId: issue.roadId,
          roadName: issue.roadName,
          relatedIssueId: issue.id,
          date: new Date().toISOString().split('T')[0],
          type: issue.problemType === 'pothole' ? 'Pothole Patching' : 'Structural Repair',
          contractorId: issue.assignedContractorId || road.contractorId,
          contractorName: issue.assignedContractorName || road.contractorName,
          costInr: 35000,
          description: `Repair completed for ${issue.id}: ${issue.description}`,
          status: 'COMPLETED',
          beforePhotoUrl: issue.photoUrl,
          afterPhotoUrl: issue.repairPhotoUrl,
          healthScoreBefore: road.healthScore,
          healthScoreAfter: Math.min(100, road.healthScore + 18),
          warrantyPeriodMonths: 6,
        });
      }
    }

    // Recalculate Road Health & Counts
    this.recalculateRoad(issue.roadId);

    notifyListeners();
    return issue;
  },

  // Recalculate Road health and active/resolved counts
  recalculateRoad(roadId: string) {
    const road = this.getRoadById(roadId);
    if (!road) return;

    const roadIssues = issues.filter((i) => i.roadId.toLowerCase() === roadId.toLowerCase());
    const openIssues = roadIssues.filter((i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status));
    const resolvedIssues = roadIssues.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status));

    const { healthScore, condition } = calculateRoadHealthScore({
      openIssues,
      iotStatus: road.iotStatus,
      lastMaintenanceDate: road.lastMaintenanceDate,
      nextScheduledMaintenance: road.nextScheduledMaintenance,
    });

    road.healthScore = healthScore;
    road.condition = condition;
    road.openIssuesCount = openIssues.length;
    road.resolvedIssuesCount = resolvedIssues.length;

    // Check recurring issue logic
    const potholeIssues = roadIssues.filter((i) => i.problemType === 'pothole');
    road.recurringDefectCount = Math.max(road.recurringDefectCount, potholeIssues.length);

    this.updateRoad(road);
  },

  // MAINTENANCE RECORDS
  getMaintenanceRecords(roadId?: string): MaintenanceRecord[] {
    let result = [...maintenanceRecords];
    if (roadId) {
      result = result.filter((m) => m.roadId.toLowerCase() === roadId.toLowerCase());
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createMaintenanceRecord(recordData: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord {
    const newId = `MAINT-2026-00${Math.floor(10 + Math.random() * 90)}`;
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: newId,
    };

    maintenanceRecords = [newRecord, ...maintenanceRecords];
    saveToStorage(STORAGE_KEYS.MAINTENANCE, maintenanceRecords);

    // Update road's last maintenance date and recalculate
    const road = this.getRoadById(recordData.roadId);
    if (road && recordData.status === 'COMPLETED') {
      road.lastMaintenanceDate = recordData.date;
      road.lastRepairDaysAgo = 0;
      // Set next scheduled maintenance to 6 months in future
      const nextDate = new Date(recordData.date);
      nextDate.setMonth(nextDate.getMonth() + 6);
      road.nextScheduledMaintenance = nextDate.toISOString().split('T')[0];
      this.recalculateRoad(road.id);
    }

    notifyListeners();
    return newRecord;
  },

  // CONTRACTORS
  getContractors(): Contractor[] {
    return [...contractors];
  },

  getContractorById(id: string): Contractor | undefined {
    return contractors.find((c) => c.id === id);
  },

  // IOT SENSORS & SIMULATOR
  updateIoTSensorReading(
    roadId: string,
    preset: 'NORMAL' | 'WARNING' | 'WATERLOGGING' | 'FAULT',
    customData?: Partial<IoTSensorData>
  ) {
    const road = this.getRoadById(roadId);
    if (!road) return;

    let sensorData: IoTSensorData;

    switch (preset) {
      case 'NORMAL':
        sensorData = {
          deviceId: road.iotStatus.deviceId,
          status: 'NORMAL',
          water_cm: 0.1,
          vibration_g: 0.08,
          lux: 560,
          isOnline: true,
          lastUpdate: new Date().toISOString(),
          anomalyDetected: false,
        };
        break;
      case 'WARNING':
        sensorData = {
          deviceId: road.iotStatus.deviceId,
          status: 'WARNING',
          water_cm: 3.2,
          vibration_g: 0.58,
          lux: 320,
          isOnline: true,
          lastUpdate: new Date().toISOString(),
          anomalyDetected: true,
          alertMessage: 'Vibration exceeding threshold (0.58g peak); pavement deflection warning.',
        };
        break;
      case 'WATERLOGGING':
        sensorData = {
          deviceId: road.iotStatus.deviceId,
          status: 'WATERLOGGING',
          water_cm: 12.4,
          vibration_g: 0.12,
          lux: 240,
          isOnline: true,
          lastUpdate: new Date().toISOString(),
          anomalyDetected: true,
          alertMessage: 'Severe waterlogging: water level 12.4cm. Stormwater drain overflow!',
        };
        break;
      case 'FAULT':
        sensorData = {
          deviceId: road.iotStatus.deviceId,
          status: 'FAULT',
          water_cm: 0,
          vibration_g: 0,
          lux: 0,
          isOnline: false,
          lastUpdate: new Date().toISOString(),
          anomalyDetected: true,
          alertMessage: 'Sensor node offline: battery or gateway communication fault.',
        };
        break;
    }

    if (customData) {
      sensorData = { ...sensorData, ...customData };
    }

    road.iotStatus = sensorData;
    this.updateRoad(road);
    this.recalculateRoad(roadId);

    if (sensorData.anomalyDetected) {
      this.createAlert({
        type: preset === 'WATERLOGGING' ? 'HIGH_WATER' : 'SENSOR_OFFLINE',
        title: `IoT Anomaly on ${road.id} (${preset})`,
        message: sensorData.alertMessage || `Sensor preset changed to ${preset}`,
        roadId: road.id,
        severity: preset === 'WATERLOGGING' ? 'CRITICAL' : 'WARNING',
      });
    }

    notifyListeners();
  },

  // ALERTS
  getAlerts(): SystemAlert[] {
    return [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  createAlert(alertData: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged'>) {
    const newAlert: SystemAlert = {
      ...alertData,
      id: `ALERT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    alerts = [newAlert, ...alerts];
    saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    notifyListeners();
  },

  acknowledgeAlert(id: string) {
    alerts = alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    notifyListeners();
  },

  // PRIORITY QUEUE
  getPriorityQueue(): { road: RoadSegment; priorityScore: number; reason: string }[] {
    return roads
      .map((road) => {
        const roadIssues = issues.filter(
          (i) => i.roadId.toLowerCase() === road.id.toLowerCase() && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status)
        );
        const score = calculateRoadPriorityScore(road, roadIssues);

        let reason = 'Normal routine monitoring';
        if (road.iotStatus.status === 'WATERLOGGING') {
          reason = 'Active severe waterlogging alert';
        } else if (road.condition === 'CRITICAL') {
          reason = 'Critical condition with multiple high-severity defects';
        } else if (road.recurringDefectCount > 2) {
          reason = 'Recurring pavement degradation within 30 days';
        } else if (roadIssues.some((i) => i.severity === 'CRITICAL')) {
          reason = 'Unresolved critical safety hazard reported';
        } else if (road.healthScore < 60) {
          reason = 'Deteriorating pavement health score';
        }

        return {
          road,
          priorityScore: score,
          reason,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  },

  // MY REPORTS (for citizens)
  getMyReports(): RoadIssue[] {
    const reportIds: string[] = loadFromStorage(STORAGE_KEYS.MY_REPORTS, []);
    return issues.filter((i) => reportIds.includes(i.id));
  },

  saveToMyReports(issueId: string) {
    const reportIds: string[] = loadFromStorage(STORAGE_KEYS.MY_REPORTS, []);
    if (!reportIds.includes(issueId)) {
      reportIds.unshift(issueId);
      saveToStorage(STORAGE_KEYS.MY_REPORTS, reportIds);
    }
  },

  // RATE LIMITING
  checkCanSubmitReport(): { allowed: boolean; remainingSeconds: number } {
    try {
      const lastSubmitTime = Number(localStorage.getItem(STORAGE_KEYS.RATE_LIMIT) || '0');
      const now = Date.now();
      const COOLDOWN_MS = 10 * 1000; // 10 seconds rate limit to prevent spam
      if (now - lastSubmitTime < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
        return { allowed: false, remainingSeconds };
      }
      return { allowed: true, remainingSeconds: 0 };
    } catch {
      return { allowed: true, remainingSeconds: 0 };
    }
  },

  recordReportSubmitted() {
    try {
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT, String(Date.now()));
    } catch {
      // ignore
    }
  },

  // RESET
  resetToDefaults() {
    roads = SEED_ROADS;
    issues = SEED_ISSUES;
    maintenanceRecords = SEED_MAINTENANCE;
    contractors = SEED_CONTRACTORS;
    alerts = SEED_ALERTS;
    localStorage.removeItem(STORAGE_KEYS.ROADS);
    localStorage.removeItem(STORAGE_KEYS.ISSUES);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.CONTRACTORS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.MY_REPORTS);
    notifyListeners();
  },
};
