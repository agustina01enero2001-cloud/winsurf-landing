"use client";

import { FormEvent, useEffect, useState } from "react";

type Destination = {
  id: string;
  type: string;
  number: string | null;
  url: string | null;
  label: string | null;
  active: boolean;
  sortOrder: number;
};

const emptyForm = {
  type: "whatsapp" as "whatsapp" | "url",
  number: "",
  url: "",
  label: "",
  sortOrder: 0,
  active: true,
};

export default function DestinationsPage() {
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/destinations");
    if (!res.ok) {
      setError("No se pudieron cargar destinos");
      setLoading(false);
      return;
    }
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(d: Destination) {
    setEditingId(d.id);
    setForm({
      type: d.type === "url" ? "url" : "whatsapp",
      number: d.number ?? "",
      url: d.url ?? "",
      label: d.label ?? "",
      sortOrder: d.sortOrder,
      active: d.active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      type: form.type,
      number: form.number,
      url: form.url,
      label: form.label || null,
      sortOrder: form.sortOrder,
      active: form.active,
    };
    const res = editingId
      ? await fetch(`/api/admin/destinations/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar");
      return;
    }
    cancelEdit();
    await load();
  }

  async function toggleActive(d: Destination) {
    await fetch(`/api/admin/destinations/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    await load();
  }

  async function removeItem(id: string) {
    if (!confirm("¿Eliminar destino?")) return;
    await fetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <p className="text-slate-400">Cargando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Destinos de redirección</h1>
        <p className="mt-1 text-sm text-slate-400">
          WhatsApp o URL externa. La landing rota entre los activos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">
          {editingId ? "Editar destino" : "Agregar destino"}
        </h2>
        <div className="mb-4 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={form.type === "whatsapp"}
              onChange={() => setForm({ ...form, type: "whatsapp" })}
            />
            WhatsApp
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={form.type === "url"}
              onChange={() => setForm({ ...form, type: "url" })}
            />
            URL
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {form.type === "whatsapp" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Número</span>
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="5493815901533"
                required
              />
            </label>
          ) : (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">URL</span>
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Etiqueta</span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Orden</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Activo
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Actualizar" : "Agregar"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3 text-xs font-medium uppercase">
                  {d.type}
                </td>
                <td className="px-4 py-3 font-mono text-xs break-all">
                  {d.type === "url" ? d.url : d.number}
                </td>
                <td className="px-4 py-3">{d.label ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {d.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs font-medium">
                    <button type="button" onClick={() => startEdit(d)} className="hover:underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => toggleActive(d)} className="hover:underline">
                      {d.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(d.id)}
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
