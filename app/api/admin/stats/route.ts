import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

function conversionRate(views: number, clicks: number): number {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
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

  const originViews = origins.reduce((sum, o) => sum + o.views, 0);
  const originClicks = origins.reduce((sum, o) => sum + o.clicks, 0);
  const totalViews = originViews + tenant.directViews;
  const totalClicks = originClicks + tenant.directClicks;

  const rows = [
    ...origins.map((o) => ({
      id: o.id,
      kind: "origin" as const,
      key: o.key,
      name: o.name,
      active: o.active,
      views: o.views,
      clicks: o.clicks,
      conversion: conversionRate(o.views, o.clicks),
      publicUrl: `/?c=${tenant.slug}&o=${o.key}`,
    })),
    {
      id: "direct",
      kind: "direct" as const,
      key: null,
      name: "Sin origen",
      active: true,
      views: tenant.directViews,
      clicks: tenant.directClicks,
      conversion: conversionRate(tenant.directViews, tenant.directClicks),
      publicUrl: `/?c=${tenant.slug}`,
    },
  ];

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
