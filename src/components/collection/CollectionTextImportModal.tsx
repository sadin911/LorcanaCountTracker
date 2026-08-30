import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';
import { parseCollectionText } from '../../utils/collectionTextParser';
import { ALL_CARDS } from '../../data/catalogue';
import type { FinishKey } from '../../types/card';

interface Props {
  onClose: () => void;
}

const EXAMPLE_TEXT = `Set13
1,3
20,5
21`;

export function CollectionTextImportModal({ onClose }: Props) {
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const importCollectionText = useCollectionStore((s) => s.importCollectionText);

  const [text, setText] = useState('');
  const [targetBinderId, setTargetBinderId] = useState(activeProfileId);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [finish, setFinish] = useState<FinishKey>('normal');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [showUnmatched, setShowUnmatched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Live parse preview as the user types or pastes
  const preview = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return parseCollectionText(trimmed, ALL_CARDS);
  }, [text]);

  const handleApplyExample = () => {
    setText(EXAMPLE_TEXT);
    setStatus(null);
  };

  const handleImport = () => {
    setStatus(null);
    if (!text.trim()) {
      setStatus({ ok: false, message: 'Please enter card text first.' });
      return;
    }

    const res = importCollectionText(text, {
      mode,
      finish,
      profileId: targetBinderId,
    });

    setStatus({ ok: res.success, message: res.message });
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1600);
    }
  };

  const binderList = Object.values(profiles);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-[#c8b07b]/40 bg-[#15182a] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#c8b07b]/20 bg-[#1b2038]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📥</span>
            <div>
              <h2 className="text-base font-extrabold text-[#dfc792] leading-tight">
                Import Cards from Text
              </h2>
              <p className="text-[11px] text-slate-400">
                Bulk add cards by Set and Collector Number
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-[#252a48] hover:bg-[#2e355b] text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto scrollbar-thin space-y-4">
          {/* Format Instructions & Example Button */}
          <div className="p-3 rounded-xl bg-[#1b2038] border border-[#c8b07b]/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#dfc792] flex items-center gap-1">
                <span>📋</span> Format Guide:
              </span>
              <button
                type="button"
                onClick={handleApplyExample}
                className="text-[11px] text-[#dfc792] hover:underline flex items-center gap-1 font-semibold"
              >
                Insert Example
              </button>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Start with <code className="px-1.5 py-0.5 rounded bg-black/40 text-[#dfc792] font-mono">Set13</code> (or your set code), followed by lines of{' '}
              <code className="px-1.5 py-0.5 rounded bg-black/40 text-[#dfc792] font-mono">&lt;card_number&gt;,&lt;count&gt;</code>. If count is omitted, it defaults to 1.
            </p>
          </div>

          {/* Options Row: Target Binder, Mode, Finish */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Target Binder */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Target Binder:</label>
              <select
                value={targetBinderId}
                onChange={(e) => setTargetBinderId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
              >
                {binderList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon ?? '📘'} {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Import Action:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
              >
                <option value="merge">➕ Add to counts (Merge)</option>
                <option value="replace">🔄 Overwrite counts (Replace)</option>
              </select>
            </div>

            {/* Finish */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Card Finish:</label>
              <select
                value={finish}
                onChange={(e) => setFinish(e.target.value as FinishKey)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs text-slate-200 focus:outline-none focus:border-[#c8b07b]"
              >
                <option value="normal">✨ Normal</option>
                <option value="foil">🌟 Foil</option>
              </select>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Card List Input:</span>
              {text && (
                <button
                  type="button"
                  onClick={() => {
                    setText('');
                    setStatus(null);
                  }}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setStatus(null);
              }}
              rows={8}
              placeholder={`Set13\n1,3\n20,5\n21\n\nSet1\n10,2`}
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-[#c8b07b]/30 text-xs font-mono text-slate-100 placeholder:text-slate-600 scrollbar-thin focus:outline-none focus:border-[#c8b07b] focus:ring-1 focus:ring-[#c8b07b]/40 leading-relaxed"
            />
          </div>

          {/* Live Preview Stats */}
          {preview && (
            <div className="p-3 rounded-xl bg-[#1b2038]/90 border border-[#c8b07b]/30 space-y-2 animate-fade-in text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#dfc792] flex items-center gap-1.5">
                  <span>🔍</span> Live Parse Preview:
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-[#c8b07b]/30 text-emerald-300 font-bold">
                    {preview.totalQuantity} copies
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-[#c8b07b]/30 text-slate-300 font-semibold">
                    {preview.distinctCardsCount} distinct
                  </span>
                  {preview.setsFound.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#c8b07b]/20 text-[#dfc792] font-semibold">
                      Set: {preview.setsFound.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Unmatched Lines Warning */}
              {preview.unmatchedLines.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>⚠️ {preview.unmatchedLines.length} line(s) could not be parsed:</span>
                    <button
                      type="button"
                      onClick={() => setShowUnmatched((v) => !v)}
                      className="underline text-amber-300 hover:text-amber-100"
                    >
                      {showUnmatched ? 'Hide' : 'View'}
                    </button>
                  </div>
                  {showUnmatched && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px] opacity-90 max-h-24 overflow-y-auto">
                      {preview.unmatchedLines.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {status && (
            <p
              className={`p-3 rounded-xl text-xs font-semibold ${
                status.ok
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
              }`}
            >
              {status.ok ? '✓ ' : '✕ '}
              {status.message}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#c8b07b]/20 bg-[#1b2038]/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#252a48] hover:bg-[#2e355b] text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!preview || preview.totalQuantity === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 active:scale-95 text-[#131627] text-xs font-black transition-all shadow-md shadow-[#c8b07b]/20 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Import {preview && preview.totalQuantity > 0 ? `${preview.totalQuantity} Cards` : 'Cards'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
