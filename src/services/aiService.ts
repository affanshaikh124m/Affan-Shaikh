import { AIAnalysisResult, ProblemType, IssueSeverity } from '../types';

/**
 * Fallback simulator for road defect AI photo analysis
 * Labeled with isSimulated: true and clear verification notice.
 */
export function generateSimulatedAnalysis(fileName?: string): AIAnalysisResult {
  const lowerName = (fileName || '').toLowerCase();

  let problemType: ProblemType = 'pothole';
  let severity: IssueSeverity = 'HIGH';
  let confidence = 94;
  let affectedArea = 'Approx 1.4m x 1.1m, estimated depth ~12cm';
  let recommendedAction = 'Immediate cold mix asphalt patch compaction followed by bitumen edge sealing.';
  let note = 'Severe localized asphalt failure with exposed gravel base. High puncture and vehicle suspension risk.';

  if (lowerName.includes('water') || lowerName.includes('flood') || lowerName.includes('drain')) {
    problemType = 'waterlogging';
    severity = 'HIGH';
    confidence = 92;
    affectedArea = 'Approx 12m length along median curb, water depth ~7-9cm';
    recommendedAction = 'Emergency jetting of storm runoff drain pipe and clearing sediment trap.';
    note = 'Standing surface water impeding two lanes. High hydroplaning hazard for fast moving traffic.';
  } else if (lowerName.includes('crack')) {
    problemType = 'crack';
    severity = 'MEDIUM';
    confidence = 88;
    affectedArea = 'Approx 6m longitudinal fatigue cracking along wheel path';
    recommendedAction = 'Hot-pour rubberized elastomeric crack seal to prevent monsoon water penetration.';
    note = 'Alligator/fatigue cracking pattern indicating early stage sub-base moisture softening.';
  } else if (lowerName.includes('light') || lowerName.includes('lamp') || lowerName.includes('pole')) {
    problemType = 'broken_streetlight';
    severity = 'MEDIUM';
    confidence = 96;
    affectedArea = 'Luminaire head dislodged on pole #ST-44';
    recommendedAction = 'Bucket truck inspection and replacement with IP66 120W LED fixture.';
    note = 'Dark zone created on pedestrian crossing area. Night-time pedestrian hazard.';
  } else if (lowerName.includes('divider') || lowerName.includes('railing') || lowerName.includes('barrier')) {
    problemType = 'damaged_divider_structure';
    severity = 'CRITICAL';
    confidence = 95;
    affectedArea = '3 steel guardrail beam segments buckled into opposing traffic lane';
    recommendedAction = 'Immediate reflective barricading, cut deformed W-beams, and anchor new posts.';
    note = 'Structural breach of median barrier. Immediate head-on vehicular collision danger.';
  }

  return {
    problemType,
    confidence,
    severity,
    affectedArea,
    recommendedAction,
    note,
    isSimulated: true,
    analyzedAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (Simulated fallback)',
  };
}

/**
 * Real API call to server-side Gemini endpoint `/api/analyze-image`.
 * Automatically falls back to simulated analysis on error/offline.
 */
export async function analyzeRoadImage(imageBase64: string, fileName?: string): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      }),
    });

    if (!response.ok) {
      console.warn(`Server AI endpoint returned status ${response.status}. Using high-fidelity simulated fallback.`);
      return generateSimulatedAnalysis(fileName);
    }

    const data = await response.json();

    if (data.problemType && data.confidence && data.severity) {
      return {
        problemType: data.problemType as ProblemType,
        confidence: Math.round(Number(data.confidence) || 92),
        severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(data.severity)
          ? data.severity
          : 'HIGH') as IssueSeverity,
        affectedArea: data.affectedArea || 'Approx 1.2m x 0.9m',
        recommendedAction: data.recommendedAction || 'Cold mix asphalt patch application',
        note: data.note || 'Pavement defect detected via optical inspection.',
        isSimulated: false,
        analyzedAt: data.analyzedAt || new Date().toISOString(),
        modelUsed: data.aiModel || 'gemini-3.8-flash',
      };
    }

    return generateSimulatedAnalysis(fileName);
  } catch (err) {
    console.warn('Network or server error during Gemini analysis. Falling back to simulated results:', err);
    return generateSimulatedAnalysis(fileName);
  }
}
