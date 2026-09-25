import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useVoiceCardRecognition,
  playVoiceSuccessChime,
  playVoiceCommandChime,
  triggerVoiceHaptic,
} from '../../hooks/useVoiceCardRecognition';
import { parseVoiceInput, type VoiceCardParseResult } from '../../utils/voiceCardParser';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import {
  speakVoiceFeedback,
  formatCardSpokenText,
  formatCommandSpokenText,
  initTtsUnlock,
  stopVoiceFeedback,
  isTtsSupported,
  hasThaiTtsSupport,
} from '../../utils/voiceTts';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';
import { SETS_NEWEST_FIRST } from '../../data/catalogue';
import { useCollectionStore } from '../../store/collectionStore';
import type { FinishKey, LorcanaCard } from '../../types/card';
import { rarityLabel } from '../../types/card';

export interface StagedVoiceCard {
  id: string; // unique key in staged list
  card: LorcanaCard;
  quantity: number;
  finish: FinishKey;
  timestamp: number;
}

interface Props {
  catalog: LorcanaCard[];
  defaultFinish: FinishKey;
  targetBinderName?: string;
  onImportCards: (cards: Array<{ cardId: string; quantity: number; finish: FinishKey }>) => void;
  onCopyToTextTab: (text: string) => void;
}

const STORAGE_KEY_VOICE_SET = 'lorcana_voice_active_set';
const STORAGE_KEY_VOICE_TTS = 'lorcana_voice_tts_enabled';

const SUGGESTED_PHRASES = [
  'ชุด 1 เบอร์ 25 สองใบ',
  'เบอร์ 42 หนึ่งใบ',
  'เอลซ่า ฟอยล์',
  'มิกกี้ เมาส์ 2 ใบ',
  'เพิ่มอีกใบ',
  'ลบอันล่าสุด',
  'บันทึก',
];

