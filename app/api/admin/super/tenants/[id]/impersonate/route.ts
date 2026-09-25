import { NextResponse } from "next/server";
import { isNextResponse, requireSuperAdmin } from "@/lib/admin-guards";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireSuperAdmin();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  if (!tenant.active) {
    return NextResponse.json(
      { error: "Cliente inactivo" },
      { status: 400 },
    );
  }

  await createSession({
    role: "tenant",
    tenantId: tenant.id,
    slug: tenant.slug,
    impersonating: true,
  });

  return NextResponse.json({
    ok: true,
    redirect: "/admin/settings",
    slug: tenant.slug,
  });
}
