import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizeOriginKey,
  type TrackKind,
} from "@/lib/analytics-shared";

export {
  ORIGIN_PARAM,
  SUBORIGIN_PARAM,
  normalizeOriginKey,
  slugifyOriginName,
  buildAttributionQuery,
} from "@/lib/analytics-shared";

export type { TrackKind } from "@/lib/analytics-shared";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function hashVisitorKey(raw: string): string {
  const salt = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  return createHash("sha256").update(`${salt}:${raw}`).digest("hex");
}

function resolveVisitorKey(
  fingerprint?: string | null,
  visitorIp?: string | null,
): string {
  const id = typeof fingerprint === "string" ? fingerprint.trim() : "";
  if (id.length >= 8) return hashVisitorKey(`fp:${id}`);
  const ip = (visitorIp ?? "").trim() || "unknown";
  return hashVisitorKey(`ip:${ip}`);
}

export type TrackEventResult =
  | {
      ok: true;
      bucket: "suborigin" | "origin" | "direct";
      originKey: string | null;
      subOriginKey: string | null;
      counted: boolean;
    }
  | { ok: false };

/**
 * Increment view/click once per fingerprint + origin + suborigin.
 * Falls back to IP only when no fingerprint is sent.
 */
export async function trackEvent(
  slug: string,
  originKeyRaw: string | null | undefined,
  kind: TrackKind,
  opts?: {
    subOriginKey?: string | null;
    fingerprint?: string | null;
    visitorIp?: string | null;
  },
): Promise<TrackEventResult> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: slug.trim().toLowerCase(), active: true },
    select: { id: true },
  });
  if (!tenant) return { ok: false };

  const originKeyNorm = normalizeOriginKey(originKeyRaw);
  const subKeyNorm = normalizeOriginKey(opts?.subOriginKey);

  let bucket: "suborigin" | "origin" | "direct" = "direct";
  let originId: string | null = null;
  let subOriginId: string | null = null;
  let originKey = "";
  let subOriginKey = "";

  if (originKeyNorm) {
    const origin = await prisma.tenantOrigin.findFirst({
      where: { tenantId: tenant.id, key: originKeyNorm, active: true },
      select: { id: true, key: true },
    });
    if (origin) {
      bucket = "origin";
      originId = origin.id;
      originKey = origin.key;

      if (subKeyNorm) {
        const sub = await prisma.tenantSubOrigin.findFirst({
          where: {
            originId: origin.id,
            key: subKeyNorm,
            active: true,
          },
          select: { id: true, key: true },
        });
        if (sub) {
          bucket = "suborigin";
          subOriginId = sub.id;
          subOriginKey = sub.key;
        }
      }
    }
  }

  const visitorKey = resolveVisitorKey(opts?.fingerprint, opts?.visitorIp);

  try {
    await prisma.analyticsUnique.create({
      data: {
        tenantId: tenant.id,
        kind,
        originKey,
        subOriginKey,
        visitorKey,
      },
    });
  } catch {
    // Unique constraint → already counted for this fingerprint + attribution
    return {
      ok: true,
      bucket,
      originKey: originKey || null,
      subOriginKey: subOriginKey || null,
      counted: false,
    };
  }

  const increment =
    kind === "view"
      ? { views: { increment: 1 } }
      : { clicks: { increment: 1 } };

  if (bucket === "suborigin" && subOriginId) {
    await prisma.tenantSubOrigin.update({
      where: { id: subOriginId },
      data: increment,
    });
  } else if (bucket === "origin" && originId) {
    await prisma.tenantOrigin.update({
      where: { id: originId },
      data: increment,
    });
  } else {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data:
        kind === "view"
          ? { directViews: { increment: 1 } }
          : { directClicks: { increment: 1 } },
    });
  }

  return {
    ok: true,
    bucket,
    originKey: originKey || null,
    subOriginKey: subOriginKey || null,
    counted: true,
  };
}
