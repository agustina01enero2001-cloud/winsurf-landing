/** Internal fingerprint only — never appended to destination URLs. */
export const FINGERPRINT_STORAGE_KEY = "ws_fp";
/** Legacy key from visitor-id era; still read for continuity. */
const LEGACY_STORAGE_KEY = "ws_vid";
/** Query/body field sent to our APIs for dedupe (not forwarded outbound). */
export const FINGERPRINT_PARAM = "fp";

/** Stable per-browser fingerprint. Survives refreshes; not shared across devices. */
export function getOrCreateFingerprint(): string {
  try {
    const existing =
      localStorage.getItem(FINGERPRINT_STORAGE_KEY)?.trim() ||
      localStorage.getItem(LEGACY_STORAGE_KEY)?.trim();
    if (existing && existing.length >= 16) {
      if (!localStorage.getItem(FINGERPRINT_STORAGE_KEY)) {
        localStorage.setItem(FINGERPRINT_STORAGE_KEY, existing);
      }
      return existing;
    }
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, id);
    return id;
  } catch {
    return `ephemeral_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
