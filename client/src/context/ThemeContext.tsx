import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system' | 'custom';
export type CustomBase = 'dark' | 'light';

export interface CustomThemeSettings {
  primaryColor: string;
  baseStyle: CustomBase;
}

export interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  customSettings: CustomThemeSettings;
  setMode: (mode: ThemeMode) => void;
  setCustomSettings: (settings: Partial<CustomThemeSettings>) => void;
}

const STORAGE_MODE_KEY = 'skillbridge_appearance_mode';
const STORAGE_CUSTOM_KEY = 'skillbridge_appearance_custom';

export const DEFAULT_CUSTOM_SETTINGS: CustomThemeSettings = {
  primaryColor: '#2563eb', // SkillBridge Electric Blue
  baseStyle: 'dark',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MODE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'custom') {
        return saved;
      }
    } catch {
      // localStorage may be disabled
    }
    return 'system';
  });

  const [customSettings, setCustomSettingsState] = useState<CustomThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          primaryColor: parsed.primaryColor || DEFAULT_CUSTOM_SETTINGS.primaryColor,
          baseStyle: parsed.baseStyle === 'light' ? 'light' : 'dark',
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CUSTOM_SETTINGS;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for OS system preference changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Compute resolved visual presentation (either 'dark' or 'light')
  const resolvedMode: 'dark' | 'light' =
    mode === 'dark'
      ? 'dark'
      : mode === 'light'
      ? 'light'
      : mode === 'system'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : customSettings.baseStyle;

  // Apply DOM classes and attributes whenever mode, resolvedMode, or customSettings change
  useEffect(() => {
    const root = document.documentElement;

    // Apply class for Tailwind / standard selectors
    root.classList.remove('dark', 'light');
    root.classList.add(resolvedMode);

    // Apply data attributes for declarative scoping
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-theme-style', resolvedMode);

    // Custom CSS variable injection for Custom Mode
    if (mode === 'custom') {
      root.style.setProperty('--primary', customSettings.primaryColor);
      root.style.setProperty('--bridge-teal', customSettings.primaryColor);
      root.style.setProperty(
        '--bridge-gradient',
        `linear-gradient(135deg, ${customSettings.primaryColor} 0%, #0ea5e9 100%)`
      );
      root.style.setProperty('--primary-hover', customSettings.primaryColor);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--bridge-teal');
      root.style.removeProperty('--bridge-gradient');
      root.style.removeProperty('--primary-hover');
    }
  }, [mode, resolvedMode, customSettings]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_MODE_KEY, newMode);
    } catch {
      // ignore
    }
  };

  const setCustomSettings = (newSettings: Partial<CustomThemeSettings>) => {
    setCustomSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        customSettings,
        setMode,
        setCustomSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
