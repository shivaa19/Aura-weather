import React, { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngLiteral } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SevereAlert } from '../types';

interface RadarScreenProps {
  onViewSevereAlertDetails: () => void;
  severeAlert?: SevereAlert | null;
}

type RadarLayer = 'radar' | 'precip' | 'wind';

interface SelectedPlace {
  lat: number;
  lng: number;
  name: string;
}

const WORLD_CENTER: LatLngLiteral = { lat: 20, lng: 0 };

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onSelect(event.latlng.lat, event.latlng.lng) });
  return null;
}

function MapMover({ position }: { position: LatLngLiteral | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 7, { duration: 1.2 });
  }, [map, position]);
  return null;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({
  onViewSevereAlertDetails,
  severeAlert,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineVal, setTimelineVal] = useState(120);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [activeLayer, setActiveLayer] = useState<RadarLayer>('radar');
  const [radarTimestamp, setRadarTimestamp] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [mapTarget, setMapTarget] = useState<LatLngLiteral | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // RainViewer supplies the global precipitation-radar tiles. The base map still works if it is unavailable.
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((response) => response.json())
      .then((data) => {
        const frames = data?.radar?.past;
        const latest = frames?.[frames.length - 1]?.time;
        if (typeof latest === 'number') setRadarTimestamp(latest);
      })
      .catch(() => setRadarTimestamp(null));
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setTimelineVal((previous) => (previous >= 180 ? 0 : previous + 10));
    }, 800);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const selectLocation = useCallback((lat: number, lng: number) => {
    setSelectedPlace({ lat, lng, name: 'Finding location…' });

    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const address = data.address || {};
        const name = address.city || address.town || address.village || address.state || address.country || data.display_name;
        setSelectedPlace({ lat, lng, name: name || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` });
      })
      .catch(() => setSelectedPlace({ lat, lng, name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` }));
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const target = { lat: coords.latitude, lng: coords.longitude };
        setMapTarget(target);
        selectLocation(target.lat, target.lng);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const radarUrl = radarTimestamp
    ? `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#101824] text-[#f0f6ff]">
      <MapContainer
        center={WORLD_CENTER}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        worldCopyJump
        className="radar-world-map"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {activeLayer !== 'wind' && radarUrl && (
          <TileLayer url={radarUrl} opacity={activeLayer === 'radar' ? 0.72 : 0.92} zIndex={10} />
        )}
        <MapClickHandler onSelect={selectLocation} />
        <MapMover position={mapTarget} />
        {selectedPlace && (
          <CircleMarker
            center={[selectedPlace.lat, selectedPlace.lng]}
            radius={10}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#ff3e00', fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-[#0b1019]/65 via-transparent to-[#0b1019]/90" />

      <main className="pointer-events-none relative z-[500] h-full w-full pt-20 pb-24">
        <div className="pointer-events-auto absolute left-1/2 top-4 w-[calc(100%-110px)] max-w-md -translate-x-1/2">
          <div className="rounded-xl border border-white/10 bg-[#101824]/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff7850]">Live global weather radar</p>
            <p className="mt-0.5 truncate font-mono text-xs font-bold uppercase text-white">
              {selectedPlace ? selectedPlace.name : 'Drag, zoom, or tap anywhere on Earth'}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 flex flex-col gap-3 sm:right-6">
          <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#101824]/90 shadow-2xl backdrop-blur-xl">
            {([
              ['radar', 'layers', 'Radar'],
              ['precip', 'water_drop', 'Rain'],
              ['wind', 'air', 'Wind'],
            ] as const).map(([layer, icon, label]) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`border-b border-white/10 p-3 last:border-b-0 ${activeLayer === layer ? 'bg-white/10 text-[#ff7850]' : 'text-gray-300 hover:bg-white/10'}`}
                title={label}
                aria-label={label}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </button>
            ))}
          </div>
          <button
            onClick={locateUser}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#101824]/90 text-white shadow-xl backdrop-blur-xl hover:bg-white/20"
            title="My location"
            aria-label="Center map on my location"
          >
            <span className={`material-symbols-outlined text-xl ${isLocating ? 'animate-pulse text-[#ff7850]' : ''}`}>my_location</span>
          </button>
        </div>

        {selectedPlace && (
          <div className="pointer-events-auto absolute left-4 top-28 max-w-[250px] rounded-2xl border border-white/10 bg-[#101824]/95 p-3 shadow-2xl backdrop-blur-xl sm:left-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff7850]">Selected point</p>
            <p className="mt-1 text-sm font-bold text-white">{selectedPlace.name}</p>
            <p className="mt-1 font-mono text-[10px] text-slate-300">{selectedPlace.lat.toFixed(4)}°, {selectedPlace.lng.toFixed(4)}°</p>
          </div>
        )}

        {severeAlert && showAlertBanner && (
          <div className="pointer-events-auto absolute bottom-36 left-1/2 z-30 w-[calc(100%-48px)] max-w-md -translate-x-1/2">
            <div className="rounded-2xl border border-[#ff3e00]/60 bg-[#1a0b08]/95 p-4 shadow-2xl backdrop-blur-2xl">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[#ff3e00]">warning</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-white">{severeAlert.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">{severeAlert.summary}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={onViewSevereAlertDetails} className="flex-1 rounded-xl bg-[#ff3e00] py-2 text-xs font-bold uppercase text-black">View details</button>
                <button onClick={() => setShowAlertBanner(false)} className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold uppercase text-gray-200">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[calc(100%-32px)] max-w-2xl -translate-x-1/2">
          <div className="rounded-2xl border border-white/10 bg-[#101824]/95 p-4 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff3e00] text-black">
                  <span className="material-symbols-outlined text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff7850]">{activeLayer === 'wind' ? 'Wind view' : 'Radar playback'}</p>
                  <p className="font-mono text-xs font-bold text-white">WORLDWIDE · {radarTimestamp ? 'LIVE DATA' : 'MAP READY'}</p>
                </div>
              </div>
              <span className="hidden rounded-lg bg-white/10 px-2 py-1 text-[9px] font-bold uppercase text-slate-200 sm:block">Click any location</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={timelineVal}
              onChange={(event) => setTimelineVal(Number(event.target.value))}
              className="mt-4 w-full cursor-pointer accent-[#ff3e00]"
              aria-label="Radar playback timeline"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