export function VoiceCardCollectorTab({
  catalog,
  defaultFinish,
  targetBinderName,
  onImportCards,
  onCopyToTextTab,
}: Props) {
  // Staged cards queue
  const [stagedCards, setStagedCards] = useState<StagedVoiceCard[]>([]);

  // Current collection set filter wins over last remembered set
  const collectionSetFilter = useCollectionStore((s) => s.filters.selectedSet);

  // Active set context (can be spoken or chosen)
  const [activeSetId, setActiveSetId] = useState<string>(() => {
    if (collectionSetFilter && collectionSetFilter !== 'ALL') return collectionSetFilter;
    return localStorage.getItem(STORAGE_KEY_VOICE_SET) || '1';
  });

  // Fast TTS confirmation toggle (enabled by default)
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VOICE_TTS);
    return stored === null ? true : stored === 'true';
  });

  // Last recognized utterance & parsed info
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastParseResult, setLastParseResult] = useState<VoiceCardParseResult | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const [candidates, setCandidates] = useState<LorcanaCard[] | null>(null);

  const toastTimeoutRef = useRef<any>(null);

  // Collect all available set options
  const availableSets = useMemo<SetOption[]>(() => {
    const setCounts = new Map<string, number>();
    for (const card of catalog) {
      setCounts.set(card.setCode, (setCounts.get(card.setCode) ?? 0) + 1);
    }
    return SETS_NEWEST_FIRST.map((s) => ({
      code: s.code,
      name: s.name,
      count: setCounts.get(s.code) ?? s.cardCount,
      owned: 0,
    }));
  }, [catalog]);

  // Persist active set & TTS setting
  useEffect(() => {
    if (activeSetId && activeSetId !== 'ALL') {
      localStorage.setItem(STORAGE_KEY_VOICE_SET, activeSetId);
    }
  }, [activeSetId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOICE_TTS, String(ttsEnabled));
  }, [ttsEnabled]);

  // Stop any ongoing speech on unmount
  useEffect(() => {
    return () => {
      stopVoiceFeedback();
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFeedbackToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Add card to staged queue
  const addCardToStaging = (card: LorcanaCard, qty: number = 1, finish?: FinishKey) => {
    const f = finish || defaultFinish;
    setStagedCards((prev) => {
      const existingIdx = prev.findIndex((item) => item.card.id === card.id && item.finish === f);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qty,
          timestamp: Date.now(),
        };
        return updated;
      }
      return [
        {
          id: `${card.id}-${f}-${Date.now()}`,
          card,
          quantity: qty,
          finish: f,
          timestamp: Date.now(),
        },
        ...prev,
      ];
    });

    playVoiceSuccessChime();
    triggerVoiceHaptic('success');
  };

  // Process speech transcript
  const handleSpeechFinal = (transcript: string) => {
    setLastTranscript(transcript);
    const parsed = parseVoiceInput(transcript, catalog, activeSetId);
    setLastParseResult(parsed);

    // 1. Handle Voice Commands
    if (parsed.type === 'command' && parsed.command) {
      playVoiceCommandChime();
      triggerVoiceHaptic('command');

      switch (parsed.command) {
        case 'undo':
          setStagedCards((prev) => {
            if (prev.length === 0) {
              showToast('No cards in staging list to undo', 'warn');
              return prev;
            }
            const removed = prev[0];
            const name = removed.card.version ? `${removed.card.name} – ${removed.card.version}` : removed.card.name;
            showToast(`Undone ${name} #${removed.card.collectorNumber}`, 'info');
            if (ttsEnabled) {
              speakVoiceFeedback(formatCommandSpokenText('undo', removed.card.name, language), { lang: language, rate: 1.45 });
            }
            return prev.slice(1);
          });
          break;

        case 'clear':
          if (stagedCards.length > 0) {
            setStagedCards([]);
            showToast('Cleared all staged cards', 'info');
            if (ttsEnabled) {
              speakVoiceFeedback(formatCommandSpokenText('clear', undefined, language), { lang: language, rate: 1.45 });
            }
          }
          break;

        case 'increase_last':
          setStagedCards((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[0] = { ...updated[0], quantity: updated[0].quantity + 1 };
            showToast(`Increased ${updated[0].card.name} to ${updated[0].quantity}`, 'success');
            if (ttsEnabled) {
              speakVoiceFeedback(formatCommandSpokenText('increase_last', `${updated[0].card.name} ${updated[0].quantity}`, language), { lang: language, rate: 1.45 });
            }
            return updated;
          });
          break;

        case 'decrease_last':
          setStagedCards((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            if (updated[0].quantity > 1) {
              updated[0] = { ...updated[0], quantity: updated[0].quantity - 1 };
              showToast(`Decreased ${updated[0].card.name} to ${updated[0].quantity}`, 'info');
              if (ttsEnabled) {
                speakVoiceFeedback(formatCommandSpokenText('decrease_last', `${updated[0].card.name} ${updated[0].quantity}`, language), { lang: language, rate: 1.45 });
              }
              return updated;
            } else {
              showToast(`Removed ${updated[0].card.name}`, 'info');
              if (ttsEnabled) {
                speakVoiceFeedback(formatCommandSpokenText('undo', updated[0].card.name, language), { lang: language, rate: 1.45 });
              }
              return prev.slice(1);
            }
          });
          break;

        case 'confirm':
          if (stagedCards.length === 0) {
            showToast('No cards staged yet', 'warn');
          } else {
            if (ttsEnabled) {
              speakVoiceFeedback(formatCommandSpokenText('confirm', undefined, language), { lang: language, rate: 1.45 });
            }
            handleConfirmImport();
          }
          break;
      }
      return;
    }

    // 2. Handle Set Change
    if (parsed.type === 'set_change' && parsed.newActiveSet) {
      setActiveSetId(parsed.newActiveSet);
      playVoiceCommandChime();
      triggerVoiceHaptic('command');
      showToast(`Switched active set to: ${parsed.newActiveSet}`, 'success');
      if (ttsEnabled) {
        speakVoiceFeedback(formatCommandSpokenText('set_change', parsed.newActiveSet, language), { lang: language, rate: 1.45 });
      }
      return;
    }

    // 3. Handle Card Match
    if (parsed.type === 'card' && parsed.matchedCard) {
      addCardToStaging(parsed.matchedCard, parsed.quantity, parsed.finish);

      if (parsed.candidates && parsed.candidates.length > 1) {
        setCandidates(parsed.candidates);
      } else {
        setCandidates(null);
      }

      // Fast TTS confirmation
      if (ttsEnabled) {
        const spoken = formatCardSpokenText(
          parsed.matchedCard.name,
          parsed.quantity,
          parsed.finish,
          language,
          parsed.matchedCard.collectorNumber
        );
        speakVoiceFeedback(spoken, { lang: language, rate: 1.45 });
      }

      const displayName = parsed.matchedCard.version
        ? `${parsed.matchedCard.name} – ${parsed.matchedCard.version}`
        : parsed.matchedCard.name;
      const finishBadge = parsed.finish === 'foil' ? ' ✨ Foil' : '';
      showToast(
        `✓ ${displayName} #${parsed.matchedCard.collectorNumber} (Set ${parsed.matchedCard.setCode})${finishBadge} x${parsed.quantity}`,
        'success'
      );
      return;
    }

    // 4. Unknown utterance
    setCandidates(null);
    triggerVoiceHaptic('error');
    showToast(parsed.feedbackMessage || `Could not understand "${transcript}"`, 'warn');
  };

  const {
    isSupported,
    isListening,
    language,
    setLanguage,
    toggleListening,
    interimTranscript,
    audioLevel,
    error,
    isAndroid,
  } = useVoiceCardRecognition({
    onFinalResult: handleSpeechFinal,
    onTimeout: (reason) => {
      if (reason === 'inactivity') {
        if (ttsEnabled) {
          speakVoiceFeedback(formatCommandSpokenText('timeout', undefined, language), { lang: language, rate: 1.45 });
        }
        showToast('⏳ Microphone inactive (Tap mic to speak again, or tap examples below)', 'warn');
      }
    },
    continuous: true,
    silenceTimeoutMs: 1400, // Auto-finalize after 1.4s of silence on interim
  });

  const handleToggleListeningWithUnlock = () => {
    initTtsUnlock();
    toggleListening();
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setStagedCards((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as StagedVoiceCard[]
    );
  };

  const handleUpdateFinish = (id: string, newFinish: FinishKey) => {
    setStagedCards((prev) =>
      prev.map((item) => (item.id === id ? { ...item, finish: newFinish } : item))
    );
  };

  const totalCardsCount = stagedCards.reduce((acc, c) => acc + c.quantity, 0);

  const handleConfirmImport = () => {
    if (stagedCards.length === 0) return;
    const cardsToImport = stagedCards.map((c) => ({
      cardId: c.card.id,
      quantity: c.quantity,
      finish: c.finish,
    }));
    onImportCards(cardsToImport);
  };

  const handleCopyAsText = () => {
    if (stagedCards.length === 0) return;
    // Group by set
    const bySet = new Map<string, Array<{ num: string; qty: number }>>();
    for (const item of stagedCards) {
      const setId = item.card.setCode || '1';
      const num = item.card.collectorNumber;
      if (!bySet.has(setId)) bySet.set(setId, []);
      bySet.get(setId)!.push({ num, qty: item.quantity });
    }

    let resultText = '';
    for (const [sId, list] of bySet.entries()) {
      resultText += `Set${sId}\n`;
      for (const entry of list) {
        resultText += `${entry.num},${entry.qty}\n`;
      }
      resultText += '\n';
    }

    onCopyToTextTab(resultText.trim());
    showToast('Copied list formatted for Text Import tab', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Unsupported Browser Warning */}
      {!isSupported && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-extrabold text-sm text-amber-200">Browser Speech Recognition Unavailable</p>
            <p className="mt-0.5 text-slate-300">
              Web Speech API is best supported on Google Chrome, Microsoft Edge, and Safari (including iOS/iPadOS and Android Chrome).
            </p>
          </div>
        </div>
      )}

      {/* Voice Studio Hero Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#1b2038] via-[#15182a] to-[#0f111f] border border-[#c8b07b]/30 shadow-2xl">
        {/* Glowing Background Radial */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#c8b07b]/15 blur-3xl pointer-events-none transition-all duration-700"
          style={{
            transform: isListening ? `scale(${1 + audioLevel * 0.9})` : 'scale(1)',
            opacity: isListening ? 0.7 + audioLevel * 0.5 : 0.2,
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          {/* Active Set & Language Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c8b07b]/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Active Set:</span>
              <div className="min-w-[180px] sm:min-w-[260px] text-left">
                <SearchableSetSelect
                  sets={availableSets}
                  selectedSet={activeSetId}
                  onSelectSet={setActiveSetId}
                  placeholder="Choose set..."
                  allLabel="Select Set"
                />
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(or say "Set 1")</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Android Capability Badge */}
              {isAndroid && (
                <span
                  title="Speech recognition optimized for Android Chrome"
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-bold hidden sm:inline-flex items-center gap-1"
                >
                  <span>🤖</span> Android
                </span>
              )}

              {/* TTS Voice Confirmation Toggle */}
              {isTtsSupported() && (
                <button
                  type="button"
                  data-testid="voice-tts-toggle-button"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={
                    ttsEnabled
                      ? `Voice feedback enabled (${hasThaiTtsSupport() ? 'Thai TTS ready' : 'English fallback'} - Tap to mute)`
                      : 'Voice feedback muted (Tap to enable)'
                  }
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1 border ${
                    ttsEnabled
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm'
                      : 'bg-[#1b2038] text-slate-400 border-slate-700'
                  }`}
                >
                  <span className="text-sm">{ttsEnabled ? '🔊' : '🔈'}</span>
                  <span className="hidden sm:inline">TTS {ttsEnabled ? 'On' : 'Off'}</span>
                  {ttsEnabled && !hasThaiTtsSupport() && (
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                      EN
                    </span>
                  )}
                </button>
              )}

              {/* Language Switcher */}
              <div className="flex items-center gap-0.5 bg-[#131627] p-0.5 rounded-lg border border-[#c8b07b]/20">
                <button
                  type="button"
                  onClick={() => setLanguage('th-TH')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-xs ${
                    language === 'th-TH'
                      ? 'bg-gradient-to-r from-[#dfc792] to-[#c8b07b] text-[#131627] shadow-sm'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  🇹🇭 ไทย
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en-US')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-xs ${
                    language === 'en-US'
                      ? 'bg-gradient-to-r from-[#dfc792] to-[#c8b07b] text-[#131627] shadow-sm'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  🇺🇸 EN
                </button>
              </div>
            </div>
          </div>

          {/* Microphone Central Button */}
          <div className="relative my-2">
            {/* Outer animated halo rings while listening */}
            {isListening && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-[#dfc792]/25 animate-ping"
                  style={{ animationDuration: '2s' }}
                />
                <div
                  className="absolute -inset-3 rounded-full border-2 border-[#dfc792]/40 animate-pulse pointer-events-none"
                  style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
                />
              </>
            )}

            <button
              type="button"
              data-testid="voice-record-button"
              data-mic-main="true"
              onClick={handleToggleListeningWithUnlock}
              aria-label={isListening ? 'Stop listening' : 'Start voice recognition'}
              className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-gradient-to-tr from-[#dfc792] via-[#c8b07b] to-[#f3e5c8] text-[#131627] scale-105 shadow-[#c8b07b]/40 ring-4 ring-[#dfc792]/40'
                  : 'bg-[#1b2038] hover:bg-[#252a48] text-slate-200 border-2 border-[#c8b07b]/40 hover:border-[#c8b07b] hover:scale-105 active:scale-95'
              }`}
            >
              <span className={`text-3xl sm:text-4xl ${isListening ? 'animate-bounce' : ''}`}>
                🎙️
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                  isListening ? 'text-[#131627]' : 'text-[#dfc792]'
                }`}
              >
                {isListening ? 'Listening' : 'Tap to Speak'}
              </span>
            </button>
          </div>

          {/* Waveform Bars Visualizer */}
          {isListening && (
            <div
              className="flex items-center justify-center gap-1 h-7"
              aria-label="Audio level indicator"
            >
              {Array.from({ length: 15 }).map((_, idx) => {
                const centerDist = Math.abs(idx - 7);
                const height = Math.max(
                  4,
                  Math.min(26, audioLevel * 30 * (1 - centerDist * 0.08) + Math.sin(idx) * 2)
                );
                return (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-gradient-to-t from-[#c8b07b] to-[#f3e5c8] transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          )}

          {/* Live Transcript & Interim Feedback */}
          <div className="w-full max-w-md min-h-[44px] flex items-center justify-center">
            {interimTranscript ? (
              <div className="px-4 py-2 rounded-2xl bg-[#c8b07b]/20 border border-[#c8b07b]/40 text-[#dfc792] font-bold text-xs sm:text-sm animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#dfc792] animate-ping shrink-0" />
                <span className="truncate">"{interimTranscript}..."</span>
              </div>
            ) : lastTranscript ? (
              <div className="px-4 py-2 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/30 text-xs sm:text-sm text-slate-200 flex items-center gap-2 max-w-full">
                <span className="text-slate-400 shrink-0 font-bold">Heard:</span>
                <span className="font-extrabold text-[#dfc792] truncate">
                  "{lastTranscript}"
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                {isListening
                  ? 'Listening for Lorcana cards... Try saying "Number 25, 2 cards" or "Elsa Foil"'
                  : 'Tap the microphone above to start adding cards by voice'}
              </p>
            )}
          </div>

          {/* Breakdown tags if recognized */}
          {lastParseResult?.parsedInfo && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-black">
              {lastParseResult.parsedInfo.detectedSet && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Set: {lastParseResult.parsedInfo.detectedSet}
                </span>
              )}
              {lastParseResult.parsedInfo.detectedNumber && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Card: #{lastParseResult.parsedInfo.detectedNumber}
                </span>
              )}
              {lastParseResult.parsedInfo.detectedName && (
                <span className="px-2 py-0.5 rounded-md bg-[#c8b07b]/20 text-[#dfc792] border border-[#c8b07b]/30">
                  Name: {lastParseResult.parsedInfo.detectedName}
                </span>
              )}
              {lastParseResult.parsedInfo.detectedQty && lastParseResult.parsedInfo.detectedQty > 1 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Qty: x{lastParseResult.parsedInfo.detectedQty}
                </span>
              )}
              {lastParseResult.parsedInfo.detectedFinish &&
                lastParseResult.parsedInfo.detectedFinish !== 'normal' && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Finish: FOIL
                  </span>
                )}
            </div>
          )}

          {/* Toast message */}
          {feedbackToast && (
            <div
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                feedbackToast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : feedbackToast.type === 'warn'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[#252a48] text-[#dfc792] border border-[#c8b07b]/40'
              }`}
            >
              {feedbackToast.text}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Candidates / Did You Mean Chips */}
      {candidates && candidates.length > 1 && (
        <div className="p-3.5 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#dfc792]">
            <span>🔍 Multiple cards matched. Tap your desired card:</span>
            <button
              type="button"
              onClick={() => setCandidates(null)}
              className="text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {candidates.map((cand) => (
              <button
                key={cand.id}
                type="button"
                onClick={() => {
                  addCardToStaging(cand, 1);
                  setCandidates(null);
                  showToast(`Added ${cand.name} #${cand.collectorNumber}`, 'success');
                }}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-[#131627] border border-[#c8b07b]/30 hover:border-[#dfc792] shadow-sm shrink-0 transition-all text-left group"
              >
                <img
                  src={resolveCardImageUrl(cand.setCode, cand.collectorNumber, false)}
                  onError={(e) => handleCardImageError(e, cand.setCode, cand.collectorNumber)}
                  alt={cand.name}
                  className="w-8 h-11 object-cover rounded-lg border border-[#c8b07b]/30 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 group-hover:text-[#dfc792] truncate max-w-[130px]">
                    {cand.version ? `${cand.name} – ${cand.version}` : cand.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Set {cand.setCode} #{cand.collectorNumber}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Spoken Examples */}
      <div className="p-3 rounded-2xl bg-[#15182a] border border-[#c8b07b]/20">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
          <span>💡 Quick Voice Examples (Tap to test):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handleSpeechFinal(phrase)}
              className="px-2.5 py-1 rounded-lg bg-[#1b2038] hover:bg-[#252a48] border border-[#c8b07b]/30 text-slate-200 text-xs font-semibold transition-all hover:border-[#dfc792] active:scale-95"
            >
              🗣️ "{phrase}"
            </button>
          ))}
        </div>
      </div>

      {/* Staged Cards Queue */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <span>📋 Staged Cards</span>
            <span className="px-2 py-0.5 rounded-full bg-[#c8b07b]/20 text-[#dfc792] text-xs font-black">
              {totalCardsCount} cards ({stagedCards.length} distinct)
            </span>
          </h3>

          {stagedCards.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAsText}
                className="px-2.5 py-1 rounded-xl text-[#dfc792] hover:bg-[#c8b07b]/20 text-xs font-bold transition-colors"
                title="Convert staged list into Text format for Text tab"
              >
                Copy as Text
              </button>
              <button
                type="button"
                onClick={() => setStagedCards([])}
                className="px-2.5 py-1 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {stagedCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[#c8b07b]/25 text-slate-400 space-y-2">
            <span className="text-4xl block">🎙️</span>
            <p className="text-xs font-bold text-slate-300">No cards in staging queue</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Tap the microphone above and speak e.g. "Set 1 Number 25, 2 cards" or "Elsa Foil"
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            {stagedCards.map((item) => {
              const { card, quantity, finish } = item;
              const displayName = card.version ? `${card.name} – ${card.version}` : card.name;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/30 shadow-md hover:border-[#dfc792]/60 transition-all"
                >
                  {/* Card Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolveCardImageUrl(card.setCode, card.collectorNumber, false)}
                      onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                      alt={card.name}
                      className="w-9 h-12 object-cover rounded-lg border border-[#c8b07b]/30 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-slate-100 truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-[#131627] border border-[#c8b07b]/30 font-bold text-[#dfc792]">
                          Set {card.setCode}
                        </span>
                        <span>#{card.collectorNumber}</span>
                        <span className="font-semibold text-amber-400/90">{rarityLabel(card.rarity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Finish */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={finish}
                      onChange={(e) => handleUpdateFinish(item.id, e.target.value as FinishKey)}
                      className="px-2 py-1 rounded-lg text-xs bg-[#131627] border border-[#c8b07b]/40 font-bold text-slate-200 focus:outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="foil">Foil</option>
                    </select>

                    <div className="flex items-center rounded-xl bg-[#131627] p-0.5 border border-[#c8b07b]/40">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-300 hover:bg-[#252a48] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-[#dfc792]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-300 hover:bg-[#252a48] transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStagedCards((prev) => prev.filter((c) => c.id !== item.id))}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center transition-colors text-xs font-bold"
                      title="Remove card"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Submit Action */}
      {stagedCards.length > 0 && (
        <div className="pt-2 border-t border-[#c8b07b]/20 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Target Binder: <span className="font-bold text-slate-100">{targetBinderName || 'Main Binder'}</span>
          </div>

          <button
            type="button"
            onClick={handleConfirmImport}
            data-testid="voice-confirm-import-btn"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 active:scale-95 text-[#131627] font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>📥</span>
            <span>Import {totalCardsCount} Cards into Binder</span>
          </button>
        </div>
      )}
    </div>
  );
}
