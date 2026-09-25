import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";

async function resolveTenantId(
  session: Awaited<ReturnType<typeof requireTenantAccess>>,
  request: NextRequest,
): Promise<string | NextResponse> {
  if (isNextResponse(session)) return session;
  if (session.role === "tenant" && session.tenantId) return session.tenantId;
  const q = request.nextUrl.searchParams.get("tenantId");
  if (session.role === "superadmin" && q) return q;
  if (session.role === "superadmin") {
    const bodyTenant = request.headers.get("x-tenant-id");
    if (bodyTenant) return bodyTenant;
  }
  return NextResponse.json(
    { error: "tenantId requerido" },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  let tenantId: string;
  if (session.role === "tenant" && session.tenantId) {
    tenantId = session.tenantId;
  } else {
    const q = request.nextUrl.searchParams.get("tenantId");
    if (!q) {
      return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
    }
    tenantId = q;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    template: tenant.template === "bienvenida" ? "bienvenida" : "winsurf",
    active: tenant.active,
    hasVideo: Boolean(tenant.heroVideoPath),
    publicUrl: `/?c=${tenant.slug}`,
    videoUrl: tenant.heroVideoPath
      ? `/api/media/${tenant.slug}/hero`
      : "/hero.mp4",
  });
}

export async function PATCH(request: NextRequest) {
  const session = await requireTenantAccess();
  const tenantIdOrRes = await resolveTenantId(session, request);
  if (tenantIdOrRes instanceof NextResponse) return tenantIdOrRes;

  const body = await request.json().catch(() => ({}));
  const data: { name?: string; template?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (body.template === "winsurf" || body.template === "bienvenida") {
    data.template = body.template;
  }

  // Allow body.tenantId for superadmin when using PATCH body
  let tenantId = tenantIdOrRes;
  if (
    !isNextResponse(session) &&
    session.role === "superadmin" &&
    typeof body.tenantId === "string"
  ) {
    tenantId = body.tenantId;
  }

  if (!data.name && !data.template) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });

  return NextResponse.json({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    template: tenant.template === "bienvenida" ? "bienvenida" : "winsurf",
    publicUrl: `/?c=${tenant.slug}`,
  });
}
