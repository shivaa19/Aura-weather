import React from 'react';

interface WeatherAtmosphereProps {
  condition: string;
  isDay: boolean;
}

const getWeatherTheme = (condition: string) => {
  const value = condition.toLowerCase();
  if (value.includes('thunder') || value.includes('storm')) return 'storm';
  if (value.includes('rain') || value.includes('shower') || value.includes('drizzle')) return 'rain';
  if (value.includes('snow')) return 'snow';
  if (value.includes('fog') || value.includes('mist')) return 'fog';
  if (value.includes('cloud') || value.includes('overcast')) return 'cloud';
  return 'sun';
};

export const WeatherAtmosphere: React.FC<WeatherAtmosphereProps> = ({ condition, isDay }) => {
  const theme = getWeatherTheme(condition);
  return (
    <div className={`weather-atmosphere weather-atmosphere--${theme} ${isDay ? 'weather-atmosphere--day' : 'weather-atmosphere--night'}`} aria-hidden="true">
      <div className="weather-atmosphere__glow" />
      <div className="weather-atmosphere__sun" />
      <div className="weather-atmosphere__moon" />
      <div className="weather-atmosphere__cloud weather-atmosphere__cloud--one" />
      <div className="weather-atmosphere__cloud weather-atmosphere__cloud--two" />
      <div className="weather-atmosphere__rain" />
      <div className="weather-atmosphere__snow" />
      <div className="weather-atmosphere__lightning" />
      <div className="weather-atmosphere__vignette" />
    </div>
  );
};
