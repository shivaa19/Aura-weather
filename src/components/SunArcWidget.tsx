import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface SunArcWidgetProps {
  sunriseTime?: string; // e.g. "06:15 AM" or "06:15"
  sunsetTime?: string;  // e.g. "08:22 PM" or "20:22"
  cityName?: string;
}

// Helper to parse time strings like "06:15 AM" or "20:14" to minutes from midnight
function parseTimeToMinutes(timeStr: string, defaultMinutes: number): number {
  if (!timeStr) return defaultMinutes;
  try {
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const timeOnly = clean.replace(/(AM|PM)/g, '').trim();
    const [hStr, mStr] = timeOnly.split(':');
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr || '0', 10);

    if (isNaN(hours) || isNaN(minutes)) return defaultMinutes;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return defaultMinutes;
  }
}

// Format minutes to 12h time string "06:15 AM"
function formatMinutesToTime(totalMin: number): string {
  const norm = (totalMin + 1440) % 1440;
  let hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mStr} ${period}`;
}

export const SunArcWidget: React.FC<SunArcWidgetProps> = ({
  sunriseTime = '06:15 AM',
  sunsetTime = '08:22 PM',
  cityName = 'London',
}) => {
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const [isManualScrub, setIsManualScrub] = useState(false);
  const [manualMinutes, setManualMinutes] = useState<number>(12 * 60); // 12:00 PM default

  // Update live date every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sunriseMin = parseTimeToMinutes(sunriseTime, 6 * 60 + 15);
  const sunsetMin = parseTimeToMinutes(sunsetTime, 20 * 60 + 22);

  const currentMin = isManualScrub
    ? manualMinutes
    : liveDate.getHours() * 60 + liveDate.getMinutes() + liveDate.getSeconds() / 60;

  // Total daylight span
  const daylightSpan = sunsetMin > sunriseMin ? sunsetMin - sunriseMin : 1440 - (sunriseMin - sunsetMin);

  // Daylight progress [0, 1]
  let isDay = false;
  let rawProgress = 0;

  if (currentMin >= sunriseMin && currentMin <= sunsetMin) {
    isDay = true;
    rawProgress = (currentMin - sunriseMin) / daylightSpan;
  } else {
    isDay = false;
    // Night progress
    if (currentMin > sunsetMin) {
      rawProgress = 1;
    } else {
      rawProgress = 0;
    }
  }

  const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);

  // SVG Arc Geometry
  // SVG ViewBox: 0 0 320 150
  // Arc center: (160, 120), Rx: 125, Ry: 85
  const cx = 160;
  const cy = 120;
  const rx = 125;
  const ry = 85;

  // Angle theta ranges from Math.PI (sunrise at x = 35) to 0 (sunset at x = 285)
  const theta = Math.PI * (1 - clampedProgress);
  const sunX = cx - rx * Math.cos(theta);
  const sunY = cy - ry * Math.sin(theta);

  // Solar elevation angle in degrees (approximate for display)
  const elevationDeg = Math.round(Math.sin(theta) * 72); // zenith ~ 72deg

  // Time remaining calculations
  let statusLabel = '';
  let timeSubtext = '';

  if (isDay) {
    const minsUntilSunset = Math.round(sunsetMin - currentMin);
    const hrs = Math.floor(minsUntilSunset / 60);
    const mins = minsUntilSunset % 60;
    statusLabel = 'DAYLIGHT ACTIVE';
    timeSubtext = hrs > 0 ? `${hrs}h ${mins}m remaining until sunset` : `${mins}m remaining until sunset`;
  } else {
    statusLabel = 'NIGHTTIME';
    if (currentMin < sunriseMin) {
      const minsUntilSunrise = Math.round(sunriseMin - currentMin);
      const hrs = Math.floor(minsUntilSunrise / 60);
      const mins = minsUntilSunrise % 60;
      timeSubtext = `${hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`} until sunrise`;
    } else {
      const minsUntilNextSunrise = Math.round(1440 - currentMin + sunriseMin);
      const hrs = Math.floor(minsUntilNextSunrise / 60);
      const mins = minsUntilNextSunrise % 60;
      timeSubtext = `${hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`} until tomorrow's sunrise`;
    }
  }

  const dayLengthHours = Math.floor(daylightSpan / 60);
  const dayLengthMins = Math.round(daylightSpan % 60);

  return (
    <section className="glass-card rounded-2xl p-6 border border-white/10 bg-[#141414] relative overflow-hidden space-y-4 shadow-2xl">
      {/* Background Subtle Gradient Glow when sun is up */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 blur-3xl pointer-events-none transition-opacity duration-700"
        style={{
          background: isDay
            ? 'radial-gradient(circle, rgba(255,62,0,0.2) 0%, rgba(255,140,0,0.05) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(100,120,255,0.1) 0%, transparent 100%)',
          opacity: isDay ? 0.8 : 0.4,
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF3E00]/20 rounded-xl flex items-center justify-center text-[#FF3E00]">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wb_twilight
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#FF3E00] block">
              SOLAR POSITION & TRACKER
            </span>
            <h3 className="font-serif italic text-lg text-[#F0F0F0]">
              Sunrise & Sunset Arc — {cityName}
            </h3>
          </div>
        </div>

        {/* Live / Manual Toggle Badge */}
        <button
          onClick={() => {
            setIsManualScrub(!isManualScrub);
            if (!isManualScrub) {
              setManualMinutes(liveDate.getHours() * 60 + liveDate.getMinutes());
            }
          }}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
            isManualScrub
              ? 'bg-[#FF3E00] text-black border-[#FF3E00] shadow-md'
              : 'bg-black/50 text-gray-300 border-white/15 hover:border-[#FF3E00]'
          }`}
          title={isManualScrub ? 'Switch to Live Clock' : 'Interactive Solar Scrub'}
        >
          <span className="material-symbols-outlined text-sm">
            {isManualScrub ? 'tune' : 'schedule'}
          </span>
          {isManualScrub ? 'Scrubbing Mode' : 'Live Mode'}
        </button>
      </div>

      {/* Main Visual Arc Display */}
      <div className="relative py-2 flex flex-col items-center justify-center">
        {/* SVG Curve Canvas */}
        <svg
          viewBox="0 0 320 150"
          className="w-full max-w-md h-auto overflow-visible select-none"
        >
          <defs>
            {/* Arc Path Gradient */}
            <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF3E00" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFB800" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF3E00" stopOpacity="0.3" />
            </linearGradient>

            {/* Sun Glow Filter */}
            <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizon Line */}
          <line
            x1="15"
            y1="120"
            x2="305"
            y2="120"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Ground Night Base Area */}
          <rect
            x="15"
            y="120"
            width="290"
            height="25"
            fill="url(#nightGrad)"
            opacity="0.1"
          />

          {/* Full Elliptical Arc Guide (Background Dotted Arc) */}
          <path
            d={`M 35 120 A ${rx} ${ry} 0 0 1 285 120`}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Active Daylight Traversed Arc (Solid Glowing) */}
          <path
            d={`M 35 120 A ${rx} ${ry} 0 0 1 285 120`}
            fill="none"
            stroke="url(#sunArcGrad)"
            strokeWidth="3.5"
            strokeDasharray="400"
            strokeDashoffset={400 * (1 - clampedProgress)}
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Sunrise Marker (Left) */}
          <g transform="translate(35, 120)">
            <circle r="4" fill="#FF3E00" />
            <text
              y="18"
              textAnchor="middle"
              className="fill-gray-400 text-[9px] font-mono font-bold"
            >
              {sunriseTime}
            </text>
          </g>

          {/* Sunset Marker (Right) */}
          <g transform="translate(285, 120)">
            <circle r="4" fill="#FF3E00" />
            <text
              y="18"
              textAnchor="middle"
              className="fill-gray-400 text-[9px] font-mono font-bold"
            >
              {sunsetTime}
            </text>
          </g>

          {/* Zenith Midday Indicator (Top Peak) */}
          <g transform="translate(160, 35)">
            <line y1="0" y2="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text
              y="-4"
              textAnchor="middle"
              className="fill-gray-500 text-[8px] font-mono uppercase tracking-widest"
            >
              ZENITH
            </text>
          </g>

          {/* Moving Sun Icon Particle */}
          <motion.g
            animate={{ x: sunX, y: sunY }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          >
            {/* Pulsing Sun Rays Aura */}
            <circle
              r="16"
              fill={isDay ? '#FF3E00' : '#4A5568'}
              opacity="0.25"
              className={isDay ? 'animate-ping' : ''}
            />
            {/* Outer Halo Ring */}
            <circle
              r="10"
              fill={isDay ? '#FF3E00' : '#2D3748'}
              opacity="0.4"
              filter="url(#sunGlow)"
            />
            {/* Core Sun Disc */}
            <circle
              r="6.5"
              fill={isDay ? '#FFB800' : '#A0AEC0'}
              stroke={isDay ? '#FF3E00' : '#4A5568'}
              strokeWidth="1.5"
            />
            {/* Small Rays lines when day */}
            {isDay && (
              <g stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round">
                <line x1="0" y1="-10" x2="0" y2="-12" />
                <line x1="0" y1="10" x2="0" y2="12" />
                <line x1="-10" y1="0" x2="-12" y2="0" />
                <line x1="10" y1="0" x2="12" y2="0" />
              </g>
            )}
          </motion.g>
        </svg>

        {/* Current Time Badge over Sun Arc */}
        <div className="mt-1 flex items-center justify-between w-full max-w-md px-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDay ? 'bg-[#FF3E00] animate-pulse shadow-[0_0_8px_#FF3E00]' : 'bg-blue-400'
              }`}
            />
            <span className="text-[#F0F0F0] font-bold">
              {formatMinutesToTime(currentMin)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
              ALTITUDE: <strong className="text-[#FF3E00]">{isDay ? `${elevationDeg}°` : '0°'}</strong>
            </span>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
              DAY SPAN: <strong className="text-white">{dayLengthHours}h {dayLengthMins}m</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Scrub Time Slider (When in Manual Scrub Mode) */}
      {isManualScrub && (
        <div className="p-4 bg-black/60 rounded-xl border border-[#FF3E00]/40 space-y-2 animate-fade-in">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[10px] font-bold text-[#FF3E00] uppercase tracking-widest">
              SCRUB SOLAR TIME
            </span>
            <span className="font-bold text-white bg-[#FF3E00]/20 px-2.5 py-0.5 rounded border border-[#FF3E00]/40">
              {formatMinutesToTime(manualMinutes)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1439}
            step={5}
            value={manualMinutes}
            onChange={(e) => setManualMinutes(Number(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF3E00]"
          />
          <div className="flex justify-between text-[9px] font-mono text-gray-400 uppercase font-bold">
            <span>00:00 AM</span>
            <span>06:00 AM</span>
            <span>12:00 PM</span>
            <span>06:00 PM</span>
            <span>11:59 PM</span>
          </div>
        </div>
      )}

      {/* Atmospheric Day/Night Summary Bar */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="p-2 bg-[#FF3E00]/15 rounded-lg text-[#FF3E00]">
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wb_sunny
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
              STATUS
            </span>
            <p className="font-bold text-xs text-[#F0F0F0] font-mono">{statusLabel}</p>
          </div>
        </div>

        <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="p-2 bg-[#FF3E00]/15 rounded-lg text-[#FF3E00]">
            <span className="material-symbols-outlined text-lg">hourglass_top</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
              COUNTDOWN
            </span>
            <p className="font-bold text-xs text-gray-300 font-mono truncate max-w-[140px]">
              {timeSubtext}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
