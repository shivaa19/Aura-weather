import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SevereAlert } from '../types';

interface SevereAlertModalProps {
  alert: SevereAlert;
  onClose: () => void;
}

interface LiveBriefing {
  source: string;
  updatedAt: string;
  timezone: string;
  coordinates: { latitude: number; longitude: number };
  current: { temperature: number; feelsLike: number; humidity: number; condition: string; precipitation: number; wind: number; gusts: number; isDay: boolean };
  risk: 'low' | 'elevated' | 'high';
  timing: string | null;
  timeline: Array<{ time: string; condition: string; rainChance: number; precipitation: number; gusts: number; visibility: number }>;
  note: string;
}

const riskStyle = {
  low: { label: 'LOW FORECAST RISK', color: 'text-emerald-300', border: 'border-emerald-400/50', bg: 'bg-emerald-500/15' },
  elevated: { label: 'ELEVATED FORECAST RISK', color: 'text-amber-300', border: 'border-amber-400/50', bg: 'bg-amber-500/15' },
  high: { label: 'HIGH FORECAST RISK', color: 'text-[#ff7850]', border: 'border-[#ff3e00]/60', bg: 'bg-[#ff3e00]/15' },
};

const localTime = (time: string) => time?.slice(11, 16) || '--:--';

export const SevereAlertModal: React.FC<SevereAlertModalProps> = ({ alert, onClose }) => {
  const [briefing, setBriefing] = useState<LiveBriefing | null>(null);
  const [status, setStatus] = useState<'locating' | 'loading' | 'error' | 'ready'>('locating');
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const requested = useRef(false);

  const loadBriefing = useCallback((latitude: number, longitude: number) => {
    setStatus('loading');
    setError('');
    fetch(`/api/location-briefing?lat=${latitude}&lng=${longitude}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load live forecast.');
        return data as LiveBriefing;
      })
      .then((data) => {
        setBriefing(data);
        setStatus('ready');
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
        setStatus('error');
      });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('This browser does not support location access.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadBriefing(coords.latitude, coords.longitude),
      () => {
        setError('Location permission is needed to show a forecast for your exact area.');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }, [loadBriefing]);

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  const handleShare = () => {
    const text = briefing
      ? `${riskStyle[briefing.risk].label} near my location. Current: ${briefing.current.condition}, ${briefing.current.temperature}°C. ${briefing.timing ? `First elevated conditions: ${localTime(briefing.timing)}.` : 'No elevated conditions forecast in the next hours.'}`
      : alert.summary;
    if (navigator.share) navigator.share({ title: 'Aura Weather local briefing', text, url: window.location.href }).catch(() => {});
    else window.alert(text);
  };

  const risk = briefing ? riskStyle[briefing.risk] : riskStyle.elevated;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0f0f0f] text-[#f0f0f0] animate-fade-in">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#141414]/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/10" aria-label="Close"><span className="material-symbols-outlined text-2xl">close</span></button>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff7850] sm:text-xs sm:tracking-[0.25em]">LOCAL WEATHER BRIEFING</span>
        </div>
        <button onClick={handleShare} className="flex items-center gap-2 rounded-xl bg-[#ff3e00] px-3 py-2 text-[10px] font-bold uppercase text-black sm:px-4 sm:text-xs"><span className="material-symbols-outlined text-sm">share</span><span className="hidden sm:inline">Share</span></button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 pb-28 pt-6 sm:px-6">
        <section className={`overflow-hidden rounded-2xl border ${risk.border} bg-[#141414] shadow-2xl`}>
          <div className="p-6 text-center sm:p-8">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${risk.bg} ${risk.color}`}><span className="material-symbols-outlined text-3xl">{briefing?.risk === 'high' ? 'warning' : 'cloud'}</span></div>
            <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${risk.color}`}>Live location forecast</p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              {status === 'ready' ? risk.label : status === 'locating' ? 'Finding your location…' : status === 'loading' ? 'Checking local forecast…' : 'Location forecast unavailable'}
            </h1>
            {briefing && <p className="mt-3 text-sm text-slate-300">Updated {localTime(briefing.updatedAt)} {briefing.timezone} · {briefing.coordinates.latitude.toFixed(3)}°, {briefing.coordinates.longitude.toFixed(3)}°</p>}
            {status === 'error' && <><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">{error}</p><button onClick={requestLocation} className="mt-5 rounded-xl bg-[#ff3e00] px-5 py-2.5 text-xs font-bold uppercase text-black">Use my location</button></>}
          </div>
        </section>

        {briefing && <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['thermostat', 'Now', `${briefing.current.temperature}°C`, `Feels ${briefing.current.feelsLike}°C`],
              ['air', 'Wind', `${briefing.current.wind} km/h`, `Gusts ${briefing.current.gusts} km/h`],
              ['water_drop', 'Rain now', `${briefing.current.precipitation} mm`, `${briefing.current.humidity}% humidity`],
              ['cloud', 'Conditions', briefing.current.condition, briefing.timing ? `Risk from ${localTime(briefing.timing)}` : 'No risk signal soon'],
            ].map(([icon, label, value, sub]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#141414] p-4"><span className="material-symbols-outlined text-[#ff7850]">{icon}</span><p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-400">{sub}</p></div>)}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff7850]">What may happen, and when</p><h2 className="mt-1 text-lg font-bold text-white">Next 8 hours</h2></div><span className="text-[10px] font-bold uppercase text-slate-400">Model forecast</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {briefing.timeline.map((hour) => <div key={hour.time} className={`rounded-xl border p-3 ${hour.condition === 'Thunderstorm' || hour.rainChance >= 60 ? 'border-[#ff3e00]/50 bg-[#ff3e00]/10' : 'border-white/10 bg-black/20'}`}><p className="font-mono text-xs font-bold text-white">{localTime(hour.time)}</p><p className="mt-2 text-xs text-slate-200">{hour.condition}</p><p className="mt-2 text-[11px] text-[#ff9a7d]">Rain {hour.rainChance}%</p><p className="text-[11px] text-slate-400">Gust {hour.gusts} km/h</p></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-6">
            <div className="flex gap-3"><span className="material-symbols-outlined text-[#ff7850]">health_and_safety</span><div><h2 className="font-serif text-2xl text-white">What to do</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">{briefing.risk === 'high' ? 'Avoid exposed outdoor activity around the forecast risk time. Move indoors if thunder is heard, secure loose objects, and check official local alerts.' : briefing.risk === 'elevated' ? 'Keep rain protection ready and allow extra travel time. Recheck conditions before outdoor plans, especially near the forecast risk window.' : 'No elevated weather signal is forecast in the next eight hours. Continue to check updates if you have outdoor plans.'}</p></div></div>
            <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-slate-400">{briefing.note}</p>
          </section>
        </>}

        {(status === 'locating' || status === 'loading') && <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 text-center text-sm text-slate-300"><span className="material-symbols-outlined animate-spin text-[#ff7850]">progress_activity</span><p className="mt-3">Loading conditions for your exact location…</p></div>}

        <button onClick={() => { setAcknowledged(true); window.setTimeout(onClose, 500); }} className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-bold uppercase tracking-widest ${acknowledged ? 'bg-emerald-500 text-black' : 'bg-[#ff3e00] text-black hover:bg-white'}`}><span className="material-symbols-outlined">{acknowledged ? 'check_circle' : 'done'}</span>{acknowledged ? 'Briefing acknowledged' : 'Acknowledge briefing'}</button>
      </main>
    </div>
  );
};
