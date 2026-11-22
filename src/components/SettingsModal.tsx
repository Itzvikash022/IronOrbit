import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Keyboard } from 'lucide-react';
import { DEFAULT_ACTION_BIND, formatActionBind } from '../shared/actionBind';
import { DEFAULT_GAME_SETTINGS, sanitizeGameSettings } from '../shared/config';
import { ActionBind, ClientPreferences, GameSettings } from '../shared/types';

interface SettingsModalProps {
  preferences: ClientPreferences;
  gameSettings: GameSettings;
  canEditMatchRules: boolean;
  onSavePreferences: (prefs: ClientPreferences) => void;
  onSaveGameSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  gameSettings,
  canEditMatchRules,
  onSavePreferences,
  onSaveGameSettings,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<ClientPreferences>({
    ...preferences,
    actionBind: preferences.actionBind ?? { ...DEFAULT_ACTION_BIND },
  });
  const [rules, setRules] = useState<GameSettings>(() =>
    sanitizeGameSettings(gameSettings, DEFAULT_GAME_SETTINGS)
  );
  const [listeningBind, setListeningBind] = useState(false);

  useEffect(() => {
    if (!listeningBind) return;

    const finish = (bind: ActionBind) => {
      setPrefs((prev) => ({ ...prev, actionBind: bind }));
      setListeningBind(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setListeningBind(false);
        return;
      }
      finish({ device: 'keyboard', code: e.code });
    };
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      finish({ device: 'mouse', button: e.button });
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [listeningBind]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(prefs);
    if (canEditMatchRules) {
      onSaveGameSettings(sanitizeGameSettings(rules, DEFAULT_GAME_SETTINGS));
    }
    onClose();
  };

  const handleResetDefaults = () => {
    setRules({ ...DEFAULT_GAME_SETTINGS });
  };

  const rotDeg = Math.round((rules.tankRotationSpeed * 180) / Math.PI);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0b0f14]/85">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-2xl bg-[#111720] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        <div className="px-6 py-4 bg-[#0d1219] border-b border-slate-800 flex items-center justify-between">
          <h2
            id="settings-title"
            className="font-display font-bold text-2xl text-slate-100 tracking-wide"
          >
            Game Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleApply} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Audio, Graphics & Controls */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Audio, Graphics & Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="sound-volume" className="text-xs font-medium text-slate-200">
                    Sound Volume
                  </label>
                  <span className="font-mono-num text-xs text-amber-400">
                    {prefs.muted ? 'Muted' : `${Math.round(prefs.soundVolume * 100)}%`}
                  </span>
                </div>
                <input
                  id="sound-volume"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(prefs.soundVolume * 100)}
                  onChange={(e) =>
                    setPrefs({ ...prefs, soundVolume: Number(e.target.value) / 100, muted: false })
                  }
                  className="w-full accent-amber-500"
                />
                <label className="mt-2.5 flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.muted}
                    onChange={(e) => setPrefs({ ...prefs, muted: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span>Mute all sound effects</span>
                </label>
              </div>

              <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-3.5">
                <label
                  htmlFor="graphics-quality"
                  className="block text-xs font-medium text-slate-200 mb-2"
                >
                  Graphics Quality
                </label>
                <select
                  id="graphics-quality"
                  value={prefs.graphicsQuality}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      graphicsQuality: e.target.value as 'high' | 'medium',
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-[#111720] border border-slate-700 text-xs text-slate-100"
                >
                  <option value="high">High (Ambient biome particles enabled)</option>
                  <option value="medium">Lightweight (Minimal particles)</option>
                </select>
              </div>

              <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-3.5 sm:col-span-2">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                      Drive / Fire Key
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Tap to fire one shell and flip spin. Hold to drive straight without
                      shooting. Spam taps to fire more shells.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs((prev) => ({ ...prev, actionBind: { ...DEFAULT_ACTION_BIND } }))
                    }
                    className="shrink-0 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setListeningBind(true)}
                  className={`w-full mt-1 px-3 py-2.5 rounded-lg border text-sm font-semibold tracking-wide cursor-pointer transition-colors ${
                    listeningBind
                      ? 'border-amber-400/70 bg-amber-500/15 text-amber-200 animate-pulse'
                      : 'border-slate-700 bg-[#111720] text-slate-100 hover:border-slate-500'
                  }`}
                >
                  {listeningBind
                    ? 'Press any key or mouse button… (Esc cancel)'
                    : formatActionBind(prefs.actionBind)}
                </button>
              </div>
            </div>
          </section>

          {/* Win Milestones & Mode Targets */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Win Milestones
                {!canEditMatchRules && (
                  <span className="ml-2 text-slate-400 normal-case font-normal">
                    (Host only before match starts)
                  </span>
                )}
              </h3>
              {canEditMatchRules && (
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Deathmatch / Team DM Win Rule</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={!canEditMatchRules}
                      onClick={() => setRules({ ...rules, dmWinMode: 'milestone' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        rules.dmWinMode === 'milestone'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                          : 'bg-slate-800 text-slate-400'
                      } disabled:opacity-50`}
                    >
                      Kill Target
                    </button>
                    <button
                      type="button"
                      disabled={!canEditMatchRules}
                      onClick={() => setRules({ ...rules, dmWinMode: 'timed' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        rules.dmWinMode === 'timed'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                          : 'bg-slate-800 text-slate-400'
                      } disabled:opacity-50`}
                    >
                      Timed
                    </button>
                  </div>
                </div>
                {rules.dmWinMode === 'milestone' && (
                  <SliderRow
                    id="dm-kill-target"
                    label="Kills to Win"
                    display={`${rules.killTarget} kills`}
                    value={rules.killTarget}
                    min={3}
                    max={99}
                    step={1}
                    disabled={!canEditMatchRules}
                    onChange={(v) => setRules({ ...rules, killTarget: v })}
                  />
                )}
              </div>

              <div className="bg-[#0b0f14] border border-slate-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Capture Flag Win Rule</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={!canEditMatchRules}
                      onClick={() => setRules({ ...rules, ctfWinMode: 'milestone' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        rules.ctfWinMode === 'milestone'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                          : 'bg-slate-800 text-slate-400'
                      } disabled:opacity-50`}
                    >
                      Flag Target
                    </button>
                    <button
                      type="button"
                      disabled={!canEditMatchRules}
                      onClick={() => setRules({ ...rules, ctfWinMode: 'timed' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        rules.ctfWinMode === 'timed'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                          : 'bg-slate-800 text-slate-400'
                      } disabled:opacity-50`}
                    >
                      Timed
                    </button>
                  </div>
                </div>
                {rules.ctfWinMode === 'milestone' && (
                  <SliderRow
                    id="ctf-flag-target"
                    label="Captures to Win"
                    display={`${rules.flagTarget} ${rules.flagTarget === 1 ? 'flag' : 'flags'}`}
                    value={rules.flagTarget}
                    min={1}
                    max={15}
                    step={1}
                    disabled={!canEditMatchRules}
                    onChange={(v) => setRules({ ...rules, flagTarget: v })}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Simplified Arena & Tank Rules */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Arena &amp; Tank Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <SliderField
                id="rot-speed"
                label="Auto-Rotation Speed"
                display={`${rotDeg}°/s`}
                value={rotDeg}
                min={60}
                max={300}
                step={5}
                disabled={!canEditMatchRules}
                onChange={(deg) =>
                  setRules({ ...rules, tankRotationSpeed: (deg * Math.PI) / 180 })
                }
              />
              <SliderField
                id="move-speed"
                label="Tank Move Speed"
                display={`${rules.tankMoveSpeed} px/s`}
                value={rules.tankMoveSpeed}
                min={150}
                max={400}
                step={5}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, tankMoveSpeed: v })}
              />
              <SliderField
                id="proj-speed"
                label="Shell Speed"
                display={`${rules.projectileSpeed} px/s`}
                value={rules.projectileSpeed}
                min={440}
                max={1100}
                step={20}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, projectileSpeed: v })}
              />
              <SliderField
                id="proj-dmg"
                label="Shell Damage"
                display={`${rules.projectileDamage} HP`}
                value={rules.projectileDamage}
                min={10}
                max={100}
                step={5}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, projectileDamage: v })}
              />
              <SliderField
                id="max-ammo"
                label="Max Shells"
                display={`${rules.maxAmmo} shells`}
                value={rules.maxAmmo}
                min={3}
                max={10}
                step={1}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, maxAmmo: v })}
              />
              <SliderField
                id="ammo-regen"
                label="Shell Reload Time"
                display={`${(rules.ammoRegenTimeMs / 1000).toFixed(2).replace(/\.?0+$/, '')}s`}
                value={rules.ammoRegenTimeMs}
                min={500}
                max={3500}
                step={50}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, ammoRegenTimeMs: v })}
              />
              <SliderField
                id="respawn-delay"
                label="Respawn Delay"
                display={`${(rules.respawnDelayMs / 1000).toFixed(1)}s`}
                value={rules.respawnDelayMs}
                min={1000}
                max={8000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, respawnDelayMs: v })}
              />
              <SliderField
                id="invinc-dur"
                label="Spawn Shield"
                display={`${(rules.invincibilityDurationMs / 1000).toFixed(1)}s`}
                value={rules.invincibilityDurationMs}
                min={1000}
                max={6000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, invincibilityDurationMs: v })}
              />
              <SliderField
                id="powerup-dur"
                label="Boost Duration"
                display={`${(rules.powerUpDurationMs / 1000).toFixed(1)}s`}
                value={rules.powerUpDurationMs}
                min={3000}
                max={20000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, powerUpDurationMs: v })}
              />
              <SliderField
                id="crate-int"
                label="Boost Respawn Interval"
                display={`${(rules.crateSpawnIntervalMs / 1000).toFixed(1)}s`}
                value={rules.crateSpawnIntervalMs}
                min={3000}
                max={20000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, crateSpawnIntervalMs: v })}
              />
              <SliderField
                id="match-dur"
                label="Match Time Limit"
                display={`${Math.round(rules.matchDurationSec / 60)} min`}
                value={Math.round(rules.matchDurationSec / 60)}
                min={1}
                max={15}
                step={1}
                disabled={!canEditMatchRules}
                onChange={(mins) => setRules({ ...rules, matchDurationSec: mins * 60 })}
              />
              <SliderField
                id="max-players"
                label="Max Players"
                display={`${rules.maxPlayersPerRoom} pilots`}
                value={rules.maxPlayersPerRoom}
                min={2}
                max={16}
                step={1}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, maxPlayersPerRoom: v })}
              />
            </div>
          </section>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SliderFieldProps {
  id: string;
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (val: number) => void;
}

const SliderRow: React.FC<SliderFieldProps> = ({
  id,
  label,
  display,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-slate-300 font-medium">
        {label}
      </label>
      <span className="font-mono-num text-amber-400 font-semibold">{display}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={Math.max(min, Math.min(max, value))}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-amber-500 disabled:opacity-50"
    />
  </div>
);

const SliderField: React.FC<SliderFieldProps> = (props) => (
  <div className="bg-[#0b0f14] border border-slate-800 rounded-lg px-3.5 py-2.5">
    <SliderRow {...props} />
  </div>
);
