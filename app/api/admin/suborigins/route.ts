import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import {
  normalizeOriginKey,
  slugifyOriginName,
} from "@/lib/analytics-shared";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const body = await request.json().catch(() => ({}));
  const originId = typeof body.originId === "string" ? body.originId.trim() : "";
  if (!originId) {
    return NextResponse.json({ error: "originId requerido" }, { status: 400 });
  }

  const origin = await prisma.tenantOrigin.findUnique({ where: { id: originId } });
  if (!origin) {
    return NextResponse.json({ error: "Origen no encontrado" }, { status: 404 });
  }
  if (session.role === "tenant" && session.tenantId !== origin.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Nombre requerido (mínimo 2 caracteres)" },
      { status: 400 },
    );
  }

  const key =
    normalizeOriginKey(
      typeof body.key === "string" && body.key.trim()
        ? body.key
        : slugifyOriginName(name),
    ) ?? slugifyOriginName(name);

  const existing = await prisma.tenantSubOrigin.findUnique({
    where: { originId_key: { originId, key } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Ya existe un suborigen con clave "${key}"` },
      { status: 409 },
    );
  }

  const sub = await prisma.tenantSubOrigin.create({
    data: {
      originId,
      key,
      name,
      active: body.active !== false,
    },
  });

  return NextResponse.json(
    {
      ...sub,
      originKey: origin.key,
      publicUrl: `/?o=${origin.key}&so=${sub.key}`,
    },
    { status: 201 },
  );
}
