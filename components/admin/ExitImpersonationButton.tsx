"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExitImpersonationButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleExit() {
    setLoading(true);
    const res = await fetch("/api/admin/impersonate/exit", { method: "POST" });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    router.push(typeof data.redirect === "string" ? data.redirect : "/admin/super");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleExit}
      disabled={loading}
      className="rounded-lg border border-amber-600/60 bg-amber-950/60 px-3 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-900/70 disabled:opacity-60"
    >
      {loading ? "Volviendo..." : "Volver a superadmin"}
    </button>
  );
}
