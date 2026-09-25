import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireSuperAdmin,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";
import { hashPassword, slugify } from "@/lib/password";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireSuperAdmin();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const data: {
    name?: string;
    slug?: string;
    active?: boolean;
    adminPasswordHash?: string;
  } = {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.slug === "string" && body.slug.trim()) {
    data.slug = slugify(body.slug);
  }
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }
  if (typeof body.password === "string" && body.password.length >= 6) {
    data.adminPasswordHash = hashPassword(body.password);
  }

  if (data.slug) {
    const clash = await prisma.tenant.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (clash) {
      return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
    }
  }

  try {
    const tenant = await prisma.tenant.update({ where: { id }, data });
    return NextResponse.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      active: tenant.active,
      publicUrl: `/?c=${tenant.slug}`,
    });
  } catch {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireSuperAdmin();
  if (isNextResponse(session)) return session;

  const { id } = await params;
  try {
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
}
