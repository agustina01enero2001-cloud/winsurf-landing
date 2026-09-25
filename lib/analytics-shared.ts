export const ORIGIN_PARAM = "o";

export type TrackKind = "view" | "click";

export function normalizeOriginKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return key || null;
}

export function slugifyOriginName(name: string): string {
  return normalizeOriginKey(name) ?? "origen";
}
