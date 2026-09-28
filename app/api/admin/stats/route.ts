import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ART_TIME_ZONE = "America/Argentina/Buenos_Aires";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

type CalendarDate = { y: number; m: number; d: number };

function conversionRate(views: number, clicks: number): number {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
}

function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

/** Milliseconds to add to a UTC instant to get the wall clock in `timeZone`. */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  const wallAsUtc = Date.UTC(
    Number(pick("year")),
    Number(pick("month")) - 1,
    Number(pick("day")),
    hour,
    Number(pick("minute")),
    Number(pick("second")),
  );
  return wallAsUtc - instant.getTime();
}

/** UTC instant of 00:00:00 on that calendar day in Argentina. */
function artMidnightUtc(date: CalendarDate): Date {
  let utc = Date.UTC(date.y, date.m - 1, date.d, 3, 0, 0);
  for (let i = 0; i < 3; i++) {
    const offset = timeZoneOffsetMs(new Date(utc), ART_TIME_ZONE);
    const next = Date.UTC(date.y, date.m - 1, date.d, 0, 0, 0) - offset;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

async function tenantIdFromSession(
  session: SessionPayload,
  request: NextRequest,
): Promise<string | null> {
  if (session.role === "tenant") return session.tenantId ?? null;
  return request.nextUrl.searchParams.get("tenantId");
}

export async function GET(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const tenantId = await tenantIdFromSession(session, request);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
  }

  const fromRaw = request.nextUrl.searchParams.get("from")?.trim() ?? "";
  const toRaw = request.nextUrl.searchParams.get("to")?.trim() ?? "";
  const hasFrom = fromRaw.length > 0;
  const hasTo = toRaw.length > 0;
  if (hasFrom !== hasTo) {
    return NextResponse.json(
      { error: "Indicá desde y hasta. El rango necesita las dos fechas." },
      { status: 400 },
    );
  }

  let rangeCounts: Map<string, { views: number; clicks: number }> | null = null;
  if (hasFrom && hasTo) {
    const fromDate = parseIsoDate(fromRaw);
    const toDate = parseIsoDate(toRaw);
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "Fecha inválida. Usá el formato YYYY-MM-DD." },
        { status: 400 },
      );
    }
    if (compareCalendarDates(fromDate, toDate) > 0) {
      return NextResponse.json(
        { error: "La fecha desde no puede ser posterior a hasta." },
        { status: 400 },
      );
    }

    const fromUtc = artMidnightUtc(fromDate);
    const toExclusiveUtc = artMidnightUtc(addCalendarDays(toDate, 1));
    const grouped = await prisma.analyticsUnique.groupBy({
      by: ["originKey", "kind"],
      where: {
        tenantId,
        createdAt: { gte: fromUtc, lt: toExclusiveUtc },
      },
      _count: { _all: true },
    });

    rangeCounts = new Map();
    for (const row of grouped) {
      const current = rangeCounts.get(row.originKey) ?? { views: 0, clicks: 0 };
      const count = row._count._all;
      if (row.kind === "click") current.clicks += count;
      else if (row.kind === "view") current.views += count;
      rangeCounts.set(row.originKey, current);
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      directViews: true,
      directClicks: true,
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const origins = await prisma.tenantOrigin.findMany({
    where: { tenantId },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
  });

  const directCounts = rangeCounts
    ? (rangeCounts.get("") ?? { views: 0, clicks: 0 })
    : { views: tenant.directViews, clicks: tenant.directClicks };

  const rows = [
    ...origins.map((o) => {
      const counts = rangeCounts?.get(o.key) ?? {
        views: rangeCounts ? 0 : o.views,
        clicks: rangeCounts ? 0 : o.clicks,
      };
      return {
        id: o.id,
        kind: "origin" as const,
        key: o.key,
        name: o.name,
        active: o.active,
        views: counts.views,
        clicks: counts.clicks,
        conversion: conversionRate(counts.views, counts.clicks),
        publicUrl: `/?c=${tenant.slug}&o=${o.key}`,
      };
    }),
    {
      id: "direct",
      kind: "direct" as const,
      key: null,
      name: "Sin origen",
      active: true,
      views: directCounts.views,
      clicks: directCounts.clicks,
      conversion: conversionRate(directCounts.views, directCounts.clicks),
      publicUrl: `/?c=${tenant.slug}`,
    },
  ];

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    totals: {
      views: totalViews,
      clicks: totalClicks,
      conversion: conversionRate(totalViews, totalClicks),
    },
    rows,
  });
}
