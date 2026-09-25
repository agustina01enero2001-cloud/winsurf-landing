export const VISITOR_STORAGE_KEY = "ws_vid";
export const VISITOR_PARAM = "vid";

/** Stable per-browser id (soft fingerprint). Survives refreshes; not shared across devices. */
export function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY)?.trim();
    if (existing && existing.length >= 16) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return id;
  } catch {
    return `ephemeral_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
