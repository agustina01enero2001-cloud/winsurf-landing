import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import {
  addCalendarDays,
  artDateKey,
  artMidnightUtc,
  compareCalendarDates,
  eachCalendarDay,
  formatIsoDate,
  parseIsoDate,
  todayArt,
  type CalendarDate,
} from "@/lib/analytics-dates";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

function conversionRate(views: number, clicks: number): number {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
}

function rangeBucketKey(originKey: string, subOriginKey: string): string {
  return `${originKey}\0${subOriginKey}`;
}

async function tenantIdFromSession(
  session: SessionPayload,
  request: NextRequest,
): Promise<string | null> {
  if (session.role === "tenant") return session.tenantId ?? null;
  return request.nextUrl.searchParams.get("tenantId");
}

type SeriesPoint = { date: string; views: number; clicks: number };

async function buildDailySeries(
  tenantId: string,
  fromDate: CalendarDate,
  toDate: CalendarDate,
  filter: { originKey: string | null; subOriginKey: string | null; directOnly: boolean },
): Promise<SeriesPoint[]> {
  const fromUtc = artMidnightUtc(fromDate);
  const toExclusiveUtc = artMidnightUtc(addCalendarDays(toDate, 1));

  const where: {
    tenantId: string;
    createdAt: { gte: Date; lt: Date };
    originKey?: string;
    subOriginKey?: string;
  } = {
    tenantId,
    createdAt: { gte: fromUtc, lt: toExclusiveUtc },
  };

  if (filter.directOnly) {
    where.originKey = "";
    where.subOriginKey = "";
  } else if (filter.originKey !== null) {
    where.originKey = filter.originKey;
    if (filter.subOriginKey !== null) {
      where.subOriginKey = filter.subOriginKey;
    }
  }

  const events = await prisma.analyticsUnique.findMany({
    where,
    select: { kind: true, createdAt: true },
  });

  const buckets = new Map<string, { views: number; clicks: number }>();
  for (const day of eachCalendarDay(fromDate, toDate)) {
    buckets.set(formatIsoDate(day), { views: 0, clicks: 0 });
  }

  for (const event of events) {
    const key = artDateKey(event.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (event.kind === "view") bucket.views += 1;
    else if (event.kind === "click") bucket.clicks += 1;
  }

  return [...buckets.entries()].map(([date, counts]) => ({
    date,
    views: counts.views,
    clicks: counts.clicks,
  }));
}

export async function GET(request: NextRequest) {
  try {
    return await getStats(request);
  } catch (error) {
    console.error("[admin/stats]", error);
    const message =
      error instanceof Error ? error.message : "Error al cargar estadísticas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getStats(request: NextRequest) {
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

  const seriesOriginRaw = request.nextUrl.searchParams.get("seriesOrigin")?.trim() ?? "";
  const seriesSubRaw = request.nextUrl.searchParams.get("seriesSub")?.trim() ?? "";
  const seriesFilter = {
    originKey: null as string | null,
    subOriginKey: null as string | null,
    directOnly: false,
  };
  if (seriesOriginRaw === "_direct") {
    seriesFilter.directOnly = true;
  } else if (seriesOriginRaw) {
    seriesFilter.originKey = seriesOriginRaw;
    if (seriesSubRaw) seriesFilter.subOriginKey = seriesSubRaw;
  }

  let rangeCounts: Map<string, { views: number; clicks: number }> | null = null;
  let seriesFrom: CalendarDate;
  let seriesTo: CalendarDate;

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

    seriesFrom = fromDate;
    seriesTo = toDate;

    const fromUtc = artMidnightUtc(fromDate);
    const toExclusiveUtc = artMidnightUtc(addCalendarDays(toDate, 1));
    const grouped = await prisma.analyticsUnique.groupBy({
      by: ["originKey", "subOriginKey", "kind"],
      where: {
        tenantId,
        createdAt: { gte: fromUtc, lt: toExclusiveUtc },
      },
      _count: { _all: true },
    });

    rangeCounts = new Map();
    for (const row of grouped) {
      const key = rangeBucketKey(row.originKey, row.subOriginKey);
      const current = rangeCounts.get(key) ?? { views: 0, clicks: 0 };
      const count = row._count._all;
      if (row.kind === "click") current.clicks += count;
      else if (row.kind === "view") current.views += count;
      rangeCounts.set(key, current);
    }
  } else {
    seriesTo = todayArt();
    seriesFrom = addCalendarDays(seriesTo, -29);
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
    include: {
      subOrigins: { orderBy: [{ views: "desc" }, { createdAt: "desc" }] },
    },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
  });

  const directCounts = rangeCounts
    ? (rangeCounts.get(rangeBucketKey("", "")) ?? { views: 0, clicks: 0 })
    : { views: tenant.directViews, clicks: tenant.directClicks };

  type StatsRow = {
    id: string;
    kind: "origin" | "suborigin" | "direct";
    parentId: string | null;
    key: string | null;
    subKey: string | null;
    name: string;
    active: boolean;
    views: number;
    clicks: number;
    conversion: number;
    publicUrl: string;
  };

  const rows: StatsRow[] = [];

  for (const o of origins) {
    const originOnly = rangeCounts
      ? (rangeCounts.get(rangeBucketKey(o.key, "")) ?? { views: 0, clicks: 0 })
      : { views: o.views, clicks: o.clicks };

    let originViews = originOnly.views;
    let originClicks = originOnly.clicks;

    const subRows: StatsRow[] = o.subOrigins.map((s) => {
      const counts = rangeCounts
        ? (rangeCounts.get(rangeBucketKey(o.key, s.key)) ?? {
            views: 0,
            clicks: 0,
          })
        : { views: s.views, clicks: s.clicks };
      if (rangeCounts) {
        originViews += counts.views;
        originClicks += counts.clicks;
      }
      return {
        id: s.id,
        kind: "suborigin" as const,
        parentId: o.id,
        key: o.key,
        subKey: s.key,
        name: s.name,
        active: s.active && o.active,
        views: counts.views,
        clicks: counts.clicks,
        conversion: conversionRate(counts.views, counts.clicks),
        publicUrl: `/?c=${tenant.slug}&o=${o.key}&so=${s.key}`,
      };
    });

    if (!rangeCounts) {
      originViews =
        o.views + o.subOrigins.reduce((sum, s) => sum + s.views, 0);
      originClicks =
        o.clicks + o.subOrigins.reduce((sum, s) => sum + s.clicks, 0);
    }

    rows.push({
      id: o.id,
      kind: "origin",
      parentId: null,
      key: o.key,
      subKey: null,
      name: o.name,
      active: o.active,
      views: originViews,
      clicks: originClicks,
      conversion: conversionRate(originViews, originClicks),
      publicUrl: `/?c=${tenant.slug}&o=${o.key}`,
    });
    rows.push(...subRows);
  }

  rows.push({
    id: "direct",
    kind: "direct",
    parentId: null,
    key: null,
    subKey: null,
    name: "Sin origen",
    active: true,
    views: directCounts.views,
    clicks: directCounts.clicks,
    conversion: conversionRate(directCounts.views, directCounts.clicks),
    publicUrl: `/?c=${tenant.slug}`,
  });

  let leafViews = directCounts.views;
  let leafClicks = directCounts.clicks;
  for (const o of origins) {
    const originOnly = rangeCounts
      ? (rangeCounts.get(rangeBucketKey(o.key, "")) ?? { views: 0, clicks: 0 })
      : { views: o.views, clicks: o.clicks };
    leafViews += originOnly.views;
    leafClicks += originOnly.clicks;
    for (const s of o.subOrigins) {
      const counts = rangeCounts
        ? (rangeCounts.get(rangeBucketKey(o.key, s.key)) ?? {
            views: 0,
            clicks: 0,
          })
        : { views: s.views, clicks: s.clicks };
      leafViews += counts.views;
      leafClicks += counts.clicks;
    }
  }

  const series = await buildDailySeries(
    tenantId,
    seriesFrom,
    seriesTo,
    seriesFilter,
  );

  return NextResponse.json({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    totals: {
      views: leafViews,
      clicks: leafClicks,
      conversion: conversionRate(leafViews, leafClicks),
    },
    series,
    seriesRange: {
      from: formatIsoDate(seriesFrom),
      to: formatIsoDate(seriesTo),
    },
    rows,
  });
}
