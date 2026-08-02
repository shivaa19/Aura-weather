import React, { useState, useEffect, useRef } from 'react';
import { WeatherData } from '../types';
import { playPcmChunk, resetAudioOutput, floatTo16BitPCM, arrayBufferToBase64 } from '../utils/audioUtils';

interface AiStudioModalProps {
  weather: WeatherData;
  onClose: () => void;
  initialFeature?: 'voice' | 'grounding' | 'music' | 'pro';
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ weather, onClose, initialFeature = 'voice' }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'grounding' | 'music' | 'pro'>(initialFeature);

  // --- Voice Assistant State ---
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Ready to connect');
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // --- Search & Maps Grounding State ---
  const [groundingQuery, setGroundingQuery] = useState(`Live weather alerts and events in ${weather.city}`);
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps'>('search');
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingResult, setGroundingResult] = useState<{ text: string; groundingChunks: any[] } | null>(null);

  // --- Music Generation State ---
  const [musicPrompt, setMusicPrompt] = useState(`Soothing 30-second ambient soundscape for a ${weather.condition.toLowerCase()} day in ${weather.city}`);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicAudioUrl, setMusicAudioUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string>('');

  // --- Pro Deep Analysis State ---
  const [proLoading, setProLoading] = useState(false);
  const [proAnalysis, setProAnalysis] = useState<{
    climateSummary?: string;
    healthAdvisory?: string;
    travelImpact?: string;
    idealWindow?: string;
    stormProbability?: string;
  } | null>(null);

  // Clean up voice connection on unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  // --- Voice Handler Methods ---
  const startVoiceSession = async () => {
    try {
      setVoiceStatus('Connecting to Gemini Live...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsVoiceConnected(true);
        setVoiceStatus('Connected. Starting microphone...');
        startMicrophone(ws);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) {
            setVoiceStatus(`Error: ${data.error}`);
            stopVoiceSession();
            return;
          }
          if (data.audio) {
            setVoiceStatus('AI Meteorologist speaking...');
            playPcmChunk(data.audio);
          }
          if (data.interrupted) {
            resetAudioOutput();
            setVoiceStatus('Interrupted - listening...');
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setVoiceStatus('Connection error');
      };

      ws.onclose = () => {
        setIsVoiceConnected(false);
        setIsMicActive(false);
        setVoiceStatus('Disconnected');
        resetAudioOutput();
      };
    } catch (e: any) {
      setVoiceStatus(`Failed to connect: ${e.message}`);
    }
  };

  const startMicrophone = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBuffer = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      setIsMicActive(true);
      setVoiceStatus('Live Voice Active — Speak now');
    } catch (err: any) {
      setVoiceStatus(`Microphone access error: ${err.message}`);
    }
  };

  const stopVoiceSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    resetAudioOutput();
    setIsVoiceConnected(false);
    setIsMicActive(false);
    setVoiceStatus('Session stopped');
  };

  // --- Grounding Fetch ---
  const handleFetchGrounding = async () => {
    if (!groundingQuery.trim()) return;
    setGroundingLoading(true);
    setGroundingResult(null);

    try {
      const res = await fetch('/api/grounded-weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: groundingQuery, mode: groundingMode }),
      });
      const data = await res.json();
      setGroundingResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGroundingLoading(false);
    }
  };

  // --- Music Generation Fetch ---
  const handleGenerateMusic = async (presetPrompt?: string) => {
    const promptToUse = presetPrompt || musicPrompt;
    setMusicLoading(true);
    setMusicAudioUrl(null);
    setMusicLyrics('');

    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const binary = window.atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setMusicAudioUrl(url);
        setMusicLyrics(data.lyrics || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMusicLoading(false);
    }
  };

  // --- Pro Analysis Fetch ---
  const handleFetchProAnalysis = async () => {
    setProLoading(true);
    try {
      const res = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: weather.city,
          condition: weather.condition,
          temp: weather.temperature,
          high: weather.high,
          low: weather.low,
          humidity: weather.humidity,
          wind: weather.windSpeed,
          uvIndex: weather.uvIndex,
          airQualityIndex: weather.airQualityIndex,
        }),
      });
      const data = await res.json();
      setProAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        id="ai-studio-modal"
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#11192e]/95 border border-[#425580]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#dae2fd]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2d3a5a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#3f51b5] to-[#809fff] text-white shadow-lg">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                Gemini AI Weather Suite
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wide uppercase bg-[#809fff]/20 text-[#809fff] border border-[#809fff]/40 rounded-full">
                  Live & Grounded
                </span>
              </h2>
              <p className="text-xs text-gray-400">Powered by Gemini 3.6, 3.5 Flash & Lyria Models</p>
            </div>
          </div>

          <button
            id="close-ai-studio-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex border-b border-[#2d3a5a] bg-[#0c1324] px-4 overflow-x-auto no-scrollbar">
          <button
            id="ai-tab-voice"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'voice'
                ? 'border-[#809fff] text-[#809fff] bg-[#809fff]/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">graphic_eq</span>
            Live Voice Assistant
          </button>

          <button
            id="ai-tab-grounding"
            onClick={() => setActiveTab('grounding')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'grounding'
                ? 'border-[#809fff] text-[#809fff] bg-[#809fff]/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            Search & Maps Grounding
          </button>

          <button
            id="ai-tab-music"
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'music'
                ? 'border-[#809fff] text-[#809fff] bg-[#809fff]/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">music_note</span>
            Lyria Weather Music
          </button>

          <button
            id="ai-tab-pro"
            onClick={() => setActiveTab('pro')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'pro'
                ? 'border-[#809fff] text-[#809fff] bg-[#809fff]/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            3.1 Pro Atmospheric Report
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Live Voice Assistant */}
          {activeTab === 'voice' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-[#18233c] border border-[#2d3e66] flex flex-col items-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isVoiceConnected
                        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#809fff] shadow-[0_0_40px_rgba(59,130,246,0.6)] animate-pulse'
                        : 'bg-[#22304d] text-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-4xl text-white">
                      {isVoiceConnected ? 'graphic_eq' : 'mic_off'}
                    </span>
                  </div>
                  {isMicActive && (
                    <div className="absolute -inset-2 border-2 border-[#809fff] rounded-full animate-ping opacity-30"></div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Gemini Live Voice Dispatcher</h3>
                  <p className="text-xs text-gray-300 mt-1 max-w-md">
                    Speak naturally in real-time with model <code className="text-[#809fff]">gemini-3.1-flash-live-preview</code> to ask about weather forecasts, regional storm risks, or what to wear today.
                  </p>
                </div>

                <div className="px-4 py-1.5 rounded-full bg-[#11192e] border border-[#3b4b73] text-xs font-mono text-[#809fff] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isVoiceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                  {voiceStatus}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {!isVoiceConnected ? (
                    <button
                      id="start-live-voice-btn"
                      onClick={startVoiceSession}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#809fff] text-white font-semibold text-sm shadow-lg hover:shadow-[#3b82f6]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">mic</span>
                      Start Live Voice Call
                    </button>
                  ) : (
                    <button
                      id="stop-live-voice-btn"
                      onClick={stopVoiceSession}
                      className="px-6 py-2.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold text-sm hover:bg-rose-500/30 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">call_end</span>
                      End Live Call
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#141e33] border border-[#273757]">
                  <span className="text-[#809fff] font-bold block mb-1">Suggested Prompt 1:</span>
                  "Hey Gemini, give me a quick atmospheric summary for {weather.city} right now."
                </div>
                <div className="p-3.5 rounded-xl bg-[#141e33] border border-[#273757]">
                  <span className="text-[#809fff] font-bold block mb-1">Suggested Prompt 2:</span>
                  "What clothing layers should I pack if I'm walking outside in {weather.city} today?"
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Search & Maps Grounding */}
          {activeTab === 'grounding' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Google Search & Maps Data Grounding</h3>
                  <p className="text-xs text-gray-400">
                    Uses <code className="text-[#809fff]">gemini-3.5-flash</code> with real-time Search or Maps grounding to get up-to-date accurate information.
                  </p>
                </div>

                <div className="flex bg-[#0d1424] p-1 rounded-xl border border-[#273859]">
                  <button
                    id="grounding-mode-search"
                    onClick={() => setGroundingMode('search')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      groundingMode === 'search' ? 'bg-[#3b82f6] text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    Search Grounding
                  </button>
                  <button
                    id="grounding-mode-maps"
                    onClick={() => setGroundingMode('maps')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      groundingMode === 'maps' ? 'bg-[#3b82f6] text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">pin_drop</span>
                    Maps Grounding
                  </button>
                </div>
              </div>

              {/* Query Input */}
              <div className="flex gap-2">
                <input
                  id="grounding-query-input"
                  type="text"
                  value={groundingQuery}
                  onChange={(e) => setGroundingQuery(e.target.value)}
                  placeholder={
                    groundingMode === 'search'
                      ? 'Search live weather news, alerts, regional forecasts...'
                      : 'Search emergency shelters, warming centers, scenic spots in city...'
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0d1424] border border-[#2c3d61] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6]"
                />
                <button
                  id="grounding-fetch-btn"
                  onClick={handleFetchGrounding}
                  disabled={groundingLoading}
                  className="px-5 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {groundingLoading ? (
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">send</span>
                  )}
                  Execute
                </button>
              </div>

              {/* Grounding Results Box */}
              {groundingResult && (
                <div className="p-5 rounded-2xl bg-[#141f36] border border-[#2a3c63] space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[#809fff] font-bold mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                      Grounded Gemini Output
                    </h4>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{groundingResult.text}</p>
                  </div>

                  {/* Grounding Sources */}
                  {groundingResult.groundingChunks && groundingResult.groundingChunks.length > 0 && (
                    <div className="pt-3 border-t border-[#233352]">
                      <h5 className="text-xs text-gray-400 font-semibold mb-2">Sources & Web/Maps Citations:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groundingResult.groundingChunks.map((chunk, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#0c1322] border border-[#20304f] text-xs hover:border-[#3b82f6]/50 transition-all"
                          >
                            {chunk.web && (
                              <a
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#809fff] hover:underline font-semibold line-clamp-1 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">link</span>
                                {chunk.web.title || chunk.web.uri}
                              </a>
                            )}
                            {chunk.maps && (
                              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">place</span>
                                {chunk.maps.title || 'Maps Location Entry'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Lyria Weather Music */}
          {activeTab === 'music' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-white">Lyria Weather Ambient Music Generator</h3>
                <p className="text-xs text-gray-400">
                  Generates short 30-second atmospheric soundtrack clips using model <code className="text-[#809fff]">lyria-3-clip-preview</code> matched to current weather vibes.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() =>
                    handleGenerateMusic(`Chill lo-fi beats with soft gentle rain acoustic guitar for rainy weather in ${weather.city}`)
                  }
                  className="p-3 rounded-xl bg-[#141f36] border border-[#2a3c63] hover:border-[#3b82f6] text-left text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  🌧️ Rainy Day Lo-Fi
                </button>
                <button
                  onClick={() =>
                    handleGenerateMusic(`Warm bright uplifting acoustic ambient music for a sunny sky in ${weather.city}`)
                  }
                  className="p-3 rounded-xl bg-[#141f36] border border-[#2a3c63] hover:border-[#3b82f6] text-left text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  ☀️ Sunny Breeze Ambient
                </button>
                <button
                  onClick={() =>
                    handleGenerateMusic(`Deep cinematic thunder ambient synth soundscape with electric pads for stormy weather`)
                  }
                  className="p-3 rounded-xl bg-[#141f36] border border-[#2a3c63] hover:border-[#3b82f6] text-left text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  🌩️ Stormy Synth Symphony
                </button>
                <button
                  onClick={() =>
                    handleGenerateMusic(`Peaceful slow acoustic piano and atmospheric drone for evening sunset chill`)
                  }
                  className="p-3 rounded-xl bg-[#141f36] border border-[#2a3c63] hover:border-[#3b82f6] text-left text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  🌅 Sunset Piano Calm
                </button>
              </div>

              {/* Custom Prompt Input */}
              <div className="flex gap-2">
                <input
                  id="music-prompt-input"
                  type="text"
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="Describe ambient weather soundtrack..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0d1424] border border-[#2c3d61] text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                />
                <button
                  id="music-generate-btn"
                  onClick={() => handleGenerateMusic()}
                  disabled={musicLoading}
                  className="px-5 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {musicLoading ? (
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">music_note</span>
                  )}
                  Compose Clip
                </button>
              </div>

              {/* Music Player Output */}
              {musicAudioUrl && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141f36] to-[#1c2b4d] border border-[#30446e] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#809fff] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">graphic_eq</span>
                      Generated Lyria 3 Track
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      30s WAV Clip
                    </span>
                  </div>

                  <audio controls src={musicAudioUrl} className="w-full rounded-lg" autoPlay />

                  {musicLyrics && (
                    <div className="text-xs text-gray-300 bg-[#0b1220] p-3 rounded-lg border border-[#223354]">
                      <span className="font-semibold text-gray-400 block mb-1">Generated Lyrics/Description:</span>
                      {musicLyrics}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Gemini 3.1 Pro Atmospheric Diagnostics */}
          {activeTab === 'pro' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Gemini 3.1 Pro Multi-Variable Atmospheric Analysis</h3>
                  <p className="text-xs text-gray-400">
                    Advanced reasoning breakdown using model <code className="text-[#809fff]">gemini-3.1-pro-preview</code> for complex meteorological factors.
                  </p>
                </div>

                <button
                  id="run-pro-analysis-btn"
                  onClick={handleFetchProAnalysis}
                  disabled={proLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#809fff] to-[#3b82f6] text-white font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  {proLoading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">analytics</span>
                  )}
                  Run 3.1 Pro Analysis
                </button>
              </div>

              {!proAnalysis && !proLoading && (
                <div className="p-8 text-center rounded-2xl bg-[#121c30] border border-[#253554] text-gray-400 text-sm">
                  Click <strong className="text-white">Run 3.1 Pro Analysis</strong> above to generate a multi-variable climate & travel safety report for {weather.city}.
                </div>
              )}

              {proLoading && (
                <div className="p-8 text-center rounded-2xl bg-[#121c30] border border-[#253554] text-gray-300 text-sm space-y-3">
                  <span className="material-symbols-outlined text-3xl text-[#809fff] animate-spin">progress_activity</span>
                  <p>Processing atmospheric data with Gemini 3.1 Pro...</p>
                </div>
              )}

              {proAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#141f36] border border-[#283b61]">
                    <h4 className="text-xs font-bold text-[#809fff] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">thermostat</span>
                      Climate & Comfort Breakdown
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed">{proAnalysis.climateSummary}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141f36] border border-[#283b61]">
                    <h4 className="text-xs font-bold text-[#809fff] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                      Health & UV Advisory
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed">{proAnalysis.healthAdvisory}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141f36] border border-[#283b61]">
                    <h4 className="text-xs font-bold text-[#809fff] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">commute</span>
                      Travel & Commute Impact
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed">{proAnalysis.travelImpact}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141f36] border border-[#283b61]">
                    <h4 className="text-xs font-bold text-[#809fff] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Ideal Outdoor Hours
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed">{proAnalysis.idealWindow}</p>
                  </div>

                  {proAnalysis.stormProbability && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Storm & Frontal Shift Assessment
                      </h4>
                      <p className="text-xs text-amber-100 leading-relaxed">{proAnalysis.stormProbability}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
