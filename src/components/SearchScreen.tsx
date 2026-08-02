import React, { useState } from 'react';
import { SavedLocation, UserSettings, WeatherData } from '../types';
import { formatTemp } from '../data/mockWeather';

interface SearchScreenProps {
  savedLocations: SavedLocation[];
  onSelectLocation: (locationId: string) => void;
  onAddNewLocation: (cityName: string) => void;
  onOpenRadar: () => void;
  settings: UserSettings;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  savedLocations,
  onSelectLocation,
  onAddNewLocation,
  onOpenRadar,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Reykjavík',
    'Tokyo',
    'New York',
    'Paris',
  ]);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WeatherData | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/search-weather?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);

      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches([searchQuery, ...recentSearches.slice(0, 5)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
  };

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
    setSearching(true);
    fetch(`/api/search-weather?q=${encodeURIComponent(term)}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data))
      .catch(console.error)
      .finally(() => setSearching(false));
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8 animate-fade-in text-[#F0F0F0]">
      {/* Search Header */}
      <div className="border-b border-white/10 pb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FF3E00] block mb-1">
          GLOBAL METEOROLOGICAL DIRECTORY
        </span>
        <h2 className="font-serif italic text-3xl font-normal text-[#F0F0F0]">
          Search & Saved Cities
        </h2>
      </div>

      {/* Search Bar Input */}
      <section className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city or airport code..."
            className="w-full h-14 bg-[#141414] border border-white/15 rounded-xl px-14 py-4 text-base font-sans placeholder:text-gray-500 focus:outline-none focus:border-[#FF3E00] backdrop-blur-xl transition-all text-[#F0F0F0]"
          />
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#FF3E00]">
            search
          </span>
          <button
            type="button"
            onClick={() => {
              if (searchQuery) handleSearchSubmit({ preventDefault: () => {} } as any);
            }}
            className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-[#FF3E00] transition-colors"
          >
            mic
          </button>
        </form>

        {/* Search Results Preview if available */}
        {searching && (
          <div className="glass-card rounded-xl p-6 text-center animate-pulse border border-white/10">
            <span className="material-symbols-outlined text-3xl text-[#FF3E00] animate-spin">
              refresh
            </span>
            <p className="text-xs text-gray-400 mt-2 font-mono">FETCHING LIVE DATA...</p>
          </div>
        )}

        {searchResults && !searching && (
          <div className="glass-card rounded-2xl p-6 border border-[#FF3E00]/50 space-y-4 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] tracking-[0.2em] font-bold text-[#FF3E00] uppercase block">
                  SEARCH RESULT
                </span>
                <h3 className="font-serif italic text-3xl font-normal text-[#F0F0F0]">
                  {searchResults.city}
                </h3>
                <p className="text-xs text-gray-400 uppercase font-mono tracking-wider">{searchResults.country}</p>
              </div>
              <span className="text-4xl text-[#FF3E00] material-symbols-outlined">
                {searchResults.hourly[0]?.icon || 'cloud_queue'}
              </span>
            </div>
            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div>
                <p className="text-5xl font-serif text-white">
                  {formatTemp(searchResults.temperature, settings.tempUnit)}
                </p>
                <p className="text-sm font-serif italic text-[#FF3E00]">{searchResults.condition}</p>
              </div>
              <button
                onClick={() => {
                  onAddNewLocation(searchResults.city);
                  setSearchResults(null);
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-[#FF3E00] text-black font-bold uppercase tracking-wider rounded-xl text-xs hover:bg-white active:scale-95 transition-all cursor-pointer shadow-lg"
              >
                + ADD TO SAVED
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              RECENT ENQUIRIES
            </span>
            <button
              onClick={handleClearRecents}
              className="text-[10px] font-bold text-[#FF3E00] hover:underline cursor-pointer uppercase tracking-wider"
            >
              CLEAR ALL
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {recentSearches.map((term, i) => (
              <div
                key={i}
                onClick={() => handleSelectRecent(term)}
                className="bg-[#181818] border border-white/10 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-all cursor-pointer hover:border-[#FF3E00] hover:text-[#FF3E00]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF3E00]">
                  history
                </span>
                <span className="text-xs font-mono text-[#F0F0F0]">{term}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Locations Grid */}
      <section className="space-y-4">
        <span className="text-[10px] font-bold text-[#FF3E00] uppercase tracking-[0.25em] block px-1">
          CURATED LOCATIONS
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedLocations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => onSelectLocation(loc.id)}
              className="bg-[#141414] rounded-2xl p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all border border-white/10 hover:border-[#FF3E00]/60 shadow-2xl"
            >
              {/* Background atmospheric photo */}
              <div className="absolute inset-0 z-0 opacity-15 transition-opacity group-hover:opacity-25 pointer-events-none">
                <img
                  src={loc.bgImageUrl}
                  alt={loc.bgAlt}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-[#FF3E00] font-mono block">
                    {loc.country}
                  </span>
                  <h3 className="font-serif italic text-3xl font-normal text-[#F0F0F0]">
                    {loc.city}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">{loc.time}</p>
                </div>
                <span
                  className="material-symbols-outlined text-4xl text-[#FF3E00]"
                >
                  {loc.weatherIcon}
                </span>
              </div>

              <div className="mt-8 flex justify-between items-end relative z-10 border-t border-white/10 pt-4">
                <div>
                  <p className="text-5xl font-serif text-white">
                    {formatTemp(loc.temp, settings.tempUnit)}
                  </p>
                  <p className="text-xs font-serif italic text-[#FF3E00]">
                    {loc.condition}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs font-mono text-gray-400">
                    H:{formatTemp(loc.high, settings.tempUnit)} L:{formatTemp(loc.low, settings.tempUnit)}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs text-[#F0F0F0]">
                    <span className="material-symbols-outlined text-sm text-[#FF3E00]">
                      {loc.statIcon}
                    </span>
                    <span className="font-mono text-xs">{loc.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Location Placeholder */}
          <div
            onClick={() => {
              const inputEl = document.querySelector('input');
              inputEl?.focus();
            }}
            className="border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-[#FF3E00] hover:bg-white/5 transition-all cursor-pointer min-h-[200px]"
          >
            <span className="material-symbols-outlined text-3xl text-[#FF3E00]">
              add_location
            </span>
            <p className="text-xs uppercase tracking-widest font-bold text-gray-300">ADD LOCATION</p>
          </div>
        </div>
      </section>

      {/* World Weather Radar Snippet */}
      <section className="space-y-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block px-1">
          SATELLITE RADAR VIEW
        </span>
        <div
          onClick={onOpenRadar}
          className="glass-card rounded-2xl overflow-hidden relative h-64 group cursor-pointer border border-white/10 hover:border-[#FF3E00]/60 transition-all shadow-2xl"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiefdgEDgqa3ro3uKvIeftfVmgC-9BR4Bf-dhaTSEVxXI7hIIHOiGT_qSEaLCmzPJk1JX2nLQfe4Ek16bmUl30Jdc7bj6TNgbObmDbD0bhJtRCoA1j_tpEZVC1IFJl7fMsyCY4fEPpwSlCQwZiWK1Oj3ToN0eK8X3Mz56yo59Ft1wYPKrceImNqOfvjbuHRj7p4HYopsMH7wfwAYJRkMamH3Ct0WupqYD6odKfYUsfHKPXhOIS94Fz"
            alt="European Weather Radar"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="bg-[#FF3E00] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined text-[18px]">
                satellite_alt
              </span>
              LAUNCH RADAR MAP
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
