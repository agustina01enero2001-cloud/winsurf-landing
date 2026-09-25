"use client";

import { FormEvent, useEffect, useState } from "react";

type TenantInfo = {
  id: string;
  slug: string;
  name: string;
  template: "winsurf" | "bienvenida";
  publicUrl: string;
  videoUrl: string;
  hasVideo: boolean;
};

export default function TenantSettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<"winsurf" | "bienvenida">("winsurf");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  async function load() {
    const res = await fetch("/api/admin/tenant");
    if (!res.ok) {
      setError("No se pudo cargar el cliente");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTenant(data);
    setName(data.name);
    setTemplate(data.template === "bienvenida" ? "bienvenida" : "winsurf");
    setPreview(`${data.videoUrl}?v=${Date.now()}`);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveBrand(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, template }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar");
      return;
    }
    setMessage("Configuración actualizada");
    await load();
  }

  async function uploadVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("video") as HTMLInputElement;
    if (!input.files?.[0]) {
      setError("Seleccioná un archivo MP4");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    const fd = new FormData();
    fd.append("video", input.files[0]);
    const res = await fetch("/api/admin/tenant/video", {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al subir video");
      return;
    }
    const data = await res.json();
    setMessage("Video actualizado");
    setPreview(data.videoUrl);
    input.value = "";
    await load();
  }

  function copyUrl() {
    if (!tenant) return;
    void navigator.clipboard.writeText(
      `${window.location.origin}${tenant.publicUrl}`,
    );
    setMessage("URL copiada");
  }

  if (loading) return <p className="text-slate-500">Cargando...</p>;
  if (!tenant) return <p className="text-red-600">{error || "Error"}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Marca & video</h1>
        <p className="mt-1 text-sm text-slate-500">
          Landing pública:{" "}
          <code className="rounded bg-slate-200 px-1">{tenant.publicUrl}</code>{" "}
          <button
            type="button"
            onClick={copyUrl}
            className="text-xs font-medium text-slate-700 underline"
          >
            Copiar
          </button>
        </p>
      </div>

      {(error || message) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-emerald-700"}`}>
          {error || message}
        </p>
      )}

      <form
        onSubmit={saveBrand}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Nombre de la caja / marca</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">
            Reemplaza “Winsurf” en la landing y mensajes
          </span>
          <input
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-xs text-slate-500">
            Plantilla de landing
          </span>
          <select
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            value={template}
            onChange={(e) =>
              setTemplate(
                e.target.value === "bienvenida" ? "bienvenida" : "winsurf",
              )
            }
          >
            <option value="winsurf">Winsurf (video + secciones)</option>
            <option value="bienvenida">Bienvenida (one-screen)</option>
          </select>
        </label>
        {template === "bienvenida" && (
          <p className="mt-2 max-w-md text-xs text-slate-500">
            La plantilla Bienvenida no usa el video hero; el upload de abajo solo
            aplica a Winsurf.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <form
        onSubmit={uploadVideo}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Video hero (MP4)</h2>
        {preview && (
          <video
            key={preview}
            src={preview}
            controls
            className="mb-4 max-h-64 w-full max-w-md rounded-lg bg-black"
          />
        )}
        <input
          type="file"
          name="video"
          accept="video/mp4,.mp4"
          className="block w-full max-w-md text-sm"
        />
        <button
          type="submit"
          disabled={uploading}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uploading ? "Subiendo..." : "Subir video"}
        </button>
      </form>
    </div>
  );
}
