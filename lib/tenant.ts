import { existsSync, statSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export type LandingTemplate = "winsurf" | "bienvenida";

export type PublicTenant = {
  id: string;
  slug: string;
  name: string;
  template: LandingTemplate;
  videoSrc: string;
};

export function normalizeTemplate(
  raw: string | null | undefined,
): LandingTemplate {
  return raw === "bienvenida" ? "bienvenida" : "winsurf";
}

export async function getTenantBySlug(
  slug: string | undefined | null,
): Promise<PublicTenant | null> {
  const clean = slug?.trim().toLowerCase();
  if (!clean) return null;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: clean, active: true },
  });
  if (!tenant) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    template: normalizeTemplate(tenant.template),
    videoSrc: getTenantVideoSrc(tenant.slug, tenant.heroVideoPath),
  };
}

export function getTenantVideoSrc(
  slug: string,
  heroVideoPath: string | null | undefined,
): string {
  if (heroVideoPath) {
    const filePath = path.isAbsolute(heroVideoPath)
      ? heroVideoPath
      : path.join(process.cwd(), heroVideoPath);
    if (existsSync(filePath)) {
      const { mtimeMs } = statSync(filePath);
      return `/api/media/${slug}/hero?v=${Math.floor(mtimeMs)}`;
    }
  }

  const fallback = path.join(process.cwd(), "public", "hero.mp4");
  if (existsSync(fallback)) {
    const { mtimeMs } = statSync(fallback);
    return `/hero.mp4?v=${Math.floor(mtimeMs)}`;
  }
  return "/hero.mp4";
}
