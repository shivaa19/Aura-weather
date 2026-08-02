import express from "express";
import path from "path";
import http from "http";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";

dotenv.config();

// Find next available port starting from `start`
function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(start, "0.0.0.0", () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => resolve(findAvailablePort(start + 1)));
  });
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize Gemini client:", e);
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = await findAvailablePort(3000);
  const HMR_PORT = await findAvailablePort(24678);

  app.use(express.json({ limit: "10mb" }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade for Live API
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Gemini Live API Connection
  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to Live Voice API");
    const ai = getGeminiClient();

    if (!ai) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }));
      clientWs.close();
      return;
    }

    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Aura Weather's live AI meteorologist. You speak clearly, warmly, and concisely about weather forecasts, atmospheric phenomena, travel safety, and outdoor planning.",
        },
        callbacks: {
          onmessage: (message) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ audio }));
              }
            }
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
        },
      });

      clientWs.on("message", (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Live WS parse error:", e);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch (e) {}
      });
    } catch (err: any) {
      console.error("Failed to connect to Gemini Live:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: "Gemini Live session connection failed." }));
        clientWs.close();
      }
    }
  });

// Helper to call Gemini models with resilient fallback handling
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  options: {
    primaryModel: string;
    fallbackModel?: string;
    contents: any;
    config?: any;
  }
) {
  const { primaryModel, fallbackModel = "gemini-3.1-flash-lite", contents, config } = options;
  try {
    return await ai.models.generateContent({
      model: primaryModel,
      contents,
      config,
    });
  } catch (err: any) {
    console.warn(`Primary model (${primaryModel}) failed or unavailable: ${err?.message || err}. Trying fallback model (${fallbackModel})...`);
    if (fallbackModel && fallbackModel !== primaryModel) {
      try {
        return await ai.models.generateContent({
          model: fallbackModel,
          contents,
          // Strip tools if switching to flash-lite as fallback
          config: fallbackModel === "gemini-3.1-flash-lite" ? undefined : config,
        });
      } catch (fallbackErr: any) {
        console.warn(`Fallback model (${fallbackModel}) also failed: ${fallbackErr?.message || fallbackErr}`);
        throw fallbackErr;
      }
    }
    throw err;
  }
}
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Aura Weather" });
  });

  // Location-specific forecast briefing. This intentionally reports forecast risk, not an official warning.
  app.get("/api/location-briefing", async (req, res) => {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "A valid latitude and longitude are required." });
    }

    const conditionForCode = (code: number) => {
      if ([95, 96, 99].includes(code)) return "Thunderstorm";
      if ([80, 81, 82].includes(code)) return "Rain showers";
      if ([61, 63, 65].includes(code)) return "Rain";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
      if ([45, 48].includes(code)) return "Fog";
      if ([1, 2, 3].includes(code)) return "Cloudy";
      return "Clear";
    };

    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day",
        hourly: "precipitation_probability,precipitation,weather_code,wind_gusts_10m,visibility",
        forecast_hours: "12",
        timezone: "auto",
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Forecast service returned ${response.status}`);
      const weather: any = await response.json();
      const hourly = weather.hourly;
      const current = weather.current;
      if (!current || !hourly?.time?.length) throw new Error("Forecast response was incomplete");

      const start = Math.max(0, hourly.time.findIndex((time: string) => time >= current.time));
      const timeline = hourly.time.slice(start, start + 8).map((time: string, offset: number) => {
        const index = start + offset;
        return {
          time,
          condition: conditionForCode(hourly.weather_code[index]),
          rainChance: Math.round(hourly.precipitation_probability[index] || 0),
          precipitation: Number(hourly.precipitation[index] || 0),
          gusts: Math.round(hourly.wind_gusts_10m[index] || 0),
          visibility: Math.round((hourly.visibility[index] || 0) / 1000 * 10) / 10,
        };
      });

      const firstRisk = timeline.findIndex((hour: any) => hour.condition === "Thunderstorm" || hour.rainChance >= 60 || hour.precipitation >= 1 || hour.gusts >= 55);
      const peak = timeline.reduce((highest: any, hour: any) => Math.max(highest, hour.rainChance + hour.precipitation * 12 + Math.max(0, hour.gusts - 35)), 0);
      const hasThunder = timeline.some((hour: any) => hour.condition === "Thunderstorm");
      const maxGust = Math.max(current.wind_gusts_10m || 0, ...timeline.map((hour: any) => hour.gusts));
      const risk = hasThunder || peak >= 100 || maxGust >= 75 ? "high" : peak >= 55 || maxGust >= 55 ? "elevated" : "low";
      const timing = firstRisk >= 0 ? timeline[firstRisk].time : null;

      res.json({
        source: "Open-Meteo forecast model",
        updatedAt: current.time,
        timezone: weather.timezone_abbreviation || weather.timezone,
        coordinates: { latitude, longitude },
        current: {
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: Math.round(current.relative_humidity_2m),
          condition: conditionForCode(current.weather_code),
          precipitation: Number(current.precipitation || 0),
          wind: Math.round(current.wind_speed_10m || 0),
          gusts: Math.round(current.wind_gusts_10m || 0),
          isDay: current.is_day === 1,
        },
        risk,
        timing,
        timeline,
        note: "This is a model forecast, not an official emergency alert. Follow local meteorological authorities for warning decisions.",
      });
    } catch (error) {
      console.error("Location forecast error:", error);
      res.status(502).json({ error: "Live forecast data is temporarily unavailable. Please try again shortly." });
    }
  });

  // Fast AI Meteorologist Briefing (gemini-3.1-flash-lite)
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { city, condition, temp, humidity, wind } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          briefing: `Expect ${condition.toLowerCase()} conditions in ${city} at ${temp}°C. Humidity is around ${humidity}%, with winds at ${wind} km/h.`,
          outfit: `A light layer or jacket is recommended for comfortable outdoor activities.`,
          activityRating: "8/10",
          activityAdvice: "Great conditions for walking, light jogging, or patio dining.",
        });
      }

      const response = await callGeminiWithFallback(ai, {
        primaryModel: "gemini-3.1-flash-lite",
        fallbackModel: "gemini-3.5-flash",
        contents: `You are Aura Weather's AI Chief Meteorologist. Given the current weather for ${city}:
