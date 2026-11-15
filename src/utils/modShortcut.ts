import { isMac } from "./isMac";

// Mod-Z, Mod-Shift-Z and Mod-Y, which undo and redo in the editor's history
export function isHistoryKey(event: KeyboardEvent): boolean {
  const key = modShortcutKey(event);
  return key === "z" || (key === "y" && !event.shiftKey);
}

// Mod-K, which opens the link editor
export function isLinkKey(event: KeyboardEvent): boolean {
  return modShortcutKey(event) === "k" && !event.shiftKey;
}

// The key pressed with Mod and no other modifier than Shift, or null. Mod is
// Cmd on macOS and Ctrl elsewhere, as in ProseMirror's keymap.
function modShortcutKey(event: KeyboardEvent): string | null {
  const mod = isMac()
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  if (!mod || event.altKey) {
    return null;
  }
  // On non-Latin layouts, the key is identified by its position, as
  // ProseMirror's keymap does
  return /^[\x20-\x7e]$/u.test(event.key)
    ? event.key.toLowerCase()
    : event.code.replace(/^Key/u, "").toLowerCase();
}
