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
  const existing = await prisma.tenantDestination.findUnique({ where: { id } });
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
  const data: {
    type?: string;
    number?: string | null;
    url?: string | null;
    label?: string | null;
    active?: boolean;
    sortOrder?: number;
  } = {};

  if (body.type === "whatsapp" || body.type === "url") {
    data.type = body.type;
  }
  const nextType = data.type ?? existing.type;

  if (typeof body.number === "string") {
    const number = body.number.replace(/\D/g, "");
    if (nextType === "whatsapp" && number.length < 8) {
      return NextResponse.json({ error: "Número inválido" }, { status: 400 });
    }
    data.number = number || null;
  }
  if (typeof body.url === "string") {
    const url = body.url.trim();
    if (nextType === "url" && url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }
    data.url = url || null;
  }
  if (body.label !== undefined) {
    data.label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim()
        : null;
  }
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }

  const destination = await prisma.tenantDestination.update({
    where: { id },
    data,
  });
  return NextResponse.json(destination);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const existing = await prisma.tenantDestination.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (
    session.role === "tenant" &&
    session.tenantId !== existing.tenantId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tenantDestination.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
