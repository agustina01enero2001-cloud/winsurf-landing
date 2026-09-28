"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al iniciar sesión");
      return;
    }

    router.push(data.redirect ?? "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 [color-scheme:dark]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-8 text-slate-100 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-bold text-slate-50">Admin Landing</h1>
        <p className="mb-6 text-sm text-slate-400">
          Ingresá usuario y contraseña.
        </p>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-300">
            Usuario
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin o slug del cliente"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-400"
            autoComplete="username"
            required
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-300">
            Contraseña
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-400"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
