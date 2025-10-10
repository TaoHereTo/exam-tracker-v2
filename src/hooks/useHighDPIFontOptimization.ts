import { useEffect, useState } from 'react';

/**
 * Hook to optimize font rendering for high-DPI displays
 * This hook adds CSS variables and classes to the document root
 * to improve text clarity on high-resolution screens
 */
export function useHighDPIFontOptimization() {
  useEffect(() => {
    // Check if we're on a high-DPI display
    const isHighDPI = window.devicePixelRatio > 1.25;

    if (isHighDPI) {
      // Add a class to the document root for high-DPI optimizations
      document.documentElement.classList.add('high-dpi');

      // Add CSS variables for high-DPI font rendering
      document.documentElement.style.setProperty('--font-smoothing', 'subpixel-antialiased');
      document.documentElement.style.setProperty('--text-rendering', 'optimizeLegibility');
    }

    // Clean up on unmount
    return () => {
      document.documentElement.classList.remove('high-dpi');
      document.documentElement.style.removeProperty('--font-smoothing');
      document.documentElement.style.removeProperty('--text-rendering');
    };
  }, []);
}

/**
 * Hook to detect display density and return optimization settings
 */
export function useDisplayDensity() {
  const [displayDensity, setDisplayDensity] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    const updateDisplayDensity = () => {
      const dpr = window.devicePixelRatio || 1;

      if (dpr <= 1) {
        setDisplayDensity('low');
      } else if (dpr <= 1.5) {
        setDisplayDensity('medium');
      } else {
        setDisplayDensity('high');
      }
    };

    updateDisplayDensity();

    // Listen for changes in device pixel ratio (e.g., when moving between displays)
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', updateDisplayDensity);

    return () => {
      mediaQuery.removeEventListener('change', updateDisplayDensity);
    };
  }, []);

  return displayDensity;
}