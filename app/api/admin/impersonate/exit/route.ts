import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.impersonating) {
    return NextResponse.json(
      { error: "No estás operando como cliente" },
      { status: 400 },
    );
  }

  await createSession({ role: "superadmin" });
  return NextResponse.json({ ok: true, redirect: "/admin/super" });
}
