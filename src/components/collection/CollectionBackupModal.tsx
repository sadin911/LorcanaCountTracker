import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';

interface Props {
  onClose: () => void;
  onOpenTextImport?: () => void;
}

export function CollectionBackupModal({ onClose, onOpenTextImport }: Props) {
  const exportCollectionJSON = useCollectionStore((s) => s.exportCollectionJSON);
  const importCollectionJSON = useCollectionStore((s) => s.importCollectionJSON);
  const profiles = useCollectionStore((s) => s.profiles);

  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Serializing the whole collection on every render is wasteful; recompute
  // only when the binders actually change.
  const jsonString = useMemo(() => exportCollectionJSON(), [exportCollectionJSON, profiles]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorcana-collection-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setStatus({ ok: true, message: 'Copied to clipboard.' });
    } catch {
      setStatus({ ok: false, message: 'Clipboard access was blocked — use Download instead.' });
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const runImport = () => {
    if (!window.confirm('Importing replaces every binder you currently have. Continue?')) return;
    const result = importCollectionJSON(importText);
    setStatus({ ok: result.success, message: result.message });
    if (result.success) setTimeout(onClose, 1500);
  };

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
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Backup &amp; restore</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1.5">
          {(['export', 'import'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setStatus(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                tab === t ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {status && (
          <p
            className={`px-3 py-2 rounded-lg text-xs ${
              status.ok
                ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800 text-rose-300'
            }`}
          >
            {status.message}
          </p>
        )}

        {tab === 'export' ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={download}
                className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
              >
                ⬇ Download JSON
              </button>
              <button
                type="button"
                onClick={copy}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={jsonString}
              rows={10}
              className="w-full px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 scrollbar-thin"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {onOpenTextImport && (
              <div className="p-2.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 text-[11px]">
                  Want to import cards by Set &amp; Number list (e.g. Set13, 1,3)?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTextImport();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#c8b07b] hover:bg-[#dfc792] text-[#131627] text-[11px] font-bold shrink-0 transition-colors"
                >
                  Text Import
                </button>
              </div>
            )}
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
              className="w-full text-xs text-slate-400 file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:text-xs file:font-bold"
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder="…or paste the contents of a backup file here"
              className="w-full px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 placeholder:text-slate-600 scrollbar-thin focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={runImport}
              disabled={!importText.trim()}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-40"
            >
              Replace my collection with this backup
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
