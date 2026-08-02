export type ActiveTab = 'home' | 'forecast' | 'search' | 'settings' | 'radar';

export interface HourlyForecast {
  time: string;
  icon: string;
  temp: number; // in C
  isFilledIcon?: boolean;
}

export interface DayForecast {
  day: string;
  fullDayName: string;
  condition: string;
  icon: string;
  isFilledIcon?: boolean;
  rainChance: number;
  tempHigh: number; // C
  tempLow: number; // C
  windSpeed: string;
  humidity: string;
  uvIndex: string;
  visibility: string;
  precipitation?: string;
  pressure?: string;
  sunrise?: string;
  sunset?: string;
  warning?: string;
  description?: string;
}

export interface WeatherData {
  city: string;
  country: string;
  temperature: number; // C
  condition: string;
  high: number;
  low: number;
  humidity: number;
  dewPoint: number;
  windSpeed: number; // km/h
  gusts: number;
  uvIndex: number;
  uvLevel: string;
  visibility: number; // km
  visibilityStatus: string;
  airQualityIndex: number;
  airQualityStatus: string;
  airQualityAdvice: string;
  hourly: HourlyForecast[];
  daily: DayForecast[];
}

export interface SavedLocation {
  id: string;
  city: string;
  country: string;
  time: string;
  temp: number; // C
  condition: string;
  high: number;
  low: number;
  statIcon: string;
  statLabel: string;
  weatherIcon: string;
  iconColor: string;
  bgImageUrl: string;
  bgAlt: string;
}

export interface UserSettings {
  tempUnit: 'C' | 'F';
  distanceUnit: 'km/h' | 'mph';
  severeAlerts: boolean;
  dailySummary: boolean;
  theme: 'dark' | 'light' | 'auto';
  userName: string;
  userTier: string;
  userLocation: string;
}

export interface SevereAlert {
  id: string;
  title: string;
  severity: 'WARNING' | 'WATCH' | 'ADVISORY';
  expiresTime: string;
  summary: string;
  minutesRemaining: number;
  secondsRemaining: number;
  phenomenon: string;
  hailRisk: string;
  windGusts: string;
  fullDescription: string;
  affectedRegions: string[];
  radarImageUrl: string;
}
