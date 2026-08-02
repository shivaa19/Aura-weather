import React from 'react';
import { ActiveTab, UserSettings, SavedLocation } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  savedLocations: SavedLocation[];
  onSelectLocation: (locId: string) => void;
  settings: UserSettings;
  onViewSevereAlert: () => void;
  onOpenAiStudio?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  savedLocations,
  onSelectLocation,
  settings,
  onViewSevereAlert,
  onOpenAiStudio,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Drawer content */}
      <div className="relative w-80 max-w-[80vw] bg-[#0F0F0F]/95 backdrop-blur-2xl h-full shadow-2xl border-r border-white/10 p-6 flex flex-col justify-between z-10 animate-fade-in text-[#F0F0F0]">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF3E00] text-2xl">
                cloud_queue
              </span>
              <div>
                <span className="text-[9px] font-mono tracking-[0.25em] text-[#FF3E00] uppercase block">
                  COLLECTIVE
                </span>
                <h2 className="font-serif italic text-xl text-[#F0F0F0]">Aura Meteo</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* User Profile Mini */}
          <div className="flex items-center gap-3 p-3 bg-[#141414] rounded-xl border border-white/10">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuADlfCQvxPvOKi5S66aDPkaGPlCO5B0vOEZKuDilo0Kd3AfEL10cg4Od-N0hNA5uJT0X09wxLqFL1u9QJNGpBKK6Y6Pdlc-SIf-xt6rtE-J-GHQFjHwQiv-CFpZV6do-zWzTckStkV8ois8rxObDzGggWAomFUr6TISEppVmbK-qtfWeTc7sG0JPtZlS_7hyYb9uW_wKBNRDesos4M-aF1-N1bFfHLEh8jVyQY5__lQS93wj68GOn3G"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-[#FF3E00]"
            />
            <div>
              <p className="font-serif italic text-base text-[#F0F0F0]">{settings.userName}</p>
              <span className="text-[9px] font-bold text-black uppercase bg-[#FF3E00] px-2 py-0.5 rounded-md font-mono">
                {settings.userTier}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="space-y-1 font-mono">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-2">
              SECTOR NAVIGATION
            </p>
            <button
              onClick={() => {
                onTabChange('home');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#FF3E00] text-black font-bold'
                  : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">home_storage</span>
              ATMOSPHERIC HOME
            </button>

            {onOpenAiStudio && (
              <button
                onClick={() => {
                  onOpenAiStudio();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-r from-[#809fff]/20 to-[#3b82f6]/20 border border-[#809fff]/40 text-[#809fff] hover:from-[#809fff]/30 hover:to-[#3b82f6]/30"
              >
                <span className="material-symbols-outlined text-lg text-[#809fff]">auto_awesome</span>
                GEMINI AI STUDIO
              </button>
            )}

            <button
              onClick={() => {
                onTabChange('forecast');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'forecast'
                  ? 'bg-[#FF3E00] text-black font-bold'
                  : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              7-DAY CHRONICLE
            </button>

            <button
              onClick={() => {
                onTabChange('radar');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-[#FF3E00] text-black font-bold'
                  : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">satellite_alt</span>
              LIVE SATELLITE RADAR
            </button>

            <button
              onClick={() => {
                onTabChange('search');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-[#FF3E00] text-black font-bold'
                  : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">search</span>
              GLOBAL SEARCH
            </button>

            <button
              onClick={() => {
                onTabChange('settings');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#FF3E00] text-black font-bold'
                  : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              PREFERENCES
            </button>
          </div>

          {/* Quick Saved Locations */}
          <div className="space-y-1 pt-2 border-t border-white/10 font-mono">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-2">
              SAVED CITIES
            </p>
            {savedLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#FF3E00]">
                    {loc.weatherIcon}
                  </span>
                  <span className="font-sans font-medium text-white">{loc.city}</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#FF3E00]">{loc.temp}°C</span>
              </button>
            ))}
          </div>

          {/* Active Alert Banner Quick Access */}
          <div className="pt-2">
            <button
              onClick={() => {
                onViewSevereAlert();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 bg-[#1A0B08] border border-[#FF3E00]/60 rounded-xl text-xs font-bold text-red-200 hover:bg-[#2A0C03] transition-all cursor-pointer font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF3E00] text-sm">
                  warning
                </span>
                <span>EMERGENCY BULLETIN</span>
              </div>
              <span className="text-[9px] bg-[#FF3E00] text-black px-2 py-0.5 rounded font-bold uppercase">
                ACTIVE
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 text-[9px] text-gray-500 font-mono text-center uppercase tracking-widest">
          AURA METEO v2.4.0 • ARTISTIC FLAIR EDITION
        </div>
      </div>
    </div>
  );
};
