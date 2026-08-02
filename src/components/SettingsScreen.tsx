import React, { useState } from 'react';
import { UserSettings } from '../types';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onUpgradeClick: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onUpgradeClick,
}) => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDataUsage, setShowDataUsage] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ userName: nameInput });
    setShowEditProfile(false);
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8 animate-fade-in text-[#F0F0F0]">
      {/* Header title */}
      <div className="border-b border-white/10 pb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FF3E00] block mb-1">
          SYSTEM PREFERENCES
        </span>
        <h2 className="font-serif italic text-3xl font-normal text-[#F0F0F0]">
          Settings & Account
        </h2>
      </div>

      {/* Profile Header */}
      <section className="flex items-center gap-4 p-6 glass-card rounded-2xl shadow-xl border border-white/10 bg-[#141414]">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF3E00] shadow-md flex-shrink-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuADlfCQvxPvOKi5S66aDPkaGPlCO5B0vOEZKuDilo0Kd3AfEL10cg4Od-N0hNA5uJT0X09wxLqFL1u9QJNGpBKK6Y6Pdlc-SIf-xt6rtE-J-GHQFjHwQiv-CFpZV6do-zWzTckStkV8ois8rxObDzGggWAomFUr6TISEppVmbK-qtfWeTc7sG0JPtZlS_7hyYb9uW_wKBNRDesos4M-aF1-N1bFfHLEh8jVyQY5__lQS93wj68GOn3G"
            alt="Profile portrait"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-serif italic text-2xl font-normal text-[#F0F0F0]">
            {settings.userName}
          </h2>
          <p className="text-gray-400 text-xs font-mono mt-0.5">
            MEMBER TIER: <strong className="text-[#FF3E00]">{settings.userTier}</strong> • {settings.userLocation}
          </p>
        </div>
        <button
          onClick={() => setShowEditProfile(true)}
          className="ml-auto material-symbols-outlined text-[#FF3E00] hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
          aria-label="Edit Profile"
        >
          edit
        </button>
      </section>

      {/* Preferences Section */}
      <section className="space-y-3">
        <span className="text-[10px] text-[#FF3E00] uppercase font-bold tracking-[0.25em] block px-1">
          METEOROLOGICAL UNITS
        </span>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10 border border-white/10 bg-[#141414]">
          {/* Temperature Toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <span
                className="material-symbols-outlined text-[#FF3E00] text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                thermostat
              </span>
              <div>
                <p className="font-serif text-base text-[#F0F0F0]">
                  Temperature Scale
                </p>
                <p className="text-xs text-gray-400 font-mono">Celsius or Fahrenheit</p>
              </div>
            </div>
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onUpdateSettings({ tempUnit: 'C' })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                  settings.tempUnit === 'C'
                    ? 'bg-[#FF3E00] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => onUpdateSettings({ tempUnit: 'F' })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                  settings.tempUnit === 'F'
                    ? 'bg-[#FF3E00] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Wind Speed & Distance Toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF3E00] text-2xl">
                straighten
              </span>
              <div>
                <p className="font-serif text-base text-[#F0F0F0]">
                  Wind & Distance
                </p>
                <p className="text-xs text-gray-400 font-mono">Metric or Imperial</p>
              </div>
            </div>
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onUpdateSettings({ distanceUnit: 'km/h' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                  settings.distanceUnit === 'km/h'
                    ? 'bg-[#FF3E00] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                km/h
              </button>
              <button
                onClick={() => onUpdateSettings({ distanceUnit: 'mph' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                  settings.distanceUnit === 'mph'
                    ? 'bg-[#FF3E00] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                mph
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="space-y-3">
        <span className="text-[10px] text-[#FF3E00] uppercase font-bold tracking-[0.25em] block px-1">
          AUTOMATED DISPATCHES
        </span>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10 border border-white/10 bg-[#141414]">
          {/* Severe Weather Alerts */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <span
                className="material-symbols-outlined text-[#FF3E00] text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <div>
                <p className="font-serif text-base text-[#F0F0F0]">
                  Severe Weather Dispatches
                </p>
                <p className="text-xs text-gray-400 font-mono">Storm and hurricane push alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.severeAlerts}
              onChange={(e) => onUpdateSettings({ severeAlerts: e.target.checked })}
              className="w-5 h-5 accent-[#FF3E00] rounded cursor-pointer"
            />
          </label>

          {/* Daily Summary */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <span
                className="material-symbols-outlined text-[#FF3E00] text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                today
              </span>
              <div>
                <p className="font-serif text-base text-[#F0F0F0]">
                  Daily Morning Digest
                </p>
                <p className="text-xs text-gray-400 font-mono">Receive daily atmospheric overview</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.dailySummary}
              onChange={(e) => onUpdateSettings({ dailySummary: e.target.checked })}
              className="w-5 h-5 accent-[#FF3E00] rounded cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* Theme Section */}
      <section className="space-y-3">
        <span className="text-[10px] text-[#FF3E00] uppercase font-bold tracking-[0.25em] block px-1">
          VISUAL THEME
        </span>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`glass-card p-5 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
              settings.theme === 'dark'
                ? 'border-[#FF3E00] bg-[#1C1C1C]'
                : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-[#FF3E00] text-3xl">dark_mode</span>
            <span className="text-xs font-mono font-bold text-[#F0F0F0]">ARTISTIC DARK</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`glass-card p-5 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
              settings.theme === 'light'
                ? 'border-[#FF3E00] bg-[#1C1C1C]'
                : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-gray-400 text-3xl">
              light_mode
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">LIGHT</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ theme: 'auto' })}
            className={`glass-card p-5 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
              settings.theme === 'auto'
                ? 'border-[#FF3E00] bg-[#1C1C1C]'
                : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-gray-400 text-3xl">
              settings_brightness
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">AUTO</span>
          </button>
        </div>
      </section>

      {/* Account Info Section */}
      <section className="space-y-3">
        <span className="text-[10px] text-[#FF3E00] uppercase font-bold tracking-[0.25em] block px-1">
          MEMBERSHIP ARCHIVE
        </span>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10 border border-white/10 bg-[#141414]">
          <div
            onClick={onUpgradeClick}
            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF3E00] text-2xl">
                workspace_premium
              </span>
              <p className="font-serif text-base text-[#F0F0F0]">
                Subscription Status
              </p>
            </div>
            <span className="text-xs font-bold text-black bg-[#FF3E00] px-3 py-1 rounded-lg uppercase tracking-widest font-mono">
              {settings.userTier}
            </span>
          </div>

          <div
            onClick={() => setShowDataUsage(true)}
            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF3E00] text-2xl">
                database
              </span>
              <p className="font-serif text-base text-[#F0F0F0]">
                Storage & Data Cache
              </p>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </div>

          <div
            onClick={() => alert('Signed out of Aura Weather.')}
            className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF3E00] text-2xl">
                logout
              </span>
              <p className="font-serif text-base text-[#FF3E00]">
                Sign Out
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="text-center space-y-1.5 opacity-60 py-6 border-t border-white/10 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
        <p>AURA WEATHER — COLLECTIVE EDITION v2.4.0</p>
        <p>© 2026 STUDIO AESTHETE METEOROLOGY</p>
      </footer>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md space-y-4 border border-[#FF3E00]/50 animate-fade-in bg-[#141414]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif italic text-xl text-[#F0F0F0]">Edit Member Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="material-symbols-outlined text-gray-400 hover:text-white cursor-pointer"
              >
                close
              </button>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                  MEMBER NAME
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-white/20 rounded-xl p-3 text-sm text-[#F0F0F0] focus:outline-none focus:border-[#FF3E00]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 uppercase tracking-wider font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF3E00] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Usage Modal */}
      {showDataUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/20 animate-fade-in bg-[#141414]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif italic text-xl text-[#F0F0F0]">Data Cache Statistics</h3>
              <button
                onClick={() => setShowDataUsage(false)}
                className="material-symbols-outlined text-gray-400 hover:text-white cursor-pointer"
              >
                close
              </button>
            </div>
            <div className="space-y-3 text-xs font-mono text-[#F0F0F0]">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Radar Imagery Cache:</span>
                <span className="font-bold text-[#FF3E00]">14.2 MB</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Saved Locations Sync:</span>
                <span className="font-bold text-[#FF3E00]">1.8 MB</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Editorial AI Briefings:</span>
                <span className="font-bold text-[#FF3E00]">420 KB</span>
              </div>
            </div>
            <button
              onClick={() => setShowDataUsage(false)}
              className="w-full py-3 bg-[#FF3E00] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
