import { WA_MESSAGES_BODY, WA_PHONES } from "@/lib/site-config";
import { sanitizeTwclid } from "@/lib/twclid";

const DEFAULT_VARS: Record<string, string> = {
  marca: "Winsurf",
};

export function parseMessageLines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function pickRandomMessage(body: string): string {
  const lines = parseMessageLines(body);
  if (lines.length === 0) {
    return "Hola, quiero sumarme a {{marca}} con mi codigo: {{twclid}}";
  }
  return lines[Math.floor(Math.random() * lines.length)];
}

export function renderTemplate(
  body: string,
  params: Record<string, string>,
): string {
  const twclid = sanitizeTwclid(params.twclid) ?? "";
  const vars: Record<string, string> = {
    ...DEFAULT_VARS,
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

export function generateWaLink(
  params: Record<string, string>,
  currentIndex?: number,
): { url: string; nextIndex: number } {
  const phones = WA_PHONES.filter((phone) => phone.number.trim());

  if (phones.length === 0) {
    throw new Error("No hay números de WhatsApp configurados");
  }

  const idx =
    currentIndex !== undefined
      ? currentIndex % phones.length
      : Math.floor(Math.random() * phones.length);

  const phone = phones[idx];
  const message = renderTemplate(
    pickRandomMessage(WA_MESSAGES_BODY),
    params,
  );
  const url = buildWaUrl(phone.number, message);
  const nextIndex = (idx + 1) % phones.length;

  return { url, nextIndex };
}
