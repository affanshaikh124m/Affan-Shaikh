import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, Cpu } from 'lucide-react';

interface WokwiCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WokwiCodeModal: React.FC<WokwiCodeModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDiagram, setCopiedDiagram] = useState(false);
  const [activeTab, setActiveTab] = useState<'sketch' | 'diagram' | 'wiring'>('sketch');

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url';

  const sketchCode = `/*
 * MuniRoad ESP32 Smart Road Telemetry Node
 * Sensors: HC-SR04 (Water level / Puddle depth),
 *          MPU6050 Accelerometer (Road vibration / impact),
 *          LDR / Photoresistor (Ambient street light),
 *          SSD1306 128x64 I2C OLED Display
 *
 * Target: ESP32 DevKit v1 in Wokwi / Physical Hardware
 * Endpoint: POST /api/iot/telemetry
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WiFi Configuration (Wokwi default: "Wokwi-GUEST", "")
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MuniRoad Telemetry Endpoint
const char* serverEndpoint = "${currentHost}/api/iot/telemetry";
const char* roadId = "MH-MUM-001";

// Pin Definitions
#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_LDR 34
#define PIN_VIBRATION_POT 35 // Potentiometer simulating vibration/accelerometer

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LDR, INPUT);
  pinMode(PIN_VIBRATION_POT, INPUT);

  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("MuniRoad Telemetry");
  display.setCursor(0, 25);
  display.println("Booting ESP32...");
  display.display();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

float measureWaterDepthCm() {
  // Trigger HC-SR04 Ultrasonic pulse
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 0.0;
  
  // Speed of sound: 343 m/s = 0.0343 cm/us
  float distanceCm = (duration * 0.0343) / 2.0;
  // Sensor mounted 30cm above asphalt; water reduces distance to sensor
  float waterDepth = 30.0 - distanceCm;
  return waterDepth > 0 ? waterDepth : 0.0;
}

void loop() {
  float water_cm = measureWaterDepthCm();
  int rawVib = analogRead(PIN_VIBRATION_POT);
  float vibration_g = (rawVib / 4095.0) * 1.5; // 0 to 1.5g
  int rawLdr = analogRead(PIN_LDR);
  int lux = map(rawLdr, 0, 4095, 800, 10); // daylight to dark

  String status = "NORMAL";
  if (water_cm > 5.0) {
    status = "WATERLOGGING";
  } else if (vibration_g > 0.4) {
    status = "WARNING";
  }

  // Update OLED Display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("ROAD: "); display.println(roadId);
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 14);
  display.print("Water: "); display.print(water_cm, 1); display.println(" cm");
  display.setCursor(0, 26);
  display.print("Vib:   "); display.print(vibration_g, 2); display.println(" g");
  display.setCursor(0, 38);
  display.print("Light: "); display.print(lux); display.println(" lux");
  display.setCursor(0, 50);
  display.print("Status: "); display.println(status);
  display.display();

  // Transmit JSON payload via HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\\"roadId\\":\\"" + String(roadId) + "\\"" +
                         ",\\"water_cm\\":" + String(water_cm, 1) +
                         ",\\"vibration_g\\":" + String(vibration_g, 2) +
                         ",\\"lux\\":" + String(lux) +
                         ",\\"status\\":\\"" + status + "\\"" +
                         ",\\"source\\":\\"ESP32-Wokwi-HW\\"}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP POST result: ");
    Serial.println(httpResponseCode);
    http.end();
  }

  delay(5000); // Send telemetry every 5 seconds
}`;

  const diagramJson = `{
  "version": 1,
  "author": "MuniRoad Civic System",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-hc-sr04", "id": "ultrasonic", "top": -120, "left": 150, "attrs": { "distance": "22" } },
    { "type": "wokwi-potentiometer", "id": "pot_vib", "top": 120, "left": 180, "attrs": {} },
    { "type": "wokwi-photoresistor-sensor", "id": "ldr", "top": -80, "left": -120, "attrs": {} },
    { "type": "board-ssd1306", "id": "oled", "top": 140, "left": -100, "attrs": { "i2cAddress": "0x3c" } }
  ],
  "connections": [
    [ "esp:TX0", "$serialMonitor:RX", "", [] ],
    [ "esp:RX0", "$serialMonitor:TX", "", [] ],
    [ "esp:GND.1", "ultrasonic:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "ultrasonic:VCC", "red", [ "v0" ] ],
    [ "esp:D5", "ultrasonic:TRIG", "blue", [ "v0" ] ],
    [ "esp:D18", "ultrasonic:ECHO", "green", [ "v0" ] ],
    [ "esp:D21", "oled:SDA", "green", [ "v0" ] ],
    [ "esp:D22", "oled:SCL", "blue", [ "v0" ] ],
    [ "esp:3V3", "oled:VCC", "red", [ "v0" ] ],
    [ "esp:GND.2", "oled:GND", "black", [ "v0" ] ]
  ]
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sketchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyDiagram = () => {
    navigator.clipboard.writeText(diagramJson);
    setCopiedDiagram(true);
    setTimeout(() => setCopiedDiagram(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold tracking-tight">Wokwi ESP32 IoT Road Telemetry Node</h3>
              <p className="text-xs text-slate-300">
                Arduino C++ Sketch with Ultrasonic, Vibration, LDR & OLED Display
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

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sketch')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'sketch'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ESP32 Sketch (sketch.ino)
          </button>
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'diagram'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Wokwi diagram.json
          </button>
          <button
            onClick={() => setActiveTab('wiring')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'wiring'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Hardware Specs & Wiring
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs">
          {activeTab === 'sketch' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">
                  Target endpoint: {currentHost}/api/iot/telemetry
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Arduino Sketch'}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-100 p-3.5 rounded text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                {sketchCode}
              </pre>
            </div>
          )}

          {activeTab === 'diagram' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Paste into Wokwi diagram.json tab to auto-place sensors & wiring:
                </span>
                <button
                  onClick={handleCopyDiagram}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium"
                >
                  {copiedDiagram ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDiagram ? 'Copied' : 'Copy diagram.json'}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-100 p-3.5 rounded text-[11px] font-mono overflow-x-auto max-h-[380px] border border-slate-800">
                {diagramJson}
              </pre>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-3 text-slate-700">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5">Sensor Pin Mapping:</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>HC-SR04 Ultrasonic:</strong> VCC &rarr; 3V3/5V, TRIG &rarr; GPIO 5, ECHO &rarr; GPIO 18, GND &rarr; GND</li>
                  <li><strong>SSD1306 OLED (I2C):</strong> VCC &rarr; 3V3, GND &rarr; GND, SDA &rarr; GPIO 21, SCL &rarr; GPIO 22</li>
                  <li><strong>MPU6050 / Vibration Potentiometer:</strong> SIG &rarr; GPIO 35 (ADC1_CH7)</li>
                  <li><strong>LDR Photoresistor:</strong> SIG &rarr; GPIO 34 (ADC1_CH6)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-blue-900">
                <h4 className="font-bold uppercase tracking-wider mb-1">How it communicates with MuniRoad:</h4>
                <p>
                  Every 5 seconds, the ESP32 samples sensor readings, formats a JSON payload:
                  <code className="block bg-blue-100/70 p-1.5 mt-1 rounded font-mono text-[11px]">
                    {`{"roadId": "MH-MUM-001", "water_cm": 0.2, "vibration_g": 0.08, "lux": 560, "status": "NORMAL"}`}
                  </code>
                  and transmits it via HTTP POST to <code>/api/iot/telemetry</code>.
                </p>
              </div>
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
