import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizeOriginKey,
  type TrackKind,
} from "@/lib/analytics-shared";

export {
  ORIGIN_PARAM,
  normalizeOriginKey,
  slugifyOriginName,
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
  visitorId?: string | null,
  visitorIp?: string | null,
): string {
  const id = typeof visitorId === "string" ? visitorId.trim() : "";
  if (id.length >= 8) return hashVisitorKey(`vid:${id}`);
  const ip = (visitorIp ?? "").trim() || "unknown";
  return hashVisitorKey(`ip:${ip}`);
}

/**
 * Increment view/click once per browser visitorId (+ origin).
 * Falls back to IP only when no visitorId is sent.
 */
export async function trackEvent(
  slug: string,
  originKeyRaw: string | null | undefined,
  kind: TrackKind,
  opts?: { visitorId?: string | null; visitorIp?: string | null },
): Promise<
  | {
      ok: true;
      bucket: "origin" | "direct";
      key: string | null;
      counted: boolean;
    }
  | { ok: false }
> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: slug.trim().toLowerCase(), active: true },
    select: { id: true },
  });
  if (!tenant) return { ok: false };

  const key = normalizeOriginKey(originKeyRaw);
  let bucket: "origin" | "direct" = "direct";
  let originId: string | null = null;
  let originKey = "";

  if (key) {
    const origin = await prisma.tenantOrigin.findFirst({
      where: { tenantId: tenant.id, key, active: true },
      select: { id: true, key: true },
    });
    if (origin) {
      bucket = "origin";
      originId = origin.id;
      originKey = origin.key;
    }
  }

  const visitorKey = resolveVisitorKey(opts?.visitorId, opts?.visitorIp);

  try {
    await prisma.analyticsUnique.create({
      data: {
        tenantId: tenant.id,
        kind,
        originKey,
        visitorKey,
      },
    });
  } catch {
    // Unique constraint → already counted for this visitor
    return { ok: true, bucket, key: originKey || null, counted: false };
  }

  if (bucket === "origin" && originId) {
    await prisma.tenantOrigin.update({
      where: { id: originId },
      data:
        kind === "view"
          ? { views: { increment: 1 } }
          : { clicks: { increment: 1 } },
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

  return { ok: true, bucket, key: originKey || null, counted: true };
}
