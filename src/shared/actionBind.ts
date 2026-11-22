import type { ActionBind } from './types.ts';

export const DEFAULT_ACTION_BIND: ActionBind = { device: 'keyboard', code: 'Space' };

export function sanitizeActionBind(raw: unknown): ActionBind {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ACTION_BIND };
  const obj = raw as Record<string, unknown>;
  if (obj.device === 'mouse' && Number.isInteger(obj.button) && (obj.button as number) >= 0) {
    return { device: 'mouse', button: obj.button as number };
  }
  if (obj.device === 'keyboard' && typeof obj.code === 'string' && obj.code.length > 0) {
    return { device: 'keyboard', code: obj.code };
  }
  return { ...DEFAULT_ACTION_BIND };
}

export function formatActionBind(bind: ActionBind): string {
  if (bind.device === 'mouse') {
    if (bind.button === 0) return 'Left Mouse';
    if (bind.button === 1) return 'Middle Mouse';
    if (bind.button === 2) return 'Right Mouse';
    return `Mouse ${bind.button}`;
  }
  const code = bind.code;
  if (code === 'Space') return 'Space';
  if (code.startsWith('Key') && code.length === 4) return code.slice(3);
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5) + ' Arrow';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
  if (code === 'MetaLeft' || code === 'MetaRight') return 'Meta';
  return code;
}

export function bindsEqual(a: ActionBind, b: ActionBind): boolean {
  if (a.device !== b.device) return false;
  if (a.device === 'keyboard' && b.device === 'keyboard') return a.code === b.code;
  if (a.device === 'mouse' && b.device === 'mouse') return a.button === b.button;
  return false;
}
