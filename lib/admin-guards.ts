import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return session;
}

export async function requireSuperAdmin(): Promise<
  SessionPayload | NextResponse
> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export async function requireTenantAccess(
  tenantId?: string,
): Promise<SessionPayload | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (session.role === "superadmin") return session;
  if (session.role === "tenant" && session.tenantId) {
    if (tenantId && session.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return session;
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function isNextResponse(
  value: SessionPayload | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
