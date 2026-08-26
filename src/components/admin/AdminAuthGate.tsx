import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { isAdminEmail, verifyAdminPasskey } from '../../utils/adminAuth';

interface Props {
  onAuthenticated: () => void;
  onClose: () => void;
}

export function AdminAuthGate({ onAuthenticated, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  const [showPasskeyFallback, setShowPasskeyFallback] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const isCurrentAdmin = user && isAdminEmail(user.email);

  // Auto unlock if user is already authenticated as an admin
  useEffect(() => {
    if (isCurrentAdmin) {
      onAuthenticated();
    }
  }, [isCurrentAdmin, onAuthenticated]);

  const handleGoogleSignIn = async () => {
    setOauthError(null);
    setSigningIn(true);
    try {
      const signedInUser = await signIn();
      if (signedInUser) {
        if (isAdminEmail(signedInUser.email)) {
          onAuthenticated();
        } else {
          setOauthError(`Access Denied: ${signedInUser.email || 'This account'} is not an authorized administrator.`);
        }
      }
    } catch (err: any) {
      setOauthError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPasskey(passkey)) {
      setPasskeyError(false);
      onAuthenticated();
    } else {
      setPasskeyError(true);
    }
  };

  return (
    <div className="p-6 space-y-6 text-center max-w-md mx-auto">
      {/* Icon Emblem */}
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#b39552]/30 via-[#dfc792]/20 to-[#c8b07b]/30 border border-[#c8b07b]/40 flex items-center justify-center text-3xl shadow-xl shadow-[#c8b07b]/15 ring-4 ring-[#c8b07b]/10">
        🛡️
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-slate-100 tracking-tight">Illumineer Admin Access</h3>
        <p className="text-xs text-slate-400">
          Sign in with your authorized Google OAuth account to access telemetry and analytics.
        </p>
      </div>

      {/* OAuth Status / Primary Login Section */}
      <div className="space-y-3.5 pt-1">
        {user ? (
          <div className="p-4 rounded-2xl bg-[#1b2038] border border-[#c8b07b]/30 space-y-3 text-left">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Admin'}
                  className="w-10 h-10 rounded-full border border-[#c8b07b]/50 object-cover shadow"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#131627] border border-[#c8b07b]/40 flex items-center justify-center font-bold text-sm text-[#dfc792]">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {user.displayName || 'Google Account'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
              </div>
            </div>

            {isCurrentAdmin ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <span>✓</span> Authorized Administrator
                </div>
                <button
                  type="button"
                  onClick={onAuthenticated}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b39552] to-[#dfc792] text-[#131627] hover:brightness-110 active:scale-98 text-xs font-black shadow-lg transition-all"
                >
                  Enter Admin Console →
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-700/50 text-[11px] text-rose-300">
                  ⚠️ This Google account does not have Admin privileges.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    handleGoogleSignIn();
                  }}
                  className="w-full py-2 rounded-xl bg-[#131627] border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 transition-colors"
                >
                  Switch Google Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn || authLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-98 text-slate-900 text-xs font-extrabold shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {signingIn ? 'Signing in with Google...' : 'Sign in with Google OAuth'}
            </button>

            {(oauthError || authError) && (
              <p className="text-xs text-rose-400 font-semibold p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40">
                {oauthError || authError}
              </p>
            )}
          </div>
        )}

        {/* Secondary Passkey Section */}
        <div className="pt-2">
          {!showPasskeyFallback ? (
            <button
              type="button"
              onClick={() => setShowPasskeyFallback(true)}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline transition-colors"
            >
              Use Passkey instead
            </button>
          ) : (
            <form onSubmit={handlePasskeySubmit} className="space-y-2.5 p-4 rounded-2xl bg-[#131627] border border-slate-700/60 text-left">
              <label className="block text-[11px] font-bold text-slate-300">
                Admin Passkey
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  setPasskeyError(false);
                }}
                placeholder="Enter passkey..."
                className={`w-full px-3 py-2 rounded-xl bg-[#0d0f1b] border text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 ${
                  passkeyError
                    ? 'border-rose-500 text-rose-200'
                    : 'border-[#c8b07b]/30 focus:border-[#c8b07b]'
                }`}
              />
              {passkeyError && (
                <p className="text-[10px] text-rose-400 font-semibold">Incorrect passkey.</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasskeyFallback(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300"
                >
                  Hide
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#c8b07b] hover:bg-[#dfc792] text-[#131627] text-[11px] font-extrabold shadow"
                >
                  Unlock
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Exit Button */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Return to Public App
        </button>
      </div>
    </div>
  );
}
