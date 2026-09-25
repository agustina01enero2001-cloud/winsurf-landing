import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/analytics";
import { generateCtaLink } from "@/lib/wa-link";

export async function GET(request: NextRequest) {
  try {
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const slug = (params.c ?? "").trim().toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { error: "Falta el parámetro c (cliente)" },
        { status: 400 },
      );
    }

    const cookieName = `wa-idx-${slug}`;
    const cookieIndex = request.cookies.get(cookieName)?.value;
    const currentIndex = cookieIndex ? parseInt(cookieIndex, 10) : undefined;

    const { url, nextIndex } = await generateCtaLink(
      slug,
      params,
      currentIndex,
      getClientIp(request),
    );

    const response = NextResponse.json({ url });
    response.cookies.set(cookieName, String(nextIndex), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al generar enlace";
    const status = message.includes("no encontrada") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
