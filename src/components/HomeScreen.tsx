import React, { useState } from 'react';
import { WeatherData, UserSettings, SevereAlert } from '../types';
import { formatTemp, formatSpeed } from '../data/mockWeather';
import { SunArcWidget } from './SunArcWidget';
import { getIconAnimClass } from '../utils/iconAnimation';

interface HomeScreenProps {
  weather: WeatherData;
  settings: UserSettings;
  onViewForecastClick: () => void;
  onOpenRadar: () => void;
  onViewSevereAlertClick: () => void;
  onOpenAiStudio?: (feature?: 'voice' | 'grounding' | 'music' | 'pro') => void;
  severeAlert?: SevereAlert | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  weather,
  settings,
  onViewForecastClick,
  onOpenRadar,
  onViewSevereAlertClick,
  onOpenAiStudio,
  severeAlert,
}) => {
  const [aiInsight, setAiInsight] = useState<{
    briefing: string;
    outfit: string;
    activityRating: string;
    activityAdvice: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleFetchAiBriefing = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: weather.city,
          condition: weather.condition,
          temp: weather.temperature,
          humidity: weather.humidity,
          wind: weather.windSpeed,
        }),
      });
      const data = await res.json();
      setAiInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8 animate-fade-in text-[#F0F0F0]">
      {/* Severe Weather Alert Ribbon (if present) */}
      {severeAlert && (
        <section
          onClick={onViewSevereAlertClick}
          className="glass-card rounded-2xl p-4 border border-[#FF3E00]/60 bg-[#1F0802]/90 flex items-center justify-between cursor-pointer hover:bg-[#2A0C03] transition-all shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-[#FF3E00]/20 p-2 rounded-full alert-pulse text-[#FF3E00]">
              <span className="material-symbols-outlined text-[#FF3E00] fill-icon">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F0F0F0] text-sm tracking-wide uppercase font-mono">
                  {severeAlert.title}
                </span>
                <span className="text-[10px] bg-[#FF3E00] text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {severeAlert.expiresTime}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
                {severeAlert.summary}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </section>
      )}

      {/* Hero Weather Section with Artistic Flair Typography */}
      <section className="flex flex-col items-center justify-center text-center py-6 relative">
        {/* Subtle Watermark Year/Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.03] text-9xl font-bold font-serif">
          METEO
        </div>

        <div className="mb-2">
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FF3E00]">
            LOCATION — {weather.city}, {weather.country}
          </span>
        </div>
        <div className="flex items-center justify-center my-2">
          <span className="font-serif font-light text-8xl md:text-9xl text-[#F0F0F0] leading-none tracking-tighter">
            {formatTemp(weather.temperature, settings.tempUnit)}
          </span>
        </div>
        <div className="mt-2 flex flex-col items-center space-y-1">
          <span className="font-serif italic text-2xl md:text-3xl text-[#FF3E00] font-normal">
            {weather.condition}
          </span>
          <div className="flex gap-6 mt-2 text-xs uppercase tracking-widest text-gray-400 font-mono">
            <span>HIGH: <strong className="text-white">{formatTemp(weather.high, settings.tempUnit)}</strong></span>
            <span className="text-white/20">|</span>
            <span>LOW: <strong className="text-white">{formatTemp(weather.low, settings.tempUnit)}</strong></span>
          </div>
        </div>
      </section>

      {/* Hourly Forecast Carousel */}
      <section className="space-y-3">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-gray-400">
            HOURLY ATMOSPHERE
          </span>
          <button
            onClick={onViewForecastClick}
            className="text-[10px] tracking-widest uppercase font-bold text-[#FF3E00] hover:text-white transition-colors cursor-pointer"
          >
            SEE 7-DAY →
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
          {weather.hourly.map((item, idx) => (
            <div
              key={idx}
              className={`${
                idx === 0
                  ? 'bg-[#FF3E00] text-black font-bold border border-[#FF3E00]'
                  : 'glass-card text-[#F0F0F0]'
              } flex-shrink-0 w-20 py-4 flex flex-col items-center justify-center rounded-xl space-y-2.5 transition-all hover:scale-105`}
            >
              <span className={`text-[11px] uppercase font-mono tracking-wider ${idx === 0 ? 'text-black font-bold' : 'text-gray-400'}`}>
                {item.time}
              </span>
              <span
                className={`material-symbols-outlined ${idx === 0 ? 'text-black' : 'text-[#FF3E00]'} ${getIconAnimClass(item.icon)}`}
                style={item.isFilledIcon ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className={`text-base font-serif ${idx === 0 ? 'font-bold' : 'font-normal'}`}>
                {formatTemp(item.temp, settings.tempUnit)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Humidity */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-36 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[#FF3E00] text-[20px] ${getIconAnimClass('humidity_low')}`}>humidity_low</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">HUMIDITY</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-medium">{weather.humidity}%</span>
            <span className="text-xs text-gray-400 mt-1 font-mono">
              Dew: {formatTemp(weather.dewPoint, settings.tempUnit)}
            </span>
          </div>
        </div>

        {/* Wind */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-36 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[#FF3E00] text-[20px] ${getIconAnimClass('air')}`}>air</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">WIND</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-medium">
              {formatSpeed(weather.windSpeed, settings.distanceUnit)}
            </span>
            <span className="text-xs text-gray-400 mt-1 font-mono">
              GUSTS: {formatSpeed(weather.gusts, settings.distanceUnit)}
            </span>
          </div>
        </div>

        {/* UV Index */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-36 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[#FF3E00] text-[20px] ${getIconAnimClass('wb_sunny')}`}>wb_sunny</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">UV INDEX</span>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-3xl font-serif font-medium">{weather.uvIndex}</span>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF3E00]"
                style={{ width: `${Math.min(weather.uvIndex * 10, 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-[#FF3E00] tracking-widest uppercase">
              {weather.uvLevel}
            </span>
          </div>
        </div>

        {/* Visibility */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-36 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[#FF3E00] text-[20px] ${getIconAnimClass('visibility')}`}>visibility</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">VISIBILITY</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-medium">
              {weather.visibility} <small className="text-sm font-sans font-normal">km</small>
            </span>
            <span className="text-xs text-gray-400 mt-1 tracking-wider uppercase font-bold font-mono">
              {weather.visibilityStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Sun Arc Solar Motion Component */}
      <SunArcWidget
        sunriseTime={weather.daily[0]?.sunrise || '06:15 AM'}
        sunsetTime={weather.daily[0]?.sunset || '08:22 PM'}
        cityName={weather.city}
      />

      {/* Daily Forecast List */}
      <section className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-[10px] text-[#FF3E00] uppercase tracking-[0.25em] font-bold">
            7-DAY EXTENDED FORECAST
          </h3>
          <span className="text-xs text-gray-400 font-mono">LONDON / UK</span>
        </div>
        <div className="space-y-4">
          {weather.daily.slice(0, 4).map((day, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
              <span className="w-20 font-serif text-base md:text-lg text-white">
                {day.day}
              </span>
              <span
                className={`material-symbols-outlined text-[#FF3E00] ${getIconAnimClass(day.icon)}`}
                style={day.isFilledIcon ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {day.icon}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-mono text-xs md:text-sm">
                  {formatTemp(day.tempLow, settings.tempUnit)}
                </span>
                <div className="w-24 md:w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 bg-[#FF3E00] rounded-full"
                    style={{
                      left: `${Math.max(10, i * 15)}%`,
                      right: `${Math.max(15, 40 - i * 10)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-[#F0F0F0] font-mono text-xs md:text-sm w-8 text-right font-bold">
                  {formatTemp(day.tempHigh, settings.tempUnit)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onViewForecastClick}
          className="w-full py-3.5 mt-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold tracking-[0.2em] text-[#F0F0F0] hover:bg-[#FF3E00] hover:text-black hover:border-[#FF3E00] active:scale-98 transition-all cursor-pointer uppercase"
        >
          VIEW COMPLETE 7-DAY ARCHIVE →
        </button>
      </section>

      {/* AI Features Hub Section */}
      <section className="glass-card rounded-2xl p-6 border border-[#809fff]/40 space-y-4 relative overflow-hidden bg-[#11192e]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#809fff]/20 rounded-xl flex items-center justify-center text-[#809fff]">
              <span className="material-symbols-outlined text-2xl">sparkles</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#809fff] block">
                GEMINI AI POWERED
              </span>
              <h4 className="font-serif italic text-lg text-[#F0F0F0]">Interactive AI Suite</h4>
            </div>
          </div>
          {onOpenAiStudio && (
            <button
              id="open-ai-suite-btn"
              onClick={() => onOpenAiStudio('voice')}
              className="px-3.5 py-1.5 rounded-full bg-[#809fff]/20 text-[#809fff] border border-[#809fff]/40 font-mono text-[10px] uppercase font-bold hover:bg-[#809fff]/30 transition-all flex items-center gap-1"
            >
              Open Studio →
            </button>
          )}
        </div>

        {/* 4 Feature Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <button
            id="ai-quick-voice-btn"
            onClick={() => onOpenAiStudio?.('voice')}
            className="p-3.5 rounded-xl bg-[#18233c] border border-[#2d3e66] hover:border-[#809fff] text-left flex flex-col justify-between h-28 group transition-all"
          >
            <div className="flex justify-between items-center text-[#809fff]">
              <span className="material-symbols-outlined text-xl">graphic_eq</span>
              <span className="text-[9px] font-mono bg-[#809fff]/20 px-1.5 py-0.5 rounded text-[#809fff]">3.1 Live</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-[#809fff]">Voice Dispatch</span>
              <span className="text-[10px] text-gray-400">Real-time live call</span>
            </div>
          </button>

          <button
            id="ai-quick-grounding-btn"
            onClick={() => onOpenAiStudio?.('grounding')}
            className="p-3.5 rounded-xl bg-[#18233c] border border-[#2d3e66] hover:border-[#809fff] text-left flex flex-col justify-between h-28 group transition-all"
          >
            <div className="flex justify-between items-center text-[#809fff]">
              <span className="material-symbols-outlined text-xl">travel_explore</span>
              <span className="text-[9px] font-mono bg-[#809fff]/20 px-1.5 py-0.5 rounded text-[#809fff]">3.5 Flash</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-[#809fff]">Search & Maps</span>
              <span className="text-[10px] text-gray-400">Grounded live data</span>
            </div>
          </button>

          <button
            id="ai-quick-music-btn"
            onClick={() => onOpenAiStudio?.('music')}
            className="p-3.5 rounded-xl bg-[#18233c] border border-[#2d3e66] hover:border-[#809fff] text-left flex flex-col justify-between h-28 group transition-all"
          >
            <div className="flex justify-between items-center text-[#809fff]">
              <span className="material-symbols-outlined text-xl">music_note</span>
              <span className="text-[9px] font-mono bg-[#809fff]/20 px-1.5 py-0.5 rounded text-[#809fff]">Lyria 3</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-[#809fff]">Weather Music</span>
              <span className="text-[10px] text-gray-400">Compose ambient tracks</span>
            </div>
          </button>

          <button
            id="ai-quick-pro-btn"
            onClick={() => onOpenAiStudio?.('pro')}
            className="p-3.5 rounded-xl bg-[#18233c] border border-[#2d3e66] hover:border-[#809fff] text-left flex flex-col justify-between h-28 group transition-all"
          >
            <div className="flex justify-between items-center text-[#809fff]">
              <span className="material-symbols-outlined text-xl">psychology</span>
              <span className="text-[9px] font-mono bg-[#809fff]/20 px-1.5 py-0.5 rounded text-[#809fff]">3.1 Pro</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-[#809fff]">Deep Analysis</span>
              <span className="text-[10px] text-gray-400">Climate reasoning</span>
            </div>
          </button>
        </div>
      </section>

      {/* AI Meteorologist Briefing Card */}
      <section className="glass-card rounded-2xl p-6 border border-[#FF3E00]/40 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF3E00]/20 rounded-xl flex items-center justify-center text-[#FF3E00]">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#FF3E00] block">
                EDITORIAL BRIEFING
              </span>
              <h4 className="font-serif italic text-lg text-[#F0F0F0]">AI Atmospheric Insight</h4>
            </div>
          </div>
          <button
            onClick={handleFetchAiBriefing}
            disabled={loadingAi}
            className="px-4 py-2 bg-[#FF3E00] text-black rounded-xl text-xs font-bold hover:bg-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            {loadingAi ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-sm">sparkles</span>
            )}
            {aiInsight ? 'Refresh Briefing' : 'Generate Briefing'}
          </button>
        </div>

        {aiInsight ? (
          <div className="space-y-3 pt-3 text-xs md:text-sm text-gray-200 leading-relaxed border-t border-white/10">
            <p className="font-serif italic text-base text-[#F0F0F0]">"{aiInsight.briefing}"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF3E00] block mb-1">
                  EDITORIAL STYLE GUIDE
                </span>
                <p className="text-xs text-gray-300">{aiInsight.outfit}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF3E00] block mb-1">
                  OUTDOOR RATING ({aiInsight.activityRating})
                </span>
                <p className="text-xs text-gray-300">{aiInsight.activityAdvice}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic pt-1">
            Generate an AI-curated editorial briefing with clothing advice and atmospheric guidance.
          </p>
        )}
      </section>

      {/* Air Quality CTA */}
      <section
        onClick={onOpenRadar}
        className="glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-[#FF3E00]/50 transition-all active:scale-[0.99] border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FF3E00]/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#FF3E00]">airwave</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-serif text-[#F0F0F0]">
              Air Quality: <strong className="text-[#FF3E00]">{weather.airQualityStatus}</strong>
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              {weather.airQualityAdvice}
            </span>
          </div>
        </div>
        <button className="material-symbols-outlined text-[#FF3E00]">chevron_right</button>
      </section>
    </main>
  );
};
