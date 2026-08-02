/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, WeatherData, UserSettings, SavedLocation } from './types';
import {
  defaultSettings,
  defaultLondonWeather,
  initialSavedLocations,
  currentSevereAlert,
} from './data/mockWeather';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ForecastScreen } from './components/ForecastScreen';
import { SearchScreen } from './components/SearchScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RadarScreen } from './components/RadarScreen';
import { SevereAlertModal } from './components/SevereAlertModal';
import { MenuDrawer } from './components/MenuDrawer';
import { AiStudioModal } from './components/AiStudioModal';
import { WeatherAtmosphere } from './components/WeatherAtmosphere';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [weather, setWeather] = useState<WeatherData>(defaultLondonWeather);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [aiStudioInitialFeature, setAiStudioInitialFeature] = useState<'voice' | 'grounding' | 'music' | 'pro'>('voice');
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('aura_weather_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultSettings;
  });
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    const saved = localStorage.getItem('aura_saved_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialSavedLocations;
  });

  const [showSevereModal, setShowSevereModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [atmosphere, setAtmosphere] = useState({
    condition: defaultLondonWeather.condition,
    isDay: new Date().getHours() >= 6 && new Date().getHours() < 18,
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('aura_weather_settings', JSON.stringify(settings));
  }, [settings]);

  // Save locations to localStorage
  useEffect(() => {
    localStorage.setItem('aura_saved_locations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  // Use the selected city's condition immediately, then refine it with device-location conditions when permission is available.
  useEffect(() => {
    setAtmosphere((previous) => ({ ...previous, condition: weather.condition }));
  }, [weather.condition]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetch(`/api/location-briefing?lat=${coords.latitude}&lng=${coords.longitude}`)
          .then((response) => response.ok ? response.json() : Promise.reject())
          .then((data) => setAtmosphere({
            condition: data.current?.condition || weather.condition,
            isDay: data.current?.isDay ?? (new Date().getHours() >= 6 && new Date().getHours() < 18),
          }))
          .catch(() => {});
      },
      () => {},
      { maximumAge: 300000, timeout: 10000 },
    );
  }, []);

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSelectLocation = (locId: string) => {
    const found = savedLocations.find((l) => l.id === locId);
    if (found) {
      // Fetch dynamic weather for city
      fetch(`/api/search-weather?q=${encodeURIComponent(found.city)}`)
        .then((res) => res.json())
        .then((data) => {
          setWeather(data);
          setActiveTab('home');
        })
        .catch(() => {
          setActiveTab('home');
        });
    }
  };

  const handleAddNewLocation = (cityName: string) => {
    fetch(`/api/search-weather?q=${encodeURIComponent(cityName)}`)
      .then((res) => res.json())
      .then((data: WeatherData) => {
        const newLoc: SavedLocation = {
          id: `loc-${Date.now()}`,
          city: data.city,
          country: data.country,
          time: '01:00 PM',
          temp: data.temperature,
          condition: data.condition,
          high: data.high,
          low: data.low,
          statIcon: 'air',
          statLabel: `${data.windSpeed}km/h`,
          weatherIcon: data.hourly[0]?.icon || 'cloud_queue',
          iconColor: 'text-[#89ceff]',
          bgImageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAFo8QGCg3hoz0YpGOB6dO2cCHyMNhmI0lUeeyMJUyuRdD8cYZRzTcCxDZ3bHD-Noqe9UnunPklJwsnPswcXXZz6CPkURAfPk_hA7z9IojPIuqCiq5ULjJ6w5bJvvEWXCbYXvZigpEDlKsRaaxYnlvy2p2SwZO0KAoHYJ-MzAWKAX9SlezSixnC2yHKBg3pgfck_pF3t5-Adms5ZhrykRA8nSjlBOIQiV-ry8e0BLxcN1yCaUZjS_Is',
          bgAlt: `${data.city} skyline`,
        };
        setSavedLocations([newLoc, ...savedLocations]);
        setWeather(data);
        setActiveTab('home');
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // Determine current screen title for Header
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Aura Weather';
      case 'forecast':
        return 'Aura Weather';
      case 'search':
        return 'Aura Weather';
      case 'settings':
        return 'Aura Weather';
      case 'radar':
        return 'Radar Map';
      default:
        return 'Aura Weather';
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b1326] text-[#dae2fd] font-body-md selection:bg-[#c0c1ff]/30">
      <WeatherAtmosphere condition={atmosphere.condition} isDay={atmosphere.isDay} />
      <div className="relative z-10">

      {/* Header (TopAppBar) */}
      <Header
        title={getHeaderTitle()}
        activeTab={activeTab}
        onMenuClick={() => setIsMenuOpen(true)}
        onSearchClick={() => setActiveTab('search')}
        onAiStudioClick={() => {
          setAiStudioInitialFeature('voice');
          setIsAiStudioOpen(true);
        }}
      />

      {/* Main Tab Content View */}
      {activeTab === 'home' && (
        <HomeScreen
          weather={weather}
          settings={settings}
          onViewForecastClick={() => setActiveTab('forecast')}
          onOpenRadar={() => setActiveTab('radar')}
          onViewSevereAlertClick={() => setShowSevereModal(true)}
          onOpenAiStudio={(feature) => {
            if (feature) setAiStudioInitialFeature(feature);
            setIsAiStudioOpen(true);
          }}
          severeAlert={settings.severeAlerts ? currentSevereAlert : null}
        />
      )}

      {activeTab === 'forecast' && (
        <ForecastScreen
          days={weather.daily}
          locationName={`${weather.city}, ${weather.country}`}
          settings={settings}
          onUpgradeClick={() => {
            alert('Aura Premium unlocked! Access minutely rain alerts and high-res satellite radar.');
          }}
        />
      )}

      {activeTab === 'search' && (
        <SearchScreen
          savedLocations={savedLocations}
          onSelectLocation={handleSelectLocation}
          onAddNewLocation={handleAddNewLocation}
          onOpenRadar={() => setActiveTab('radar')}
          settings={settings}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onUpgradeClick={() => {
            alert('Aura Premium subscription active.');
          }}
        />
      )}

      {activeTab === 'radar' && (
        <RadarScreen
          onViewSevereAlertDetails={() => setShowSevereModal(true)}
          severeAlert={settings.severeAlerts ? currentSevereAlert : null}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Full Screen Severe Alert Modal */}
      {showSevereModal && (
        <SevereAlertModal
          alert={currentSevereAlert}
          onClose={() => setShowSevereModal(false)}
        />
      )}

      {/* Side Slide Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedLocations={savedLocations}
        onSelectLocation={handleSelectLocation}
        settings={settings}
        onViewSevereAlert={() => setShowSevereModal(true)}
        onOpenAiStudio={() => {
          setAiStudioInitialFeature('voice');
          setIsAiStudioOpen(true);
        }}
      />

      {/* Gemini AI Weather Suite Modal */}
      {isAiStudioOpen && (
        <AiStudioModal
          weather={weather}
          initialFeature={aiStudioInitialFeature}
          onClose={() => setIsAiStudioOpen(false)}
        />
      )}
      </div>
    </div>
  );
}
