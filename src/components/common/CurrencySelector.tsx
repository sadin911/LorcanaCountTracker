import { useState, useRef, useEffect } from 'react';
import { usePricingStore } from '../../store/pricingStore';
import { SUPPORTED_CURRENCIES } from '../../types/pricing';

interface CurrencySelectorProps {
  variant?: 'compact' | 'tabs' | 'dropdown';
  className?: string;
}

export function CurrencySelector({ variant = 'dropdown', className = '' }: CurrencySelectorProps) {
  const currency = usePricingStore((s) => s.currency);
  const setCurrency = usePricingStore((s) => s.setCurrency);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (variant === 'tabs') {
    return (
      <div className={`inline-flex items-center gap-1 bg-[#131627] p-0.5 rounded-xl border border-[#c8b07b]/30 ${className}`}>
        {SUPPORTED_CURRENCIES.map((c) => {
          const isActive = currency === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] text-[#131627] shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2038]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => {
          const currentIndex = SUPPORTED_CURRENCIES.findIndex((c) => c.code === currency);
          const nextIndex = (currentIndex + 1) % SUPPORTED_CURRENCIES.length;
          setCurrency(SUPPORTED_CURRENCIES[nextIndex].code);
        }}
        title="Click to cycle currency (THB / USD / EUR / GBP / JPY)"
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs font-black text-[#dfc792] hover:text-[#f3e5c8] shadow-sm active:scale-95 transition-all ${className}`}
      >
        <span>💱</span>
        <span>{currency}</span>
      </button>
    );
  }

  // Default: Dropdown picker
  const activeInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs text-[#dfc792] hover:text-[#f3e5c8] font-bold transition-all shadow-sm group min-h-[36px]"
        title="Select Currency"
      >
        <span className="text-sm">💱</span>
        <span className="font-extrabold">{activeInfo.symbol} {activeInfo.code}</span>
        <span className="text-[10px] text-amber-400/80">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-[#131627]/98 border border-[#c8b07b]/40 shadow-2xl backdrop-blur-xl z-50 p-1.5 space-y-1 animate-fade-in divide-y divide-slate-800/40">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Currency
          </div>
          <div className="pt-1 space-y-0.5">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors font-bold ${
                    isSelected
                      ? 'bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/40'
                      : 'text-slate-300 hover:bg-[#1b2038] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-amber-400">{c.symbol}</span>
                    <span>{c.code}</span>
                  </span>
                  {isSelected && <span className="text-emerald-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
