import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { DEFAULT_GAME_SETTINGS } from '../shared/config';
import { ClientPreferences, GameSettings } from '../shared/types';

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
  const [prefs, setPrefs] = useState<ClientPreferences>({ ...preferences });
  const [rules, setRules] = useState<GameSettings>({ ...gameSettings });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(prefs);
    if (canEditMatchRules) {
      onSaveGameSettings(rules);
    }
    onClose();
  };

  const handleResetDefaults = () => {
    setRules({ ...DEFAULT_GAME_SETTINGS });
  };

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

        <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Audio & Graphics */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Audio & Graphics
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
            </div>
          </section>

          {/* Match & Tank Physics Rules */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Arena & Tank Rules
                {!canEditMatchRules && (
                  <span className="ml-2 text-slate-400 normal-case font-normal">
                    (Editable by Room Host before match starts)
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
              <NumberField
                id="rot-speed"
                label="Tank Auto-Rotation (°/sec)"
                value={Math.round((rules.tankRotationSpeed * 180) / Math.PI)}
                min={45}
                max={360}
                step={5}
                disabled={!canEditMatchRules}
                onChange={(deg) =>
                  setRules({ ...rules, tankRotationSpeed: (deg * Math.PI) / 180 })
                }
              />
              <NumberField
                id="move-speed"
                label="Tank Move Speed (px/s)"
                value={rules.tankMoveSpeed}
                min={140}
                max={420}
                step={10}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, tankMoveSpeed: v })}
              />
              <NumberField
                id="proj-speed"
                label="Projectile Speed (px/s)"
                value={rules.projectileSpeed}
                min={400}
                max={1200}
                step={20}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, projectileSpeed: v })}
              />
              <NumberField
                id="proj-dmg"
                label="Projectile Damage (HP)"
                value={rules.projectileDamage}
                min={10}
                max={100}
                step={5}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, projectileDamage: v })}
              />
              <NumberField
                id="max-ammo"
                label="Max Ammunition"
                value={rules.maxAmmo}
                min={3}
                max={10}
                step={1}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, maxAmmo: v })}
              />
              <NumberField
                id="ammo-regen"
                label="Ammo Reload Time (ms)"
                value={rules.ammoRegenTimeMs}
                min={500}
                max={4000}
                step={100}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, ammoRegenTimeMs: v })}
              />
              <NumberField
                id="respawn-delay"
                label="Respawn Delay (ms)"
                value={rules.respawnDelayMs}
                min={1000}
                max={8000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, respawnDelayMs: v })}
              />
              <NumberField
                id="invinc-dur"
                label="Spawn Shield Duration (ms)"
                value={rules.invincibilityDurationMs}
                min={1000}
                max={6000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, invincibilityDurationMs: v })}
              />
              <NumberField
                id="powerup-dur"
                label="Power-Up Duration (ms)"
                value={rules.powerUpDurationMs}
                min={3000}
                max={20000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, powerUpDurationMs: v })}
              />
              <NumberField
                id="crate-int"
                label="Crate Spawn Interval (ms)"
                value={rules.crateSpawnIntervalMs}
                min={2500}
                max={20000}
                step={500}
                disabled={!canEditMatchRules}
                onChange={(v) => setRules({ ...rules, crateSpawnIntervalMs: v })}
              />
              <NumberField
                id="match-dur"
                label="Match Duration (minutes)"
                value={Math.round(rules.matchDurationSec / 60)}
                min={1}
                max={15}
                step={1}
                disabled={!canEditMatchRules}
                onChange={(mins) => setRules({ ...rules, matchDurationSec: mins * 60 })}
              />
              <NumberField
                id="max-players"
                label="Max Players Per Room"
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

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (val: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}) => (
  <div className="bg-[#0b0f14] border border-slate-800 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
    <label htmlFor={id} className="text-slate-300 font-medium">
      {label}
    </label>
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={value}
      onChange={(e) => {
        const num = Number(e.target.value);
        if (Number.isFinite(num)) {
          onChange(Math.max(min, Math.min(max, num)));
        }
      }}
      className="w-20 px-2 py-1 rounded bg-[#111720] border border-slate-700 text-right font-mono-num text-slate-100 disabled:opacity-50"
    />
  </div>
);
