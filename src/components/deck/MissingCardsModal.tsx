import { useState, useEffect } from 'react';
import type { Deck, DeckMissingReport } from '../../types/deck';
import { generateShoppingListText } from '../../utils/deckCalculator';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { LorcanaInkIcon, LorcanaInkwellIcon } from '../icons/LorcanaIcons';
import type { Ink } from '../../types/card';

function InkPill({ ink, className = 'w-3.5 h-3.5' }: { ink: Ink | string; className?: string }) {
  return <LorcanaInkIcon ink={ink} className={className} />;
}

interface Props {
  deck: Deck;
  report: DeckMissingReport;
  activeProfileName: string;
  onClose: () => void;
  onSelectCardPreview?: (cardId: string) => void;
}

export function MissingCardsModal({
  deck,
  report,
  activeProfileName,
  onClose,
  onSelectCardPreview,
}: Props) {
  const [activeTab, setActiveTab] = useState<'missing' | 'complete'>('missing');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyShoppingList = () => {
    const text = generateShoppingListText(deck.name, report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadShoppingList = () => {
    const text = generateShoppingListText(deck.name, report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${deck.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentList = activeTab === 'missing' ? report.missingItems : report.completeItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#c8b07b]/20 bg-[#181d33]/90 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h3 className="text-lg sm:text-xl font-black text-[#dfc792]">
                Missing Cards Check
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Deck: <strong className="text-slate-200">{deck.name}</strong> • Compared with binder:{' '}
              <span className="text-[#dfc792] font-semibold">"{activeProfileName}"</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Progress & Summary Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#161a2e]/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-700/80">
                <span className="text-[11px] text-slate-400 block font-semibold">Total Needed</span>
                <span className="text-base sm:text-lg font-black text-white">
                  {report.totalCardsNeeded} cards
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-2xl bg-emerald-950/60 border border-emerald-600/40">
                <span className="text-[11px] text-emerald-300 block font-semibold">In Binder</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {report.totalCardsOwned} cards
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-2xl bg-rose-950/60 border border-rose-600/40">
                <span className="text-[11px] text-rose-300 block font-semibold">Missing</span>
                <span className="text-base sm:text-lg font-black text-rose-400">
                  {report.totalCardsMissing} cards
                </span>
              </div>
            </div>

            {/* Shopping list action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? 'Copied!' : 'Copy Shopping List'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadShoppingList}
                title="Download .txt file"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                💾
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Deck Completion</span>
              <span
                className={
                  report.completionPercentage === 100
                    ? 'text-emerald-400 font-black'
                    : 'text-[#dfc792] font-black'
                }
              >
                {report.completionPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  report.completionPercentage === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-[#dfc792]'
                }`}
                style={{ width: `${report.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs: Missing vs Complete */}
        <div className="px-4 pt-3 border-b border-slate-800 bg-[#161a2e] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'missing'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>❌ Missing Cards</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
              {report.missingItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complete')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'complete'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✅ Complete Cards</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              {report.completeItems.length}
            </span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[250px] space-y-2">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <span className="text-3xl block">
                {activeTab === 'missing' ? '🎉' : '📦'}
              </span>
              <span>
                {activeTab === 'missing'
                  ? 'Awesome! This deck is 100% complete based on your binder.'
                  : 'No completed cards found in your binder yet.'}
              </span>
            </div>
          ) : (
            currentList.map((item) => {
              const thumbUrl = resolveCardImageUrl(item.setCode, item.collectorNumber, false);

              return (
                <div
                  key={item.cardId}
                  onClick={() => onSelectCardPreview?.(item.cardId)}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#c8b07b]/50 transition-all flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-855"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={thumbUrl}
                      alt={item.fullName}
                      onError={(e) => handleCardImageError(e, item.setCode, item.collectorNumber)}
                      className="w-10 h-14 object-cover rounded-lg border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.inks.map((ink) => (
                          <InkPill key={ink} ink={ink} />
                        ))}
                        {item.cost !== null && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-amber-300 font-bold border border-slate-700">
                            Cost {item.cost}
                          </span>
                        )}
                        {item.inkwell && (
                          <span title="Inkable">
                            <LorcanaInkwellIcon inkable={true} className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-100 truncate group-hover:text-[#dfc792] transition-colors mt-0.5">
                        {item.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.setName} • {item.setCode} #{item.collectorNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-300">
                        Owned {item.countOwned} / Need {item.countNeeded}
                      </div>
                      {item.missingCount > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black">
                          Missing {item.missingCount}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
