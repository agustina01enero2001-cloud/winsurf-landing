import { NextRequest, NextResponse } from "next/server";
import { generateWaLink } from "@/lib/wa-link";

const COOKIE_NAME = "wa-idx";

export async function GET(request: NextRequest) {
  try {
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const cookieIndex = request.cookies.get(COOKIE_NAME)?.value;
    const currentIndex = cookieIndex ? parseInt(cookieIndex, 10) : undefined;

    const { url, nextIndex } = generateWaLink(params, currentIndex);

    const response = NextResponse.json({ url });
    response.cookies.set(COOKIE_NAME, String(nextIndex), {
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
