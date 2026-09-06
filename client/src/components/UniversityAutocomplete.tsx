import React, { useState, useEffect, useRef } from 'react';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface InstitutionResult {
  id: string;
  name: string;
  code?: string;
  state?: string;
  type?: string;
}

interface UniversityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export const UniversityAutocomplete: React.FC<UniversityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search or enter College / University Name...',
  required = false,
  className = '',
  inputClassName = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<InstitutionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions with 250ms debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      api.get<{ institutions: InstitutionResult[] }>(`/institutions/search?q=${encodeURIComponent(value.trim())}`)
        .then(res => {
          if (res && Array.isArray(res.institutions)) {
            setSuggestions(res.institutions);
          } else {
            setSuggestions([]);
          }
        })
        .catch(err => {
          console.warn('University autocomplete search failed/timed out, allowing free-text entry:', err);
          // Fallback safety: do not block or break input
          setSuggestions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (value.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={
            inputClassName ||
            'w-full bg-[#0f172a] border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all'
          }
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 opacity-60" />
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0b1222] border border-slate-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 font-sans text-xs">
          <div className="p-1.5 space-y-0.5">
            {suggestions.map((item, idx) => {
              const isSelected = value.toLowerCase() === item.name.toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => selectSuggestion(item.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                    isHighlighted || isSelected
                      ? 'bg-cyan-950/60 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:bg-[#0f172a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-bridge-teal flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-console-text font-semibold">{item.name}</span>
                      {item.state && (
                        <span className="text-[10px] text-console-text-muted ml-2 font-mono">
                          • {item.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.type && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-console-panel-raised border border-console-border text-console-text-muted">
                        {item.type}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-bridge-teal" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-console-border text-[10px] text-console-text-muted font-mono bg-console-bg/50 rounded-b-xl flex items-center justify-between">
            <span>Can't find your college? Custom entries are accepted freely.</span>
          </div>
        </div>
      )}
    </div>
  );
};
