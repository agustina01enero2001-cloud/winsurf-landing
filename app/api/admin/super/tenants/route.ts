import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireSuperAdmin,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";
import { hashPassword, slugify } from "@/lib/password";

export async function GET() {
  const session = await requireSuperAdmin();
  if (isNextResponse(session)) return session;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { destinations: true } } },
  });

  return NextResponse.json(
    tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      active: t.active,
      destinationCount: t._count.destinations,
      hasVideo: Boolean(t.heroVideoPath),
      createdAt: t.createdAt,
      publicUrl: `/?c=${t.slug}`,
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = await requireSuperAdmin();
  if (isNextResponse(session)) return session;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const slugRaw =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug
      : name;
  const slug = slugify(slugRaw);

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Nombre y slug requeridos" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password mínimo 6 caracteres" },
      { status: 400 },
    );
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name,
      active: true,
      adminPasswordHash: hashPassword(password),
    },
  });

  return NextResponse.json(
    {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      active: tenant.active,
      publicUrl: `/?c=${tenant.slug}`,
    },
    { status: 201 },
  );
}
