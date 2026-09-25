import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import {
  normalizeOriginKey,
  slugifyOriginName,
} from "@/lib/analytics-shared";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function tenantIdFromSession(
  session: SessionPayload,
  request: NextRequest,
  body?: Record<string, unknown>,
): Promise<string | null> {
  if (session.role === "tenant") return session.tenantId ?? null;
  const fromQuery = request.nextUrl.searchParams.get("tenantId");
  if (fromQuery) return fromQuery;
  if (typeof body?.tenantId === "string") return body.tenantId;
  return null;
}

export async function GET(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const tenantId = await tenantIdFromSession(session, request);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
  }

  const origins = await prisma.tenantOrigin.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(origins);
}

export async function POST(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const body = await request.json().catch(() => ({}));
  const tenantId = await tenantIdFromSession(session, request, body);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
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

  const existing = await prisma.tenantOrigin.findUnique({
    where: { tenantId_key: { tenantId, key } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Ya existe un origen con clave "${key}"` },
      { status: 409 },
    );
  }

  const origin = await prisma.tenantOrigin.create({
    data: {
      tenantId,
      key,
      name,
      active: body.active !== false,
    },
  });
  return NextResponse.json(origin, { status: 201 });
}
