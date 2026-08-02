import React, { useState } from 'react';
import { DayForecast, UserSettings } from '../types';
import { formatTemp } from '../data/mockWeather';
import { getIconAnimClass } from '../utils/iconAnimation';

interface ForecastScreenProps {
  days: DayForecast[];
  locationName: string;
  settings: UserSettings;
  onUpgradeClick: () => void;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({
  days,
  locationName,
  settings,
  onUpgradeClick,
}) => {
  const [activeIndices, setActiveIndices] = useState<number[]>([0]);

  const toggleDay = (idx: number) => {
    if (activeIndices.includes(idx)) {
      setActiveIndices(activeIndices.filter((i) => i !== idx));
    } else {
      setActiveIndices([...activeIndices, idx]);
    }
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-6 animate-fade-in text-[#F0F0F0]">
      {/* Header Section */}
      <header className="py-2 border-b border-white/10 pb-4">
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FF3E00] block mb-1">
          METEOROLOGICAL CHRONICLE
        </span>
        <h2 className="font-serif italic text-3xl md:text-4xl font-normal text-[#F0F0F0]">
          7-Day Forecast
        </h2>
        <p className="text-xs uppercase font-mono tracking-widest text-gray-400 mt-1">
          LOCATION — {locationName}
        </p>
      </header>

      {/* Forecast List */}
      <div className="space-y-3">
        {days.map((day, idx) => {
          const isActive = activeIndices.includes(idx);
          return (
            <div
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`glass-card rounded-2xl p-5 transition-all duration-300 cursor-pointer border ${
                isActive
                  ? 'bg-[#181818] border-[#FF3E00]/80 shadow-2xl my-3'
                  : 'hover:bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-lg md:text-xl font-bold w-12 text-[#F0F0F0] uppercase">
                    {day.day}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`material-symbols-outlined text-[#FF3E00] ${getIconAnimClass(day.icon)}`}
                      style={
                        day.isFilledIcon || idx === 0 || day.condition === 'Rain'
                          ? { fontVariationSettings: "'FILL' 1" }
                          : {}
                      }
                    >
                      {day.icon}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-[#FF3E00]">
                      {day.condition}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                    <span className="material-symbols-outlined text-[16px] text-[#FF3E00]">water_drop</span>
                    <span>{day.rainChance}%</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="font-serif text-2xl font-bold text-[#F0F0F0]">
                      {formatTemp(day.tempHigh, settings.tempUnit)}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {formatTemp(day.tempLow, settings.tempUnit)}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 text-[#FF3E00] ${
                      isActive ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Expanded Details Content */}
              {isActive && (
                <div className="border-t border-white/10 mt-4 pt-4 space-y-4 animate-fade-in">
                  {day.description && (
                    <p className="text-xs md:text-sm text-gray-300 font-serif italic leading-relaxed">
                      "{day.description}"
                    </p>
                  )}

                  {/* Warning banner if present */}
                  {day.warning && (
                    <div className="p-3 bg-[#2D0C03] border border-[#FF3E00]/50 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#FF3E00]">warning</span>
                      <p className="text-xs text-red-200 font-mono">{day.warning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                      <div className="p-2 bg-[#FF3E00]/10 rounded-lg text-[#FF3E00]">
                        <span className="material-symbols-outlined text-lg">air</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                          WIND SPEED
                        </p>
                        <p className="font-mono text-xs md:text-sm text-[#F0F0F0]">
                          {day.windSpeed}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                      <div className="p-2 bg-[#FF3E00]/10 rounded-lg text-[#FF3E00]">
                        <span className="material-symbols-outlined text-lg">humidity_low</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                          HUMIDITY
                        </p>
                        <p className="font-mono text-xs md:text-sm text-[#F0F0F0]">
                          {day.humidity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                      <div className="p-2 bg-[#FF3E00]/10 rounded-lg text-[#FF3E00]">
                        <span className="material-symbols-outlined text-lg">wb_sunny</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                          UV INDEX
                        </p>
                        <p className="font-mono text-xs md:text-sm text-[#F0F0F0]">
                          {day.uvIndex}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                      <div className="p-2 bg-[#FF3E00]/10 rounded-lg text-[#FF3E00]">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                          VISIBILITY
                        </p>
                        <p className="font-mono text-xs md:text-sm text-[#F0F0F0]">
                          {day.visibility}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sunrise/Sunset */}
                  {(day.sunrise || day.pressure) && (
                    <div className="flex gap-3 pt-1">
                      {day.sunrise && (
                        <div className="bg-black/40 rounded-xl p-3 flex-1 text-center border border-white/10">
                          <span className="material-symbols-outlined text-[#FF3E00] text-lg mb-1">
                            light_mode
                          </span>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest font-mono">
                            SUNRISE
                          </p>
                          <p className="font-bold text-xs md:text-sm text-[#F0F0F0] font-mono">
                            {day.sunrise}
                          </p>
                        </div>
                      )}
                      {day.sunset && (
                        <div className="bg-black/40 rounded-xl p-3 flex-1 text-center border border-white/10">
                          <span className="material-symbols-outlined text-[#FF3E00] text-lg mb-1">
                            nightlight_round
                          </span>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest font-mono">
                            SUNSET
                          </p>
                          <p className="font-bold text-xs md:text-sm text-[#F0F0F0] font-mono">
                            {day.sunset}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to Action Card */}
      <div className="p-8 rounded-3xl glass-card border border-[#FF3E00]/40 mt-8 text-center space-y-4 shadow-2xl">
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FF3E00] block">
          COLLECTIVE — METEO PREMIUM
        </span>
        <h3 className="font-serif italic text-2xl text-[#F0F0F0]">
          Require High-Precision Satellite Radar?
        </h3>
        <p className="text-gray-300 font-sans text-xs md:text-sm leading-relaxed max-w-md mx-auto">
          Access minutely precipitation modeling, satellite imagery archives, and storm trajectory predictions.
        </p>
        <button
          onClick={onUpgradeClick}
          className="w-full py-4 bg-[#FF3E00] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg active:scale-95"
        >
          UNLOCK PREMIUM ARCHIVE
        </button>
      </div>
    </main>
  );
};