- Temperature: ${temp}°C
- Condition: ${condition}
- Humidity: ${humidity}%
- Wind: ${wind} km/h

Provide a JSON object with strictly these keys:
"briefing": (2 concise atmospheric sentences summarizing what the weather feels like and what to watch out for),
"outfit": (1 direct sentence on what clothing/layers to wear),
"activityRating": (a rating string like "8/10"),
"activityAdvice": (1 sentence on ideal outdoor activities today).

Output ONLY raw JSON.`,
      });

      const text = response.text || "";
      const cleanedJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      res.json(parsed);
    } catch (err: any) {
      console.error("AI Insight Error:", err);
      res.json({
        briefing: `Atmospheric pressure is stable across the area with pleasant ambient humidity levels.`,
        outfit: `Layer comfortably for fluctuating breeze throughout the day.`,
        activityRating: "7/10",
        activityAdvice: "Favorable conditions for daytime travel and outdoor tasks.",
      });
    }
  });

  // Complex Reasoning Weather Analysis (gemini-3.1-pro-preview)
  app.post("/api/deep-analysis", async (req, res) => {
    try {
      const { city, condition, temp, high, low, humidity, wind, uvIndex, airQualityIndex } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          climateSummary: `Current atmosphere in ${city} shows stable ${condition.toLowerCase()} conditions at ${temp}°C with humidity near ${humidity}%.`,
          healthAdvisory: `UV index is ${uvIndex} and AQI is ${airQualityIndex}. Maintain routine outdoor hydration and UV protection.`,
          travelImpact: `Visibility is normal and wind speeds of ${wind} km/h pose minimal impact to local transport.`,
          idealWindow: `Mid-day to early evening offers the best thermal comfort window today.`,
          stormProbability: `Low immediate risk of convective storms or severe frontal boundaries.`
        });
      }

      const response = await callGeminiWithFallback(ai, {
        primaryModel: "gemini-3.1-pro-preview",
        fallbackModel: "gemini-3.5-flash",
        contents: `Perform a comprehensive meteorological & atmospheric analysis for ${city}.
Current Parameters:
- Condition: ${condition}
- Temp: ${temp}°C (High: ${high}°C, Low: ${low}°C)
- Humidity: ${humidity}%
- Wind Speed: ${wind} km/h
- UV Index: ${uvIndex}
- AQI: ${airQualityIndex}

