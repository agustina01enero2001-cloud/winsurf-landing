"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StatsRow = {
  id: string;
  kind: "origin" | "direct";
  key: string | null;
  name: string;
  active: boolean;
  views: number;
  clicks: number;
  conversion: number;
  publicUrl: string;
};

type StatsPayload = {
  tenant: { id: string; slug: string; name: string };
  totals: { views: number; clicks: number; conversion: number };
  rows: StatsRow[];
};

function slugPreview(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export default function OriginsPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const previewKey = useMemo(
    () => (key.trim() ? slugPreview(key) : slugPreview(name)),
    [key, name],
  );

  async function load() {
    const res = await fetch("/api/admin/stats");
    if (!res.ok) {
      setError("No se pudieron cargar las estadísticas");
      setLoading(false);
      return;
    }
    setStats(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/origins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        key: key.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al crear origen");
      return;
    }
    setName("");
    setKey("");
    setMessage("Origen creado");
    await load();
  }

  async function toggleActive(row: StatsRow) {
    if (row.kind !== "origin") return;
    await fetch(`/api/admin/origins/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    await load();
  }

  async function removeOrigin(row: StatsRow) {
    if (row.kind !== "origin") return;
    if (!confirm(`¿Eliminar origen "${row.name}"? Se pierden sus contadores.`)) {
      return;
    }
    await fetch(`/api/admin/origins/${row.id}`, { method: "DELETE" });
    await load();
  }

  function copyUrl(row: StatsRow) {
    const url = `${window.location.origin}${row.publicUrl}`;
    void navigator.clipboard.writeText(url);
    setCopied(row.id);
    setMessage("URL copiada");
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) return <p className="text-slate-500">Cargando...</p>;
  if (!stats) {
    return <p className="text-red-600">{error || "Sin datos"}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Orígenes / Tráfico</h1>
        <p className="mt-1 text-sm text-slate-500">
          Creá URLs con <code>?o=</code> para medir visitas y clics del CTA por
          campaña.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Visitas
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.views}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Clics CTA
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.clicks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Conversión
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.conversion}%</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Crear origen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">Nombre</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Publicidad Facebook"
              required
              minLength={2}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">
              Clave URL (opcional)
            </span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="auto desde nombre"
            />
          </label>
        </div>
        {previewKey && (
          <p className="mt-3 break-all text-xs text-slate-500">
            URL:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">
              /?c={stats.tenant.slug}&o={previewKey}
            </code>
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Creando..." : "Crear origen"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Visitas</th>
              <th className="px-4 py-3">Clics</th>
              <th className="px-4 py-3">Conv.</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stats.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-slate-500">
                    {row.key ? `o=${row.key}` : "sin parámetro o"}
                    {!row.active && row.kind === "origin" && (
                      <span className="ml-2 text-amber-700">inactivo</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{row.views}</td>
                <td className="px-4 py-3">{row.clicks}</td>
                <td className="px-4 py-3">{row.conversion}%</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => copyUrl(row)}
                      className="hover:underline"
                    >
                      {copied === row.id ? "Copiado" : "Copiar URL"}
                    </button>
                    {row.kind === "origin" && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleActive(row)}
                          className="hover:underline"
                        >
                          {row.active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOrigin(row)}
                          className="text-red-600 hover:underline"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
