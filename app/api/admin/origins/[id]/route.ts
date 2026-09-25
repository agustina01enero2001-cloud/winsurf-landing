import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const existing = await prisma.tenantOrigin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (
    session.role === "tenant" &&
    session.tenantId !== existing.tenantId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const data: { name?: string; active?: boolean } = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const origin = await prisma.tenantOrigin.update({
    where: { id },
    data,
  });
  return NextResponse.json(origin);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const existing = await prisma.tenantOrigin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (
    session.role === "tenant" &&
    session.tenantId !== existing.tenantId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tenantOrigin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
