import { NextRequest, NextResponse } from "next/server";
import {
  ORIGIN_PARAM,
  SUBORIGIN_PARAM,
  getClientIp,
  trackEvent,
  type TrackKind,
} from "@/lib/analytics";
import { FINGERPRINT_PARAM } from "@/lib/visitor";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const slug =
    typeof body.c === "string"
      ? body.c.trim().toLowerCase()
      : typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";
  const type: TrackKind = body.type === "click" ? "click" : "view";
  const originRaw =
    typeof body.o === "string"
      ? body.o
      : typeof body[ORIGIN_PARAM] === "string"
        ? body[ORIGIN_PARAM]
        : null;
  const subOriginRaw =
    typeof body.so === "string"
      ? body.so
      : typeof body[SUBORIGIN_PARAM] === "string"
        ? body[SUBORIGIN_PARAM]
        : null;
  const fingerprint =
    typeof body[FINGERPRINT_PARAM] === "string"
      ? body[FINGERPRINT_PARAM]
      : typeof body.fp === "string"
        ? body.fp
        : typeof body.vid === "string"
          ? body.vid
          : null;

  if (!slug) {
    return NextResponse.json({ error: "Falta c" }, { status: 400 });
  }

  if (type !== "view") {
    return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
  }

  const result = await trackEvent(slug, originRaw, "view", {
    subOriginKey: subOriginRaw,
    fingerprint,
    visitorIp: getClientIp(request),
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Landing no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    bucket: result.bucket,
    counted: result.counted,
  });
}
