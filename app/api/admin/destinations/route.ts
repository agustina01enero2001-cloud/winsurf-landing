import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

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

  const destinations = await prisma.tenantDestination.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(destinations);
}

export async function POST(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const body = await request.json().catch(() => ({}));
  const tenantId = await tenantIdFromSession(session, request, body);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
  }

  const type = body.type === "url" ? "url" : "whatsapp";
  const label =
    typeof body.label === "string" && body.label.trim()
      ? body.label.trim()
      : null;
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.floor(body.sortOrder)
      : 0;
  const active = body.active !== false;

  let number: string | null = null;
  let url: string | null = null;

  if (type === "whatsapp") {
    number =
      typeof body.number === "string" ? body.number.replace(/\D/g, "") : "";
    if (!number || number.length < 8) {
      return NextResponse.json(
        { error: "Número inválido (mínimo 8 dígitos)" },
        { status: 400 },
      );
    }
  } else {
    url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "URL inválida (debe empezar con http/https)" },
        { status: 400 },
      );
    }
  }

  const destination = await prisma.tenantDestination.create({
    data: { tenantId, type, number, url, label, active, sortOrder },
  });
  return NextResponse.json(destination, { status: 201 });
}
