// Simple CSS-based overlay with proper noise
import { ColorTheme, getTodaysColorTheme } from "./colors-switch";

export function getCSSOverlayWithNoise(theme: ColorTheme) {
  const themeConfig = {
    yellow: {
      noiseOpacity: "0.15",
      backgroundColor: "rgba(158, 191, 23, 0.7)", // #9EBF17
    },
    pink: {
      backgroundColor: "rgba(132, 0, 106, 0.8)", // #84006A
      noiseOpacity: "0.25",
    },
    red: {
      backgroundColor: "rgba(142, 0, 0, 0.7)", // #8E0000
      noiseOpacity: "0.18",
    },
  };

  const config = themeConfig[theme];

  return {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 8,
    pointerEvents: "none" as const,
    backgroundColor: config.backgroundColor,
    backgroundImage: `
      radial-gradient(circle at 5% 5%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 0.5px, transparent 0.5px),
      radial-gradient(circle at 50% 10%, rgba(0, 0, 0, ${
        parseFloat(config.noiseOpacity) * 0.7
      }) 0.8px, transparent 0.8px),
      radial-gradient(circle at 10% 60%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 0.7px, transparent 0.7px),
      radial-gradient(circle at 90% 40%, rgba(0, 0, 0, ${
        parseFloat(config.noiseOpacity) * 0.8
      }) 0.6px, transparent 0.6px),
      radial-gradient(circle at 40% 90%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 0.9px, transparent 0.9px),
      radial-gradient(circle at 65% 15%, rgba(0, 0, 0, ${
        parseFloat(config.noiseOpacity) * 0.6
      }) 0.4px, transparent 0.4px),
      radial-gradient(circle at 15% 85%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 1.1px, transparent 1.1px),
      radial-gradient(circle at 85% 85%, rgba(0, 0, 0, ${
        parseFloat(config.noiseOpacity) * 0.9
      }) 0.3px, transparent 0.3px),
      radial-gradient(circle at 35% 35%, rgba(0, 0, 0, ${
        config.noiseOpacity
      }) 0.5px, transparent 0.5px)
    `,
    backgroundSize: `
      60px 60px,
      45px 45px, 
      80px 80px,
      70px 70px,
      55px 55px,
      65px 65px,
      40px 40px,
      75px 75px,
      35px 35px,
      50px 50px
    `,
    backgroundPosition: `
      0 0,
      15px 15px,
      30px 5px,
      5px 25px,
      40px 10px,
      20px 35px,
      25px 0px,
      10px 40px,
      45px 30px,
      35px 20px
    `,
  };
}

// Even better approach: CSS with actual noise texture
export function getTexturedCSSOverlay(theme: ColorTheme) {
  const themeConfig = {
    yellow: {
      backgroundColor: "rgba(158, 191, 23, 0.7)",
      filter: "contrast(1.1) brightness(0.95)",
    },
    pink: {
      backgroundColor: "rgba(132, 0, 106, 0.8)",
      filter: "contrast(1.2) brightness(0.9)",
    },
    red: {
      backgroundColor: "rgba(142, 0, 0, 0.7)",
      filter: "contrast(1.15) brightness(0.92)",
    },
  };

  const config = themeConfig[theme];

  return {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 8,
    pointerEvents: "none" as const,
    backgroundColor: config.backgroundColor,
    backgroundImage: `
      linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.1) 50%, transparent 51%),
      linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.08) 50%, transparent 51%),
      radial-gradient(circle at 30% 40%, rgba(0,0,0,0.15) 1px, transparent 2px),
      radial-gradient(circle at 70% 60%, rgba(0,0,0,0.12) 1px, transparent 2px),
      radial-gradient(circle at 20% 80%, rgba(0,0,0,0.1) 1px, transparent 2px),
      radial-gradient(circle at 80% 20%, rgba(0,0,0,0.13) 1px, transparent 2px)
    `,
    backgroundSize: `
      8px 8px,
      12px 12px,
      40px 40px,
      50px 50px,
      60px 60px,
      45px 45px
    `,
    filter: config.filter,
    opacity: 0.95,
  };
}

// Super simple but elegant approach
export function getSimpleColorOverlay(theme: ColorTheme) {
  const themeColors = {
    yellow: "rgba(158, 191, 23, 0.7)",
    pink: "rgba(132, 0, 106, 0.8)",
    red: "rgba(142, 0, 0, 0.7)",
  };

  return {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 8,
    pointerEvents: "none" as const,
    backgroundColor: themeColors[theme],
    // Subtle grain effect using CSS
    backgroundImage: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 1px,
        rgba(0, 0, 0, 0.05) 1px,
        rgba(0, 0, 0, 0.05) 2px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 1px,  
        rgba(0, 0, 0, 0.03) 1px,
        rgba(0, 0, 0, 0.03) 2px
      )
    `,
    backgroundSize: "4px 4px, 6px 6px",
    filter: "contrast(1.05)",
  };
}

// Updated function for colors-switch.ts
export function getTodaysSimpleOverlay() {
  const theme = getTodaysColorTheme();
  return getSimpleColorOverlay(theme);
}
