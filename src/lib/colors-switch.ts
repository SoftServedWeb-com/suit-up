import { yellowOverlay, pinkOverlay, redOverlay } from "@/lib/logo";

export const colorThemes = {
  yellow: {
    color: '#9EBF17',
    name: 'yellow'
  },
  pink: {
    color: '#982E83', 
    name: 'pink'
  },
  red: {
    color: '#8E0000',
    name: 'red'
  }
} as const;

export type ColorTheme = keyof typeof colorThemes;

// Function to get today's color theme based on day of year
export function getTodaysColorTheme(): ColorTheme {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Cycle through the 3 colors based on day of year
  const colorKeys = Object.keys(colorThemes) as ColorTheme[];
  const themeIndex = dayOfYear % colorKeys.length;
  
  return colorKeys[themeIndex];
}

// Function to get overlay component based on theme
export function getTodaysOverlay() {
  const theme = getTodaysColorTheme();
  
  switch (theme) {
    case 'yellow':
      return yellowOverlay;
    case 'pink':
      return pinkOverlay;
    case 'red':
      return redOverlay;
    default:
      return redOverlay;
  }
}

// Function to get today's color value
export function getTodaysColor(): string {
  const theme = getTodaysColorTheme();
  return colorThemes[theme].color;
}