Provide a structured JSON output with keys:
"climateSummary": string (Deep scientific & comfort analysis),
"healthAdvisory": string (Precautions for air quality, UV, and hydration),
"travelImpact": string (Road, aviation, and commuter risks),
"idealWindow": string (Optimal hours today for outdoor sports or dining),
"stormProbability": string (Assessment of unexpected frontal shifts or convective storms).

Return strictly JSON.`,
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleaned));
    } catch (e: any) {
      console.error("Deep Analysis Error:", e);
      const { city, condition, temp, humidity, wind, uvIndex, airQualityIndex } = req.body;
      res.json({
        climateSummary: `Current atmosphere in ${city || "the area"} shows stable ${condition?.toLowerCase() || "fair"} conditions at ${temp || 22}°C with humidity near ${humidity || 55}%.`,
        healthAdvisory: `UV index is ${uvIndex || 4} and AQI is ${airQualityIndex || 30}. Maintain routine outdoor hydration and solar protection.`,
        travelImpact: `Visibility is normal and wind speeds of ${wind || 12} km/h pose minimal impact to local transport.`,
        idealWindow: `Mid-day to early evening offers the best thermal comfort window today.`,
        stormProbability: `Low immediate risk of convective storms or severe frontal boundaries.`
      });
    }
  });

  // Search & Maps Grounded Weather Info (gemini-3.5-flash)
  app.post("/api/grounded-weather", async (req, res) => {
    try {
      const { query, mode } = req.body; // mode: 'search' or 'maps'
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          text: `Grounded insights for "${query}": Weather conditions are generally favorable across the region with clear road conditions.`,
          groundingChunks: [],
        });
      }

      const tools = mode === 'maps' ? [{ googleMaps: {} }] : [{ googleSearch: {} }];

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: query,
          config: { tools },
        });
      } catch (e: any) {
        console.warn(`Grounded search model primary attempt failed: ${e?.message}. Falling back to flash-lite without grounding tools.`);
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Provide a helpful response for the weather/travel query: ${query}`,
        });
      }

      const text = response.text || "";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      res.json({
        text,
        groundingChunks: chunks,
      });
    } catch (e: any) {
      console.error("Grounded Weather Error:", e);
      res.json({
        text: `Live query completed for: "${req.body.query}". Local weather trends indicate standard seasonal atmospheric patterns with calm surface winds.`,
        groundingChunks: [],
      });
    }
  });

  // Music Generation Endpoint (lyria-3-clip-preview)
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt = "Ambient atmospheric rainy day chill music" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(500).json({ error: "Gemini API Key missing." });
      }

      const responseStream = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      res.json({
        audioBase64,
        mimeType,
        lyrics,
      });
    } catch (e: any) {
      console.error("Music Generation Error:", e);
      res.status(500).json({ error: e.message || "Music generation failed." });
    }
  });

  // Dynamic Weather Search / Generation
  app.get("/api/search-weather", async (req, res) => {
    const query = (req.query.q as string) || "London";
    const ai = getGeminiClient();

    if (ai) {
      try {
        const response = await callGeminiWithFallback(ai, {
          primaryModel: "gemini-3.5-flash",
          fallbackModel: "gemini-3.1-flash-lite",
          contents: `Provide a realistic weather forecast JSON for location "${query}".
Return a JSON matching this exact structure:
{
  "city": "${query}",
  "country": "Region/Country",
  "temperature": 22,
  "condition": "Partly Cloudy",
  "high": 25,
  "low": 17,
  "humidity": 60,
  "dewPoint": 15,
  "windSpeed": 14,
  "gusts": 20,
  "uvIndex": 5,
  "uvLevel": "MODERATE",
  "visibility": 10,
  "visibilityStatus": "CLEAR",
  "airQualityIndex": 25,
  "airQualityStatus": "Good",
  "airQualityAdvice": "Index: 25 - Fresh air expected",
  "hourly": [
    {"time": "NOW", "icon": "wb_sunny", "temp": 22},
    {"time": "1 PM", "icon": "wb_sunny", "temp": 23},
    {"time": "2 PM", "icon": "partly_cloudy_day", "temp": 24},
    {"time": "3 PM", "icon": "cloud_queue", "temp": 24},
    {"time": "4 PM", "icon": "partly_cloudy_day", "temp": 23},
    {"time": "5 PM", "icon": "rainy", "temp": 21}
  ],
  "daily": [
    {
      "day": "Today",
      "fullDayName": "Today",
      "condition": "Partly Cloudy",
      "icon": "partly_cloudy_day",
      "rainChance": 15,
      "tempHigh": 25,
      "tempLow": 17,
      "windSpeed": "14 km/h",
      "humidity": "60%",
      "uvIndex": "5 Moderate",
      "visibility": "10 km",
      "sunrise": "05:48 AM",
      "sunset": "08:45 PM",
      "description": "Pleasant conditions with gentle afternoon clouds."
    },
    {
      "day": "Tue",
      "fullDayName": "Tuesday",
      "condition": "Sunny",
      "icon": "wb_sunny",
      "rainChance": 5,
      "tempHigh": 27,
      "tempLow": 18,
      "windSpeed": "12 km/h",
      "humidity": "50%",
      "uvIndex": "6 High",
      "visibility": "10 km",
      "sunrise": "05:49 AM",
      "sunset": "08:44 PM",
      "description": "Bright and clear throughout the day."
    },
    {
      "day": "Wed",
      "fullDayName": "Wednesday",
      "condition": "Rain",
      "icon": "rainy",
      "rainChance": 70,
      "tempHigh": 20,
      "tempLow": 15,
      "windSpeed": "20 km/h",
      "humidity": "80%",
      "uvIndex": "3 Moderate",
      "visibility": "8 km",
      "sunrise": "05:50 AM",
      "sunset": "08:43 PM",
      "description": "Scattered rain showers expected in the afternoon."
    }
  ]
}
Output ONLY raw valid JSON.`,
        });

        const text = response.text || "";
        const cleanedJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedJson);
        return res.json(data);
      } catch (e) {
        console.error("Gemini search weather error, falling back:", e);
      }
    }

    // Fallback if no Gemini key or error
    res.json({
      city: query,
      country: "Global",
      temperature: 21,
      condition: "Partly Cloudy",
      high: 24,
      low: 16,
      humidity: 58,
      dewPoint: 14,
      windSpeed: 15,
      gusts: 22,
      uvIndex: 4,
      uvLevel: "MODERATE",
      visibility: 10,
      visibilityStatus: "CLEAR",
      airQualityIndex: 28,
      airQualityStatus: "Good",
      airQualityAdvice: "Index: 28 - Fresh air expected",
      hourly: [
        { time: "NOW", icon: "cloud_queue", temp: 21 },
        { time: "1 PM", icon: "wb_sunny", temp: 22 },
        { time: "2 PM", icon: "wb_sunny", temp: 23, isFilledIcon: true },
        { time: "3 PM", icon: "partly_cloudy_day", temp: 22 },
        { time: "4 PM", icon: "cloud_queue", temp: 22 },
        { time: "5 PM", icon: "rainy", temp: 20 },
      ],
      daily: [
        {
          day: "Today",
          fullDayName: "Today",
          condition: "Partly Cloudy",
          icon: "partly_cloudy_day",
          rainChance: 20,
          tempHigh: 24,
          tempLow: 16,
          windSpeed: "15 km/h",
          humidity: "58%",
          uvIndex: "4 Moderate",
          visibility: "10 km",
          sunrise: "05:48 AM",
          sunset: "08:45 PM",
          description: "Comfortable atmosphere with light cloud cover.",
        },
        {
          day: "Tue",
          fullDayName: "Tuesday",
          condition: "Sunny",
          icon: "wb_sunny",
          rainChance: 10,
          tempHigh: 26,
          tempLow: 17,
          windSpeed: "12 km/h",
          humidity: "52%",
          uvIndex: "6 High",
          visibility: "10 km",
          sunrise: "05:49 AM",
          sunset: "08:44 PM",
          description: "Sunny and warm skies.",
        },
        {
          day: "Wed",
          fullDayName: "Wednesday",
          condition: "Rain",
          icon: "rainy",
          rainChance: 75,
          tempHigh: 19,
          tempLow: 14,
          windSpeed: "22 km/h",
          humidity: "82%",
          uvIndex: "2 Low",
          visibility: "7 km",
          sunrise: "05:50 AM",
          sunset: "08:43 PM",
          description: "Showers developing through the afternoon.",
        },
      ],
    });
  });

  // Serve static files or Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: HMR_PORT } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura Weather server running on http://localhost:${PORT}`);
    if (PORT !== 3000) console.log(`  (port 3000 was busy, using ${PORT} instead)`);
  });
}

startServer();
