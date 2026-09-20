import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Palette, Check } from 'lucide-react';
import { useTheme, ThemeMode, CustomBase } from '../context/ThemeContext';

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'card';
  className?: string;
}

const PRESET_COLORS = [
  { name: 'Electric Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Cyber Indigo', hex: '#6366f1' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Ocean Cyan', hex: '#0891b2' },
  { name: 'Crimson Rose', hex: '#e11d48' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { mode, resolvedMode, customSettings, setMode, setCustomSettings } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (variant !== 'dropdown') return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  const getModeIcon = (m: ThemeMode) => {
    switch (m) {
      case 'dark':
        return <Moon className="w-3.5 h-3.5" />;
      case 'light':
        return <Sun className="w-3.5 h-3.5" />;
      case 'system':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'custom':
        return <Palette className="w-3.5 h-3.5" />;
    }
  };

  const getActiveIcon = () => {
    if (mode === 'system') return <Laptop className="w-3.5 h-3.5 text-blue-400" />;
    if (mode === 'custom') return <Palette className="w-3.5 h-3.5 text-cyan-400" />;
    return resolvedMode === 'dark' ? (
      <Moon className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <Sun className="w-3.5 h-3.5 text-amber-500" />
    );
  };

  // ─── CARD VARIANT (for Profile / Settings) ───────────────────────────
  if (variant === 'card') {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl cyber-card border border-[#1e293b] space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Appearance</h3>
            <p className="text-xs text-slate-400">
              Customize the website interface theme and color appearance.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            {getActiveIcon()}
          </div>
        </div>

        {/* Radio options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['dark', 'light', 'system', 'custom'] as ThemeMode[]).map(m => {
            const isSelected = mode === m;
            const label =
              m === 'dark'
                ? 'Dark'
                : m === 'light'
                ? 'Light'
                : m === 'system'
                ? 'System'
                : 'Custom';

            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-xs'
                    : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {getModeIcon(m)}
                <span>{label}</span>
                {isSelected && <Check className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Custom Controls when custom is active */}
        {mode === 'custom' && (
          <div className="pt-3 border-t border-[#1e293b] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Base Appearance</span>
              <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setCustomSettings({ baseStyle: 'dark' })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    customSettings.baseStyle === 'dark'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setCustomSettings({ baseStyle: 'light' })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    customSettings.baseStyle === 'light'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs text-slate-300 font-medium mb-2">Accent Color</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map(color => {
                  const isColorActive = customSettings.primaryColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomSettings({ primaryColor: color.hex })}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                        isColorActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {isColorActive && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── DROPDOWN VARIANT (for Navbars & Headers) ─────────────────────────
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        title={`Interface Appearance: ${mode.toUpperCase()}`}
        aria-label="Interface Appearance"
        className="header-icon-btn flex items-center justify-center w-8 h-8 rounded-lg border border-[#1e293b] bg-[#0b1329] hover:bg-[#0f172a] text-slate-300 hover:text-white transition-all shadow-xs"
      >
        {getActiveIcon()}
      </button>

      {isOpen && (
        <div
          className="header-dropdown-menu absolute right-0 mt-2 w-56 rounded-2xl p-2.5 bg-[#0b1329] border border-[#1e293b] shadow-2xl z-50 animate-fade-in backdrop-blur-md space-y-1.5"
          style={{ minWidth: '220px' }}
        >
          <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-[#1e293b] pb-1.5 mb-1 flex items-center justify-between">
            <span>Appearance</span>
            <span className="text-[10px] text-blue-400 lowercase">{mode}</span>
          </div>

          {(['dark', 'light', 'system', 'custom'] as ThemeMode[]).map(m => {
            const isSelected = mode === m;
            const label =
              m === 'dark'
                ? 'Dark'
                : m === 'light'
                ? 'Light'
                : m === 'system'
                ? 'System'
                : 'Custom';

            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m !== 'custom') {
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-400 font-medium'
                    : 'text-slate-300 hover:bg-[#0f172a] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{getModeIcon(m)}</span>
                  <span>{label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}

          {/* Sub-panel for Custom mode inside dropdown */}
          {mode === 'custom' && (
            <div className="pt-2 mt-1 border-t border-[#1e293b] px-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Base Style</span>
                <div className="flex gap-1">
                  {(['dark', 'light'] as CustomBase[]).map(base => (
                    <button
                      key={base}
                      type="button"
                      onClick={() => setCustomSettings({ baseStyle: base })}
                      className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${
                        customSettings.baseStyle === base
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0f172a] text-slate-400 hover:text-white'
                      }`}
                    >
                      {base}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-slate-400 mb-1.5">Accent Preset</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map(color => {
                    const isColorActive = customSettings.primaryColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setCustomSettings({ primaryColor: color.hex })}
                        title={color.name}
                        style={{ backgroundColor: color.hex }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                          isColorActive ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                        }`}
                      >
                        {isColorActive && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
