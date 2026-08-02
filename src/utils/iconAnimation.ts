/**
 * Utility to map weather icon names to micro-animation CSS classes.
 */
export function getIconAnimClass(iconName: string): string {
  if (!iconName) return '';
  const lower = iconName.toLowerCase();

  if (
    lower.includes('sunny') ||
    lower.includes('sun') ||
    lower.includes('wb_sunny') ||
    lower.includes('light_mode') ||
    lower.includes('wb_twilight')
  ) {
    return 'anim-sun';
  }

  if (
    lower.includes('cloud') ||
    lower.includes('partly') ||
    lower.includes('fog') ||
    lower.includes('mist')
  ) {
    return 'anim-cloud';
  }

  if (
    lower.includes('rain') ||
    lower.includes('water') ||
    lower.includes('drop') ||
    lower.includes('thunderstorm') ||
    lower.includes('grain') ||
    lower.includes('umbrella')
  ) {
    return 'anim-rain';
  }

  if (
    lower.includes('air') ||
    lower.includes('wind') ||
    lower.includes('cyclone') ||
    lower.includes('storm')
  ) {
    return 'anim-wind';
  }

  return 'anim-pulse';
}
