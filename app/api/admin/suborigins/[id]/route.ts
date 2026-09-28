import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedSubOrigin(
  session: { role: string; tenantId?: string | null },
  id: string,
) {
  const existing = await prisma.tenantSubOrigin.findUnique({
    where: { id },
    include: { origin: { select: { tenantId: true, key: true } } },
  });
  if (!existing) return { error: NextResponse.json({ error: "No encontrado" }, { status: 404 }) };
  if (
    session.role === "tenant" &&
    session.tenantId !== existing.origin.tenantId
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { existing };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const loaded = await loadOwnedSubOrigin(session, id);
  if ("error" in loaded && loaded.error) return loaded.error;

  const body = await request.json().catch(() => ({}));
  const data: { name?: string; active?: boolean } = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const sub = await prisma.tenantSubOrigin.update({
    where: { id },
    data,
  });
  return NextResponse.json(sub);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const loaded = await loadOwnedSubOrigin(session, id);
  if ("error" in loaded && loaded.error) return loaded.error;

  await prisma.tenantSubOrigin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
