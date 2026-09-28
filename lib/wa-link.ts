import { prisma } from "@/lib/db";
import { WA_MESSAGES_BODY } from "@/lib/site-config";
import { sanitizeTwclid } from "@/lib/twclid";
import {
  ORIGIN_PARAM,
  SUBORIGIN_PARAM,
  trackEvent,
} from "@/lib/analytics";
import { FINGERPRINT_PARAM } from "@/lib/visitor";

export function parseMessageLines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function pickRandomMessage(body: string): string {
  const lines = parseMessageLines(body);
  if (lines.length === 0) {
    return "Hola, quiero sumarme a {{marca}}. Ref: {{twclid}}";
  }
  return lines[Math.floor(Math.random() * lines.length)];
}

export function renderTemplate(
  body: string,
  params: Record<string, string>,
): string {
  const twclid = sanitizeTwclid(params.twclid) ?? "";
  const vars: Record<string, string> = {
    marca: "Winsurf",
    ...params,
    twclid,
    fecha: new Date().toLocaleString("es-AR"),
  };

  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildWaUrl(number: string, message: string): string {
  const cleanNumber = number.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export async function generateCtaLink(
  slug: string,
  params: Record<string, string>,
  currentIndex?: number,
  visitorIp?: string | null,
): Promise<{ url: string; nextIndex: number }> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
  });
  if (!tenant) {
    throw new Error("Landing no encontrada");
  }

  const destinations = await prisma.tenantDestination.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (destinations.length === 0) {
    throw new Error("No hay destinos activos");
  }

  const idx =
    currentIndex !== undefined
      ? currentIndex % destinations.length
      : Math.floor(Math.random() * destinations.length);

  const destination = destinations[idx];
  const nextIndex = (idx + 1) % destinations.length;

  const originRaw = params[ORIGIN_PARAM] ?? params.o;
  const subOriginRaw = params[SUBORIGIN_PARAM] ?? params.so;
  const fingerprint =
    params[FINGERPRINT_PARAM] ?? params.fp ?? params.vid ?? null;

  await trackEvent(slug, originRaw, "click", {
    subOriginKey: subOriginRaw,
    fingerprint,
    visitorIp,
  });

  if (destination.type === "url" && destination.url) {
    const origin = (originRaw ?? "").trim();
    const subOrigin = (subOriginRaw ?? "").trim();
    if (!origin && !subOrigin) {
      return { url: destination.url, nextIndex };
    }
    try {
      const target = new URL(destination.url);
      if (origin) target.searchParams.set(ORIGIN_PARAM, origin);
      if (origin && subOrigin) {
        target.searchParams.set(SUBORIGIN_PARAM, subOrigin);
      }
      return { url: target.toString(), nextIndex };
    } catch {
      return { url: destination.url, nextIndex };
    }
  }

  if (!destination.number) {
    throw new Error("Destino WhatsApp sin número");
  }

  const message = renderTemplate(pickRandomMessage(WA_MESSAGES_BODY), {
    ...params,
    marca: tenant.name,
    o: (originRaw ?? "").trim(),
    so: (subOriginRaw ?? "").trim(),
  })
    .replace(/\s*so=\s*(?=\s|$)/g, "")
    .replace(/\s*o=\s*(?=\s|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const url = buildWaUrl(destination.number, message);
  return { url, nextIndex };
}

/** @deprecated use generateCtaLink */
export const generateWaLink = generateCtaLink;
