import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0px_-10px_30px_rgba(0,0,0,0.8)]">
      {/* Home Tab */}
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'bg-[#FF3E00] text-black font-bold rounded-2xl px-5 py-1.5 shadow-md shadow-[#FF3E00]/30 active:scale-95'
            : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-2xl active:scale-95'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          home_storage
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Home</span>
      </button>

      {/* Forecast Tab */}
      <button
        onClick={() => onTabChange('forecast')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'forecast'
            ? 'bg-[#FF3E00] text-black font-bold rounded-2xl px-5 py-1.5 shadow-md shadow-[#FF3E00]/30 active:scale-95'
            : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-2xl active:scale-95'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={activeTab === 'forecast' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          calendar_month
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Forecast</span>
      </button>

      {/* Radar Tab */}
      <button
        onClick={() => onTabChange('radar')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'radar'
            ? 'bg-[#FF3E00] text-black font-bold rounded-2xl px-5 py-1.5 shadow-md shadow-[#FF3E00]/30 active:scale-95'
            : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-2xl active:scale-95'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={activeTab === 'radar' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          satellite_alt
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Radar</span>
      </button>

      {/* Search Tab */}
      <button
        onClick={() => onTabChange('search')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'search'
            ? 'bg-[#FF3E00] text-black font-bold rounded-2xl px-5 py-1.5 shadow-md shadow-[#FF3E00]/30 active:scale-95'
            : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-2xl active:scale-95'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={activeTab === 'search' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          search
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Search</span>
      </button>

      {/* Settings Tab */}
      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          activeTab === 'settings'
            ? 'bg-[#FF3E00] text-black font-bold rounded-2xl px-5 py-1.5 shadow-md shadow-[#FF3E00]/30 active:scale-95'
            : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-2xl active:scale-95'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={activeTab === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          settings
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Settings</span>
      </button>
    </nav>
  );
};
