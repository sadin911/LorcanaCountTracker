import { useState, useEffect, useMemo } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { ALL_CARDS } from '../../data/catalogue';
import { formatLorcanaDeckText } from '../../utils/deckCalculator';
import type { LorcanaCard } from '../../types/card';

interface Props {
  onClose: () => void;
  activeDeckId?: string | null;
  onDeckImported?: (newDeckId: string) => void;
}

export function DeckImportExportModal({ onClose, activeDeckId, onDeckImported }: Props) {
  const decks = useDeckStore((s) => s.decks);
  const importDeckJSON = useDeckStore((s) => s.importDeckJSON);
  const importDeckText = useDeckStore((s) => s.importDeckText);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedExportDeckId, setSelectedExportDeckId] = useState<string>(
    activeDeckId || Object.keys(decks)[0] || ''
  );
  const [exportFormat, setExportFormat] = useState<'text' | 'json'>('text');
  const [importFormat, setImportFormat] = useState<'text' | 'json'>('text');
  const [importText, setImportText] = useState('');
  const [importDeckName, setImportDeckName] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Card lookup map
  const cardDataMap = useMemo(() => {
    const map = new Map<string, LorcanaCard>();
    ALL_CARDS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  const currentExportDeck = decks[selectedExportDeckId];

  const textExportString = useMemo(() => {
    if (!currentExportDeck) return '';
    return formatLorcanaDeckText(currentExportDeck, cardDataMap);
  }, [currentExportDeck, cardDataMap]);

  const jsonExportString = useMemo(() => {
    if (!currentExportDeck) return '';
    return JSON.stringify(currentExportDeck, null, 2);
  }, [currentExportDeck]);

  const activeExportContent = exportFormat === 'text' ? textExportString : jsonExportString;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeExportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentExportDeck) return;
    const isJson = exportFormat === 'json';
    const blob = new Blob([activeExportContent], {
      type: isJson ? 'application/json' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = currentExportDeck.name.toLowerCase().replace(/\s+/g, '-');
    a.download = `lorcana-deck-${safeName}.${isJson ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setStatusMsg(null);
    if (!importText.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter or paste a deck list or JSON string first' });
      return;
    }

    if (importFormat === 'json') {
      const res = importDeckJSON(importText);
      if (res.success && res.deckId) {
        setStatusMsg({ type: 'success', text: res.message });
        setImportText('');
        onDeckImported?.(res.deckId);
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = importDeckText(importText, importDeckName);
      if (res.success && res.deckId) {
        setStatusMsg({
          type: res.unmatchedLines && res.unmatchedLines.length > 0 ? 'warning' : 'success',
          text: res.message,
          details: res.unmatchedLines,
        });
        setImportText('');
        setImportDeckName('');
        onDeckImported?.(res.deckId);
      } else {
        setStatusMsg({
          type: 'error',
          text: res.message,
          details: res.unmatchedLines,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#c8b07b]/20 bg-[#181d33]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#dfc792]">
                Import / Export Deck
              </h3>
              <p className="text-xs text-slate-400">
                Supports Dreamborn.ink text format, Pixelborn text lists, and JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#161a2e] flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMsg(null);
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📤 Export Deck</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMsg(null);
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📥 Import Deck</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : statusMsg.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <span>{statusMsg.type === 'success' ? '✅' : statusMsg.type === 'warning' ? '⚠️' : '❌'}</span>
                <span>{statusMsg.text}</span>
              </div>
              {statusMsg.details && statusMsg.details.length > 0 && (
                <div className="text-[11px] opacity-80 pl-5 list-disc">
                  <span>Unmatched lines:</span>
                  <ul className="list-disc pl-4 mt-1 max-h-24 overflow-y-auto font-mono">
                    {statusMsg.details.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Select Deck to Export */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Select Deck to Export:</label>
                  <select
                    value={selectedExportDeckId}
                    onChange={(e) => setSelectedExportDeckId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-200 focus:outline-none"
                  >
                    {Object.values(decks).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({Object.values(d.cards).reduce((acc, c) => acc + c.count, 0)} cards)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Format:</label>
                  <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setExportFormat('text')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        exportFormat === 'text'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Text (Dreamborn)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('json')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        exportFormat === 'json'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      JSON Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Textarea displaying content */}
              <div className="relative">
                <textarea
                  readOnly
                  value={activeExportContent}
                  rows={10}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none selection:bg-amber-500/30"
                />
              </div>

              {/* Export action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                >
                  <span>💾</span>
                  <span>Download File</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{copied ? '✅' : '📋'}</span>
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Options */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Deck Name (Optional):</label>
                  <input
                    type="text"
                    value={importDeckName}
                    onChange={(e) => setImportDeckName(e.target.value)}
                    placeholder="e.g. Amber/Steel Aggro..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#c8b07b] text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Import Format:</label>
                  <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setImportFormat('text')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        importFormat === 'text'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Text List (Dreamborn)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportFormat('json')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        importFormat === 'json'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      JSON Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">
                  Paste deck list here (e.g. <code className="text-[#dfc792]">4 Elsa - Spirit of Winter</code> or JSON):
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={
                    importFormat === 'text'
                      ? '4 Elsa - Spirit of Winter\n4 Maui - Hero to All\n3 Friends on the Other Side\n4 Stitch - Carefree Surfer...'
                      : '{\n  "name": "My Lorcana Deck",\n  "cards": {\n    "1-42": { "cardId": "1-42", "count": 4 }\n  }\n}'
                  }
                  rows={9}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:border-[#c8b07b] focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>📥</span>
                  <span>Confirm Import Deck</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
