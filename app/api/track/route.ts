import { NextRequest, NextResponse } from "next/server";
import {
  ORIGIN_PARAM,
  getClientIp,
  trackEvent,
  type TrackKind,
} from "@/lib/analytics";
import { VISITOR_PARAM } from "@/lib/visitor";

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
  const visitorId =
    typeof body[VISITOR_PARAM] === "string"
      ? body[VISITOR_PARAM]
      : typeof body.visitorId === "string"
        ? body.visitorId
        : null;

  if (!slug) {
    return NextResponse.json({ error: "Falta c" }, { status: 400 });
  }

  if (type !== "view") {
    return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
  }

  const result = await trackEvent(slug, originRaw, "view", {
    visitorId,
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
