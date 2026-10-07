import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory store for real-time ESP32 IoT telemetry updates if posted via HTTP
interface TelemetryRecord {
  roadId: string;
  water_cm: number;
  vibration_g: number;
  lux: number;
  status: 'NORMAL' | 'WARNING' | 'WATERLOGGING' | 'FAULT';
  timestamp: string;
  source: string;
}

let latestTelemetry: Record<string, TelemetryRecord> = {};

// IoT endpoint for ESP32 / Wokwi simulated hardware
app.post('/api/iot/telemetry', (req, res) => {
  const { roadId, water_cm, vibration_g, lux, status, source } = req.body;
  if (!roadId) {
    return res.status(400).json({ error: 'roadId is required' });
  }

  const record: TelemetryRecord = {
    roadId,
    water_cm: typeof water_cm === 'number' ? water_cm : 0,
    vibration_g: typeof vibration_g === 'number' ? vibration_g : 0.05,
    lux: typeof lux === 'number' ? lux : 420,
    status: status || 'NORMAL',
    timestamp: new Date().toISOString(),
    source: source || 'ESP32-Hardware-Client',
  };

  latestTelemetry[roadId] = record;
  console.log(`[IoT Telemetry Received] Road: ${roadId}, Water: ${record.water_cm}cm, Status: ${record.status}`);
  return res.json({ success: true, recorded: record });
});

app.get('/api/iot/telemetry/:roadId', (req, res) => {
  const { roadId } = req.params;
  const record = latestTelemetry[roadId];
  if (!record) {
    return res.json({ found: false });
  }
  return res.json({ found: true, telemetry: record });
});

// Gemini AI Road Defect Analysis Endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment, returning error to trigger client fallback.');
      return res.status(503).json({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Strip data prefix if provided in imageBase64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const actualMimeType = mimeType || 'image/jpeg';

    const imagePart = {
      inlineData: {
        mimeType: actualMimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `You are an expert municipal road inspection civil engineer. Analyze this uploaded photo of a roadway or civic pavement.
Detect and classify any visible pavement defects, road hazards, or infrastructure damage.
Allowed problemType values:
- "pothole"
- "crack"
- "surface_damage"
- "waterlogging"
- "damaged_divider_structure"
- "broken_streetlight"
- "damaged_drainage"
- "debris"
- "other"

Allowed severity values:
- "LOW"
- "MEDIUM"
- "HIGH"
- "CRITICAL"

Provide accurate civil engineering estimates for confidence (0-100), affected area dimensions, recommended municipal action, and an engineer note.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemType: {
              type: Type.STRING,
              description: 'Defect category (pothole, crack, surface_damage, waterlogging, damaged_divider_structure, broken_streetlight, damaged_drainage, debris, other)',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Detection confidence percentage from 0 to 100',
            },
            severity: {
              type: Type.STRING,
              description: 'Defect severity: LOW, MEDIUM, HIGH, or CRITICAL',
            },
            affectedArea: {
              type: Type.STRING,
              description: 'Estimated physical footprint (e.g., "Approx 1.2m x 0.8m, depth ~12cm")',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Standard municipal maintenance action recommended',
            },
            note: {
              type: Type.STRING,
              description: 'Civil engineering observation and hazard context',
            },
          },
          required: ['problemType', 'confidence', 'severity', 'affectedArea', 'recommendedAction', 'note'],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Empty response from Gemini model');
    }

    const parsed = JSON.parse(outputText.trim());
    return res.json({
      ...parsed,
      isSimulated: false,
      aiModel: 'gemini-3.8-flash',
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing image with Gemini:', error?.message || error);
    return res.status(500).json({
      error: 'GEMINI_INSPECTION_FAILED',
      message: error?.message || 'Error executing AI model analysis',
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Municipal Road System Server running on port ${PORT}`);
  });
}

startServer();
