import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  isNextResponse,
  requireTenantAccess,
} from "@/lib/admin-guards";
import { prisma } from "@/lib/db";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  const session = await requireTenantAccess();
  if (isNextResponse(session)) return session;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      {
        error:
          "No se pudo leer el archivo (tamaño o formato). Probá un MP4 de hasta 100MB.",
      },
      { status: 413 },
    );
  }
  const file = form.get("video");
  let tenantId =
    session.role === "tenant"
      ? session.tenantId
      : typeof form.get("tenantId") === "string"
        ? String(form.get("tenantId"))
        : null;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Video demasiado grande (máx 100MB)" },
      { status: 400 },
    );
  }

  const type = file.type || "";
  if (!type.includes("mp4") && !file.name.toLowerCase().endsWith(".mp4")) {
    return NextResponse.json(
      { error: "Solo se acepta video MP4" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const dir = path.join(process.cwd(), "uploads", "tenants", tenant.slug);
  await mkdir(dir, { recursive: true });
  const relativePath = path.join("uploads", "tenants", tenant.slug, "hero.mp4");
  const absolutePath = path.join(process.cwd(), relativePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { heroVideoPath: relativePath },
  });

  return NextResponse.json({
    ok: true,
    videoUrl: `/api/media/${tenant.slug}/hero?v=${Date.now()}`,
  });
}
