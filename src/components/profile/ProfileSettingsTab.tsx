import React from 'react';
import {
  Palette, CheckCircle2, KeyRound, Eye, EyeOff, AlertCircle, Check, RefreshCw, Info
} from 'lucide-react';
import type { AppTheme } from '../../types';

interface ProfileSettingsTabProps {
  currentUserUid: string;
  activeTheme: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  customTmdbApiKey?: string;
  inputApiKey: string;
  onInputApiKeyChange: (val: string) => void;
  showApiKey: boolean;
  onToggleShowApiKey: () => void;
  isTestingKey: boolean;
  testResult: { valid: boolean; message: string } | null;
  isSavingKey: boolean;
  keyNotice: string | null;
  onTestKey: () => void;
  onSaveApiKey: () => void;
  onRemoveApiKey: () => void;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  currentUserUid,
  activeTheme,
  onSelectTheme,
  customTmdbApiKey,
  inputApiKey,
  onInputApiKeyChange,
  showApiKey,
  onToggleShowApiKey,
  isTestingKey,
  testResult,
  isSavingKey,
  keyNotice,
  onTestKey,
  onSaveApiKey,
  onRemoveApiKey
}) => {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Theme & Accent Color Customization Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Theme & Accent Color Customization
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamlessly switch between Nigerian Emerald, Royal Gold, and Deep Obsidian tones across the entire application interface.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0 capitalize">
            Active: {activeTheme}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* 1. Nigerian Emerald */}
          <div
            id="theme-option-emerald"
            onClick={() => onSelectTheme?.('emerald')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activeTheme === 'emerald'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 shadow" />
                <span className="text-sm font-bold text-white">Nigerian Emerald</span>
              </div>
              {activeTheme === 'emerald' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Rich green and vibrant teal accents celebrating the timeless spirit of Nollywood.
            </p>
            <div className="pt-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Classic</span>
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold">Vibrant</span>
            </div>
          </div>

          {/* 2. Royal Gold */}
          <div
            id="theme-option-gold"
            onClick={() => onSelectTheme?.('gold')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activeTheme === 'gold'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500 shadow" />
                <span className="text-sm font-bold text-white">Royal Gold</span>
              </div>
              {activeTheme === 'gold' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Radiant gold and warm metallic tones inspired by Nollywood red carpets and ₦1B+ records.
            </p>
            <div className="pt-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">Prestige</span>
              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">Royal</span>
            </div>
          </div>

          {/* 3. Deep Obsidian */}
          <div
            id="theme-option-obsidian"
            onClick={() => onSelectTheme?.('obsidian')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activeTheme === 'obsidian'
                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50'
                : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-500 shadow" />
                <span className="text-sm font-bold text-white">Deep Obsidian</span>
              </div>
              {activeTheme === 'obsidian' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Midnight onyx and electric violet hues crafted for modern, immersive cinema sessions.
            </p>
            <div className="pt-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">Midnight</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">Violet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal External API Keys & Quota Settings */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Personal External API Keys & Quota Settings
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provide your personal The Movie Database (TMDb) v3 API key. All movie discovery, deep-casts, and historical sweeps will prioritize your key to avoid shared daily rate limits.
            </p>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
              customTmdbApiKey
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {customTmdbApiKey ? 'Custom Key Active' : 'Default Key'}
          </span>
        </div>

        {/* API Key Input Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            TMDb API v3 Key
          </label>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={inputApiKey}
              onChange={(e) => onInputApiKeyChange(e.target.value)}
              placeholder="Enter your 32-character TMDb API v3 key"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={onToggleShowApiKey}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Stored privately in your Firestore user document (`/users/{currentUserUid}`). Security rules forbid any other user from reading or modifying your key.
          </p>
        </div>

        {/* Test Connection Result */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              testResult.valid
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Save Feedback Notice */}
        {keyNotice && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{keyNotice}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
          <button
            id="btn-test-tmdb-key"
            onClick={onTestKey}
            disabled={isTestingKey || !inputApiKey.trim()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
            <span>{isTestingKey ? 'Verifying...' : 'Test Connection'}</span>
          </button>

          <button
            id="btn-save-tmdb-key"
            onClick={onSaveApiKey}
            disabled={isSavingKey || !inputApiKey.trim()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSavingKey ? 'Saving to Cloud...' : 'Save API Key'}</span>
          </button>

          {customTmdbApiKey && (
            <button
              id="btn-remove-tmdb-key"
              onClick={onRemoveApiKey}
              disabled={isSavingKey}
              className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
            >
              Reset to Default
            </button>
          )}
        </div>

        {/* TMDb Account Instructions */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <Info className="w-4 h-4 text-teal-400" />
            <span>How to get a free personal TMDb API Key:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-400">
            <li>
              Create an account at{' '}
              <a href="https://www.themoviedb.org/signup" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                themoviedb.org
              </a>.
            </li>
            <li>Go to Account Settings &gt; API and click "Create".</li>
            <li>Select "Developer", agree to terms, and copy your 32-character API Key (v3 auth).</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
