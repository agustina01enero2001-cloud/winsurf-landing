import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  destroySession,
  verifySuperAdminPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

function isSuperAdminUser(username: string): boolean {
  const configured = (
    process.env.SUPERADMIN_USER ?? "admin"
  ).trim().toLowerCase();
  return username === configured || username === "superadmin";
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá más tarde." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const username = (
    typeof body.username === "string"
      ? body.username
      : typeof body.slug === "string"
        ? body.slug
        : ""
  )
    .trim()
    .toLowerCase();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña requeridos" },
      { status: 400 },
    );
  }

  if (isSuperAdminUser(username)) {
    if (!verifySuperAdminPassword(password)) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }
    await createSession({ role: "superadmin" });
    return NextResponse.json({
      ok: true,
      role: "superadmin",
      redirect: "/admin/super",
    });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: username } });
  if (
    !tenant ||
    !tenant.active ||
    !verifyPasswordHash(password, tenant.adminPasswordHash)
  ) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 },
    );
  }

  await createSession({
    role: "tenant",
    tenantId: tenant.id,
    slug: tenant.slug,
  });
  return NextResponse.json({
    ok: true,
    role: "tenant",
    redirect: "/admin",
  });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
