"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import OriginsTrafficChart, {
  type TrafficSeriesEntity,
} from "@/components/admin/OriginsTrafficChart";

type StatsRow = {
  id: string;
  kind: "origin" | "suborigin" | "direct";
  parentId: string | null;
  key: string | null;
  subKey: string | null;
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
  seriesEntities: TrafficSeriesEntity[];
  seriesRange: { from: string; to: string };
  rows: StatsRow[];
};

type DateRange = { from: string; to: string };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

function formatCalendarDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

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
  const [savingSub, setSavingSub] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [subParentId, setSubParentId] = useState("");
  const [subName, setSubName] = useState("");
  const [subKey, setSubKey] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null);
  const [rangeError, setRangeError] = useState("");
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[] | null>(
    null,
  );
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(
    () => new Set(),
  );

  const previewKey = useMemo(
    () => (key.trim() ? slugPreview(key) : slugPreview(name)),
    [key, name],
  );

  const originOptions = useMemo(
    () => (stats?.rows ?? []).filter((r) => r.kind === "origin"),
    [stats],
  );

  const selectedOrigin = originOptions.find((o) => o.id === subParentId);
  const previewSubKey = useMemo(
    () => (subKey.trim() ? slugPreview(subKey) : slugPreview(subName)),
    [subKey, subName],
  );

  const seriesEntities = stats?.seriesEntities ?? [];
  const effectiveSelectedIds =
    selectedSeriesIds ?? seriesEntities.map((e) => e.id);

  const tableGroups = useMemo(() => {
    const origins = (stats?.rows ?? []).filter((r) => r.kind === "origin");
    const direct = (stats?.rows ?? []).find((r) => r.kind === "direct");
    return {
      origins: origins.map((origin) => ({
        origin,
        subs: (stats?.rows ?? []).filter(
          (r) => r.kind === "suborigin" && r.parentId === origin.id,
        ),
      })),
      direct,
    };
  }, [stats]);

  async function load(range: DateRange | null = appliedRange): Promise<boolean> {
    const params = new URLSearchParams();
    if (range) {
      params.set("from", range.from);
      params.set("to", range.to);
    }
    const query = params.toString();
    const res = await fetch(query ? `/api/admin/stats?${query}` : "/api/admin/stats");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error ?? "No se pudieron cargar las estadísticas";
      if (range) setRangeError(message);
      else setError(message);
      setLoading(false);
      return false;
    }
    setError("");
    setRangeError("");
    const payload = (await res.json()) as StatsPayload;
    setStats(payload);
    setSelectedSeriesIds((prev) => {
      const ids = (payload.seriesEntities ?? []).map((e) => e.id);
      if (prev === null) return ids;
      const keep = prev.filter((id) => ids.includes(id));
      return keep.length > 0 ? keep : ids;
    });
    setLoading(false);
    return true;
  }

  useEffect(() => {
    void load(null);
  }, []);

  async function handleApplyRange(e: FormEvent) {
    e.preventDefault();
    setRangeError("");
    const from = fromInput.trim();
    const to = toInput.trim();
    if (!from || !to) {
      setRangeError("Indicá desde y hasta. El rango necesita las dos fechas.");
      return;
    }
    if (!isIsoDate(from) || !isIsoDate(to)) {
      setRangeError("Fecha inválida. Usá el formato YYYY-MM-DD.");
      return;
    }
    if (from > to) {
      setRangeError("La fecha desde no puede ser posterior a hasta.");
      return;
    }
    const range = { from, to };
    const ok = await load(range);
    if (ok) setAppliedRange(range);
  }

  function handleClearRange() {
    setFromInput("");
    setToInput("");
    setRangeError("");
    setAppliedRange(null);
    void load(null);
  }

  function toggleExpand(originId: string) {
    setExpandedOrigins((prev) => {
      const next = new Set(prev);
      if (next.has(originId)) next.delete(originId);
      else next.add(originId);
      return next;
    });
  }

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

  async function handleCreateSub(e: FormEvent) {
    e.preventDefault();
    if (!subParentId) {
      setError("Elegí un origen padre");
      return;
    }
    setSavingSub(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/suborigins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originId: subParentId,
        name: subName,
        key: subKey.trim() || undefined,
      }),
    });
    setSavingSub(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al crear suborigen");
      return;
    }
    setSubName("");
    setSubKey("");
    setMessage("Suborigen creado");
    setExpandedOrigins((prev) => new Set(prev).add(subParentId));
    await load();
  }

  async function toggleActive(row: StatsRow) {
    if (row.kind === "origin") {
      await fetch(`/api/admin/origins/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
    } else if (row.kind === "suborigin") {
      await fetch(`/api/admin/suborigins/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
    } else {
      return;
    }
    await load();
  }

  async function removeRow(row: StatsRow) {
    if (row.kind === "origin") {
      if (
        !confirm(
          `¿Eliminar origen "${row.name}"? Se borran también sus suborígenes y contadores.`,
        )
      ) {
        return;
      }
      await fetch(`/api/admin/origins/${row.id}`, { method: "DELETE" });
    } else if (row.kind === "suborigin") {
      if (!confirm(`¿Eliminar suborigen "${row.name}"? Se pierden sus contadores.`)) {
        return;
      }
      await fetch(`/api/admin/suborigins/${row.id}`, { method: "DELETE" });
    } else {
      return;
    }
    await load();
  }

  function copyUrl(row: StatsRow) {
    const url = `${window.location.origin}${row.publicUrl}`;
    void navigator.clipboard.writeText(url);
    setCopied(row.id);
    setMessage("URL copiada");
    setTimeout(() => setCopied(null), 1500);
  }

  function renderRow(row: StatsRow, opts?: { indent?: boolean; toggle?: boolean }) {
    const indent = opts?.indent ?? false;
    const showToggle = opts?.toggle ?? false;
    const expanded = expandedOrigins.has(row.id);
    const subCount =
      row.kind === "origin"
        ? (stats?.rows ?? []).filter(
            (r) => r.kind === "suborigin" && r.parentId === row.id,
          ).length
        : 0;

    return (
      <tr key={row.id} className="border-b border-slate-800 last:border-0">
        <td className="px-4 py-3">
          <div
            className={`flex items-start gap-2 font-medium ${indent ? "pl-2 text-slate-200" : ""}`}
          >
            {showToggle ? (
              <button
                type="button"
                onClick={() => toggleExpand(row.id)}
                className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label={expanded ? "Ocultar suborígenes" : "Mostrar suborígenes"}
                disabled={subCount === 0}
              >
                {subCount === 0 ? (
                  <span className="text-slate-500">·</span>
                ) : expanded ? (
                  "▾"
                ) : (
                  "▸"
                )}
              </button>
            ) : (
              <span className="mt-0.5 inline-block w-5 shrink-0 text-center text-slate-400">
                {indent ? "↳" : ""}
              </span>
            )}
            <div>
              <div>{row.name}</div>
              <div className="mt-0.5 font-mono text-xs font-normal text-slate-400">
                {row.kind === "suborigin" && row.key && row.subKey
                  ? `o=${row.key}&so=${row.subKey}`
                  : row.key
                    ? `o=${row.key}`
                    : "sin parámetro o"}
                {!row.active && row.kind !== "direct" && (
                  <span className="ml-2 text-amber-400">inactivo</span>
                )}
                {row.kind === "origin" && (
                  <span className="ml-2 text-slate-400">
                    (total
                    {subCount > 0 ? ` · ${subCount} sub` : ""})
                  </span>
                )}
              </div>
            </div>
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
            {(row.kind === "origin" || row.kind === "suborigin") && (
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
                  onClick={() => removeRow(row)}
                  className="text-red-400 hover:underline"
                >
                  Borrar
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }

  if (loading) return <p className="text-slate-400">Cargando...</p>;
  if (!stats) {
    return <p className="text-red-400">{error || "Sin datos"}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Orígenes / Tráfico</h1>
        <p className="mt-1 text-sm text-slate-400">
          Creá URLs con <code>?o=</code> y <code>&amp;so=</code> para medir
          visitas y clics del CTA por origen y suborigen. Un visitante cuenta una
          sola vez por cada par origen+suborigen.
        </p>
      </div>

      <form
        onSubmit={handleApplyRange}
        className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Período</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Desde</span>
            <input
              type="date"
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Hasta</span>
            <input
              type="date"
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Aplicar
          </button>
          {appliedRange && (
            <button
              type="button"
              onClick={handleClearRange}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-800"
            >
              Todo
            </button>
          )}
        </div>
        {rangeError && <p className="mt-3 text-sm text-red-400">{rangeError}</p>}
        {appliedRange ? (
          <p className="mt-3 text-sm text-slate-500">
            Únicos registrados por primera vez del{" "}
            {formatCalendarDate(appliedRange.from)} al{" "}
            {formatCalendarDate(appliedRange.to)}, hora de Argentina.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Totales de por vida.</p>
        )}
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Visitas
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.views}</p>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Clics CTA
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.clicks}</p>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Conversión
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.totals.conversion}%</p>
        </div>
      </div>

      <OriginsTrafficChart
        entities={seriesEntities}
        selectedIds={effectiveSelectedIds}
        onChangeSelected={(ids) => setSelectedSeriesIds(ids)}
        rangeLabel={
          stats.seriesRange
            ? appliedRange
              ? `${formatCalendarDate(stats.seriesRange.from)} – ${formatCalendarDate(stats.seriesRange.to)} (Argentina)`
              : `Últimos 30 días · ${formatCalendarDate(stats.seriesRange.from)} – ${formatCalendarDate(stats.seriesRange.to)} (Argentina)`
            : "Sin rango"
        }
      />

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Crear origen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Nombre</span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Landing"
              required
              minLength={2}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">
              Clave URL (opcional)
            </span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="auto desde nombre"
            />
          </label>
        </div>
        {previewKey && (
          <p className="mt-3 break-all text-xs text-slate-400">
            URL:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
              /?c={stats.tenant.slug}&o={previewKey}
            </code>
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {saving ? "Creando..." : "Crear origen"}
        </button>
      </form>

      <form
        onSubmit={handleCreateSub}
        className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold">Crear suborigen</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Origen padre</span>
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={subParentId}
              onChange={(e) => setSubParentId(e.target.value)}
              required
            >
              <option value="">Elegir...</option>
              {originOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (o={o.key})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Nombre</span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="Publicidad WhatsApp"
              required
              minLength={2}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">
              Clave URL (opcional)
            </span>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100"
              value={subKey}
              onChange={(e) => setSubKey(e.target.value)}
              placeholder="auto desde nombre"
            />
          </label>
        </div>
        {selectedOrigin && previewSubKey && (
          <p className="mt-3 break-all text-xs text-slate-400">
            URL:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
              /?c={stats.tenant.slug}&o={selectedOrigin.key}&so={previewSubKey}
            </code>
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
        <button
          type="submit"
          disabled={savingSub || originOptions.length === 0}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {savingSub ? "Creando..." : "Crear suborigen"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Visitas</th>
              <th className="px-4 py-3">Clics</th>
              <th className="px-4 py-3">Conv.</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableGroups.origins.map(({ origin, subs }) => (
              <Fragment key={origin.id}>
                {renderRow(origin, { toggle: true })}
                {expandedOrigins.has(origin.id) &&
                  subs.map((sub) => renderRow(sub, { indent: true }))}
              </Fragment>
            ))}
            {tableGroups.direct && renderRow(tableGroups.direct)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
