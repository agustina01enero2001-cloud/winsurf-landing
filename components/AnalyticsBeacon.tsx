"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ORIGIN_PARAM, SUBORIGIN_PARAM } from "@/lib/analytics-shared";
import { getOrCreateFingerprint, FINGERPRINT_PARAM } from "@/lib/visitor";

const SESSION_PREFIX = "ws_view:";

type AnalyticsBeaconProps = {
  slug: string;
};

export default function AnalyticsBeacon({ slug }: AnalyticsBeaconProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!slug) return;
    const origin = (searchParams.get(ORIGIN_PARAM) ?? "").trim().toLowerCase();
    const subOrigin = (searchParams.get(SUBORIGIN_PARAM) ?? "")
      .trim()
      .toLowerCase();
    const sessionKey = `${SESSION_PREFIX}${slug}:${origin || "_"}:${subOrigin || "_"}`;

    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // private mode — still try once
    }

    const fp = getOrCreateFingerprint();
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        c: slug,
        o: origin || undefined,
        so: subOrigin || undefined,
        type: "view",
        [FINGERPRINT_PARAM]: fp,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [slug, searchParams]);

  return null;
}
