"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100"
    >
      Salir
    </button>
  );
}
