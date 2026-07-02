export const TWCLID_PARAM = "twclid";
export const TWCLID_STORAGE_KEY = "winsurf_twclid";

export function sanitizeTwclid(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed.slice(0, 256);
}

export function getStoredTwclid(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sanitizeTwclid(sessionStorage.getItem(TWCLID_STORAGE_KEY));
}

export function storeTwclid(value: string | null | undefined): void {
  if (typeof window === "undefined") {
    return;
  }
  const id = sanitizeTwclid(value);
  if (id) {
    sessionStorage.setItem(TWCLID_STORAGE_KEY, id);
  }
}

export function readTwclidFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  return sanitizeTwclid(searchParams.get(TWCLID_PARAM)) ?? getStoredTwclid();
}
