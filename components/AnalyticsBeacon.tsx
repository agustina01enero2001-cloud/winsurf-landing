"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ORIGIN_PARAM } from "@/lib/analytics-shared";
import { getOrCreateVisitorId, VISITOR_PARAM } from "@/lib/visitor";

const SESSION_PREFIX = "ws_view:";

type AnalyticsBeaconProps = {
  slug: string;
};

export default function AnalyticsBeacon({ slug }: AnalyticsBeaconProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!slug) return;
    const origin = (searchParams.get(ORIGIN_PARAM) ?? "").trim().toLowerCase();
    const sessionKey = `${SESSION_PREFIX}${slug}:${origin || "_"}`;

    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // private mode — still try once
    }

    const vid = getOrCreateVisitorId();
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        c: slug,
        o: origin || undefined,
        type: "view",
        [VISITOR_PARAM]: vid,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [slug, searchParams]);

  return null;
}
