import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant?.heroVideoPath) {
    return NextResponse.redirect(new URL("/hero.mp4", _request.url));
  }

  const filePath = path.isAbsolute(tenant.heroVideoPath)
    ? tenant.heroVideoPath
    : path.join(process.cwd(), tenant.heroVideoPath);

  if (!existsSync(filePath)) {
    return NextResponse.redirect(new URL("/hero.mp4", _request.url));
  }

  const { size, mtimeMs } = statSync(filePath);
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=3600",
      ETag: `"${Math.floor(mtimeMs)}"`,
    },
  });
}
