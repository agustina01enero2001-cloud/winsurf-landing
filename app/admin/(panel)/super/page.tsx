"use client";

import { FormEvent, useEffect, useState } from "react";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  destinationCount: number;
  hasVideo: boolean;
  publicUrl: string;
};

export default function SuperTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    password: "",
  });
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/super/tenants");
    if (!res.ok) {
      setError("No se pudieron cargar clientes");
      setLoading(false);
      return;
    }
    setTenants(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/super/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al crear");
      return;
    }
    setForm({ name: "", slug: "", password: "" });
    await load();
  }

  async function toggleActive(tenant: TenantRow) {
    await fetch(`/api/admin/super/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !tenant.active }),
    });
    await load();
  }

  async function resetPassword(tenant: TenantRow) {
    const password = prompt(`Nueva contraseña para ${tenant.slug}`);
    if (!password || password.length < 6) return;
    await fetch(`/api/admin/super/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    alert("Password actualizado");
  }

  async function removeTenant(id: string) {
    if (!confirm("¿Eliminar cliente y todos sus destinos?")) return;
    await fetch(`/api/admin/super/tenants/${id}`, { method: "DELETE" });
    await load();
  }

  async function operateAs(tenant: TenantRow) {
    setError("");
    const res = await fetch(
      `/api/admin/super/tenants/${tenant.id}/impersonate`,
      { method: "POST" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo operar como cliente");
      return;
    }
    const data = await res.json().catch(() => ({}));
    window.location.href =
      typeof data.redirect === "string" ? data.redirect : "/admin/settings";
  }

  function copyUrl(tenant: TenantRow) {
    const url = `${window.location.origin}${tenant.publicUrl}`;
    void navigator.clipboard.writeText(url);
    setCopied(tenant.id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) return <p className="text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cada cliente tiene su landing en <code>/?c=slug</code> y su propio
          admin (slug + password).
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Crear cliente</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Nombre / caja</span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Slug (URL)</span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto desde nombre"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Password admin</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {saving ? "Creando..." : "Crear"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Destinos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3">{t.destinationCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {t.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => operateAs(t)}
                      disabled={!t.active}
                      className="rounded bg-slate-900 px-2 py-1 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Operar
                    </button>
                    <button type="button" onClick={() => copyUrl(t)} className="hover:underline">
                      {copied === t.id ? "Copiado" : "Copiar URL"}
                    </button>
                    <a
                      href={t.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Abrir
                    </a>
                    <button type="button" onClick={() => toggleActive(t)} className="hover:underline">
                      {t.active ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" onClick={() => resetPassword(t)} className="hover:underline">
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTenant(t.id)}
                      className="text-red-400 hover:underline"
                    >
                      Borrar
                    </button>
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
