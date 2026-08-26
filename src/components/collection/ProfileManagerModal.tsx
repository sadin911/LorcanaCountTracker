import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PROFILE_ICONS } from '../../constants/lorcana';
import { useCollectionStore } from '../../store/collectionStore';
import { totalCopies } from '../../types/collection';

export function ProfileManagerModal({ onClose }: { onClose: () => void }) {
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const createProfile = useCollectionStore((s) => s.createProfile);
  const switchProfile = useCollectionStore((s) => s.switchProfile);
  const renameProfile = useCollectionStore((s) => s.renameProfile);
  const deleteProfile = useCollectionStore((s) => s.deleteProfile);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(PROFILE_ICONS[0]);

  const list = Object.values(profiles);
  const isLastBinder = list.length <= 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitCreate = () => {
    if (!newName.trim()) return;
    createProfile(newName, newIcon);
    setNewName('');
    setShowCreate(false);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Binders</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          {list.map((p) => {
            const distinct = Object.keys(p.cards).length;
            const copies = Object.values(p.cards).reduce((n, e) => n + totalCopies(e.variants), 0);
            const isActive = p.id === activeProfileId;

            return (
              <div
                key={p.id}
                className={`rounded-xl border p-2.5 ${
                  isActive ? 'border-sky-600/60 bg-sky-950/20' : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                {editingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameProfile(p.id, editingName);
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        renameProfile(p.id, editingName);
                        setEditingId(null);
                      }}
                      className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-100 truncate">{p.name}</p>
                        {isActive && (
                          <span className="px-1.5 rounded bg-sky-600 text-white text-[9px] font-bold shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {distinct} distinct · {copies} copies
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            switchProfile(p.id);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200"
                        >
                          Use
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Rename ${p.name}`}
                        onClick={() => {
                          setEditingId(p.id);
                          setEditingName(p.name);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${p.name}`}
                        disabled={isLastBinder}
                        title={isLastBinder ? 'You must keep at least one binder' : undefined}
                        onClick={() => {
                          if (window.confirm(`Delete "${p.name}" and everything in it?`)) void deleteProfile(p.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-[11px] disabled:opacity-30 disabled:hover:bg-slate-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showCreate ? (
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-2.5 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              placeholder="Binder name"
              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
            <div className="flex flex-wrap gap-1">
              {PROFILE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`w-8 h-8 rounded-lg border text-sm ${
                    newIcon === icon ? 'border-sky-500 bg-sky-950/40' : 'border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitCreate}
                disabled={!newName.trim()}
                className="flex-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Create binder
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-full py-2 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:border-sky-600 hover:text-sky-300"
          >
            + New binder
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
