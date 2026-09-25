import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "winsurf_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

export type SessionRole = "superadmin" | "tenant";

export type SessionPayload = {
  role: SessionRole;
  tenantId?: string;
  slug?: string;
  /** Superadmin temporarily acting as a tenant */
  impersonating?: boolean;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret === "dev-secret-change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to a strong value in production",
      );
    }
    return new TextEncoder().encode("dev-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return getSessionFromToken(token);
}

export async function getSessionFromToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = payload.role;
    if (role !== "superadmin" && role !== "tenant") return null;
    return {
      role,
      tenantId:
        typeof payload.tenantId === "string" ? payload.tenantId : undefined,
      slug: typeof payload.slug === "string" ? payload.slug : undefined,
      impersonating: payload.impersonating === true,
    };
  } catch {
    return null;
  }
}

export async function verifySession(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function verifySessionFromToken(
  token: string | undefined,
): Promise<boolean> {
  return (await getSessionFromToken(token)) !== null;
}

export function verifySuperAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword || adminPassword === "admin123") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_PASSWORD must be set to a strong value in production",
      );
    }
    return password === "admin123";
  }
  return password === adminPassword;
}
