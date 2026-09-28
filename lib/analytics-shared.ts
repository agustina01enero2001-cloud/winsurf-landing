export const ORIGIN_PARAM = "o";
export const SUBORIGIN_PARAM = "so";

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

export function buildAttributionQuery(
  originKey: string | null | undefined,
  subOriginKey?: string | null,
): string {
  const o = normalizeOriginKey(originKey);
  if (!o) return "";
  const so = normalizeOriginKey(subOriginKey);
  const params = new URLSearchParams();
  params.set(ORIGIN_PARAM, o);
  if (so) params.set(SUBORIGIN_PARAM, so);
  return params.toString();
}
