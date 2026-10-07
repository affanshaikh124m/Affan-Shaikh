import { ConditionStatus, IoTSensorData, IssueSeverity, RoadIssue, RoadSegment } from '../types';

/**
 * Pure function to map health score to condition status
 */
export function getConditionStatus(score: number): ConditionStatus {
  if (score >= 80) return 'GOOD';
  if (score >= 60) return 'WARNING';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

export function getConditionColorClass(condition: ConditionStatus): {
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  ringColor: string;
  progressBarColor: string;
} {
  switch (condition) {
    case 'GOOD':
      return {
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800 border-emerald-300',
        borderColor: 'border-emerald-500',
        ringColor: '#10b981',
        progressBarColor: 'bg-emerald-600',
      };
    case 'WARNING':
      return {
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800 border-amber-300',
        borderColor: 'border-amber-500',
        ringColor: '#f59e0b',
        progressBarColor: 'bg-amber-500',
      };
    case 'POOR':
      return {
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-800 border-orange-300',
        borderColor: 'border-orange-500',
        ringColor: '#f97316',
        progressBarColor: 'bg-orange-500',
      };
    case 'CRITICAL':
      return {
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-800 border-rose-300',
        borderColor: 'border-rose-500',
        ringColor: '#ef4444',
        progressBarColor: 'bg-rose-600',
      };
  }
}

/**
 * Pure calculation for Road Health Score
 * Health Score = 100 - complaint penalty - sensor penalty - maintenance-age penalty - AI damage penalty, clamped to 0-100.
 */
export function calculateRoadHealthScore(params: {
  openIssues: RoadIssue[];
  iotStatus: IoTSensorData;
  lastMaintenanceDate: string;
  nextScheduledMaintenance: string;
}): {
  healthScore: number;
  condition: ConditionStatus;
  breakdown: {
    baseScore: number;
    complaintPenalty: number;
    sensorPenalty: number;
    maintenanceAgePenalty: number;
    aiDamagePenalty: number;
  };
} {
  const { openIssues, iotStatus, lastMaintenanceDate, nextScheduledMaintenance } = params;

  // 1. Complaint Penalty
  let complaintPenalty = 0;
  openIssues.forEach((issue) => {
    if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(issue.status)) return;
    switch (issue.severity) {
      case 'CRITICAL':
        complaintPenalty += 18;
        break;
      case 'HIGH':
        complaintPenalty += 10;
        break;
      case 'MEDIUM':
        complaintPenalty += 5;
        break;
      case 'LOW':
        complaintPenalty += 2;
        break;
    }
  });

  // 2. Sensor Penalty
  let sensorPenalty = 0;
  if (!iotStatus.isOnline || iotStatus.status === 'FAULT') {
    sensorPenalty += 8;
  } else if (iotStatus.status === 'WATERLOGGING' || iotStatus.water_cm > 5) {
    sensorPenalty += Math.min(25, 12 + iotStatus.water_cm * 1.2);
  } else if (iotStatus.status === 'WARNING' || iotStatus.vibration_g > 0.4) {
    sensorPenalty += 10;
  }

  // 3. Maintenance Age Penalty
  let maintenanceAgePenalty = 0;
  const now = new Date();
  const lastMaint = new Date(lastMaintenanceDate);
  const diffDays = Math.max(0, Math.floor((now.getTime() - lastMaint.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays > 120) {
    maintenanceAgePenalty += Math.min(18, Math.floor((diffDays - 120) * 0.08));
  }

  const nextMaint = new Date(nextScheduledMaintenance);
  if (now > nextMaint) {
    const overdueDays = Math.floor((now.getTime() - nextMaint.getTime()) / (1000 * 60 * 60 * 24));
    maintenanceAgePenalty += Math.min(12, 5 + Math.floor(overdueDays * 0.15));
  }

  // 4. AI Damage Penalty from recent active issues with high AI severity
  let aiDamagePenalty = 0;
  const highAiIssues = openIssues.filter(
    (i) =>
      !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status) &&
      (i.aiAnalysis.severity === 'CRITICAL' || i.aiAnalysis.severity === 'HIGH')
  );
  if (highAiIssues.length > 0) {
    aiDamagePenalty = Math.min(20, highAiIssues.length * 6);
  }

  const rawScore = 100 - complaintPenalty - sensorPenalty - maintenanceAgePenalty - aiDamagePenalty;
  const healthScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const condition = getConditionStatus(healthScore);

  return {
    healthScore,
    condition,
    breakdown: {
      baseScore: 100,
      complaintPenalty: Math.round(complaintPenalty),
      sensorPenalty: Math.round(sensorPenalty),
      maintenanceAgePenalty: Math.round(maintenanceAgePenalty),
      aiDamagePenalty: Math.round(aiDamagePenalty),
    },
  };
}

/**
 * Pure calculation for Maintenance Priority Score
 * Priority score = severity + low health + complaint count + AI severity + IoT alerts + maintenance age.
 * Ranks road segments in descending order of urgency.
 */
export function calculateRoadPriorityScore(road: RoadSegment, openIssues: RoadIssue[]): number {
  let severityScore = 0;
  let aiSeverityScore = 0;

  openIssues.forEach((issue) => {
    if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(issue.status)) return;
    if (issue.severity === 'CRITICAL') severityScore += 30;
    else if (issue.severity === 'HIGH') severityScore += 18;
    else if (issue.severity === 'MEDIUM') severityScore += 8;
    else severityScore += 3;

    if (issue.aiAnalysis.severity === 'CRITICAL') aiSeverityScore += 20;
    else if (issue.aiAnalysis.severity === 'HIGH') aiSeverityScore += 12;
  });

  const lowHealthFactor = Math.round((100 - road.healthScore) * 0.7);
  const complaintCountFactor = Math.min(40, openIssues.length * 7);

  let iotAlertScore = 0;
  if (road.iotStatus.status === 'WATERLOGGING' || road.iotStatus.water_cm > 6) {
    iotAlertScore += 25;
  }
  if (road.iotStatus.status === 'WARNING' || road.iotStatus.vibration_g > 0.4) {
    iotAlertScore += 15;
  }
  if (!road.iotStatus.isOnline) {
    iotAlertScore += 10;
  }

  const lastMaint = new Date(road.lastMaintenanceDate);
  const daysSinceMaint = Math.max(0, Math.floor((Date.now() - lastMaint.getTime()) / (1000 * 60 * 60 * 24)));
  const maintenanceAgeScore = Math.min(25, Math.floor(daysSinceMaint * 0.1));

  const recurringBonus = road.recurringDefectCount > 1 ? road.recurringDefectCount * 10 : 0;

  return Math.round(
    severityScore +
    lowHealthFactor +
    complaintCountFactor +
    aiSeverityScore +
    iotAlertScore +
    maintenanceAgeScore +
    recurringBonus
  );
}
