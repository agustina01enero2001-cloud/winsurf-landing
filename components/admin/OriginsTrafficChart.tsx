"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrafficSeriesPoint = {
  date: string;
  views: number;
  clicks: number;
};

export type TrafficSeriesEntity = {
  id: string;
  label: string;
  kind: "origin" | "suborigin" | "direct";
  points: TrafficSeriesPoint[];
};

const COLORS = [
  "#e2e8f0",
  "#2dd4bf",
  "#fb923c",
  "#a78bfa",
  "#38bdf8",
  "#fb7185",
  "#a3e635",
  "#fbbf24",
  "#94a3b8",
  "#22d3ee",
];

type OriginsTrafficChartProps = {
  entities: TrafficSeriesEntity[];
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  rangeLabel: string;
};

type MenuItem = {
  entity: TrafficSeriesEntity;
  volume: number;
  depth: 0 | 1;
  colorIndex: number;
};

function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function colorFor(id: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash + index) % COLORS.length];
}

function entityVolume(entity: TrafficSeriesEntity): number {
  return entity.points.reduce((sum, p) => sum + p.views + p.clicks, 0);
}

function parentOriginId(subId: string): string | null {
  if (!subId.includes("|so:")) return null;
  return subId.split("|so:")[0] ?? null;
}

/** Origins (and direct) by volume desc; under each origin, suborigins by volume desc. */
function buildHierarchicalMenu(entities: TrafficSeriesEntity[]): MenuItem[] {
  const origins = entities.filter((e) => e.kind === "origin");
  const subs = entities.filter((e) => e.kind === "suborigin");
  const direct = entities.find((e) => e.kind === "direct");

  const topLevel: { entity: TrafficSeriesEntity; volume: number }[] = [
    ...origins.map((entity) => ({ entity, volume: entityVolume(entity) })),
  ];
  if (direct) {
    topLevel.push({ entity: direct, volume: entityVolume(direct) });
  }
  topLevel.sort((a, b) => b.volume - a.volume || a.entity.label.localeCompare(b.entity.label));

  const items: MenuItem[] = [];
  let colorIndex = 0;

  for (const top of topLevel) {
    items.push({
      entity: top.entity,
      volume: top.volume,
      depth: 0,
      colorIndex: colorIndex++,
    });

    if (top.entity.kind !== "origin") continue;

    const children = subs
      .filter((s) => parentOriginId(s.id) === top.entity.id)
      .map((entity) => ({ entity, volume: entityVolume(entity) }))
      .sort((a, b) => b.volume - a.volume || a.entity.label.localeCompare(b.entity.label));

    for (const child of children) {
      items.push({
        entity: child.entity,
        volume: child.volume,
        depth: 1,
        colorIndex: colorIndex++,
      });
    }
  }

  return items;
}

export default function OriginsTrafficChart({
  entities,
  selectedIds,
  onChangeSelected,
  rangeLabel,
}: OriginsTrafficChartProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const menuItems = useMemo(() => buildHierarchicalMenu(entities), [entities]);

  const selectedEntities = useMemo(
    () => entities.filter((e) => selectedSet.has(e.id)),
    [entities, selectedSet],
  );

  const chartData = useMemo(() => {
    const dates = entities[0]?.points.map((p) => p.date) ?? [];
    return dates.map((date, i) => {
      const row: Record<string, string | number> = { date };
      for (const entity of selectedEntities) {
        const point = entity.points[i];
        row[`${entity.id}__views`] = point?.views ?? 0;
        row[`${entity.id}__clicks`] = point?.clicks ?? 0;
      }
      return row;
    });
  }, [entities, selectedEntities]);

  const hasSignal = selectedEntities.some((e) =>
    e.points.some((p) => p.views > 0 || p.clicks > 0),
  );

  const allIds = entities.map((e) => e.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const noneSelected = selectedIds.length === 0;

  const triggerLabel = useMemo(() => {
    if (noneSelected) return "Ninguno seleccionado";
    if (allSelected) return "Todos los orígenes";
    if (selectedIds.length === 1) {
      const one = entities.find((e) => e.id === selectedIds[0]);
      return one?.label ?? "1 seleccionado";
    }
    return `${selectedIds.length} seleccionados`;
  }, [allSelected, entities, noneSelected, selectedIds]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const el = dropdownRef.current;
      if (!el) return;
      if (!el.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectAll() {
    onChangeSelected(allIds);
  }

  function selectNone() {
    onChangeSelected([]);
  }

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChangeSelected(selectedIds.filter((x) => x !== id));
    } else {
      onChangeSelected([...selectedIds, id]);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Visitas y clics</h2>
          <p className="mt-1 text-xs text-slate-400">{rangeLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            Línea continua = visitas · punteada = clics · mismo color por origen
          </p>
        </div>

        <div className="relative w-full max-w-sm" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-left text-sm text-slate-100 shadow-sm hover:border-slate-500"
          >
            <span className="truncate">{triggerLabel}</span>
            <span className="shrink-0 text-slate-400">{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-1 max-h-80 w-full min-w-[16rem] overflow-auto rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
              <div className="flex gap-2 border-b border-slate-800 px-3 py-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    allSelected
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    noneSelected
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Ninguno
                </button>
              </div>

              <ul role="listbox" aria-multiselectable className="py-1">
                {menuItems.map((item) => {
                  const { entity, depth, colorIndex, volume } = item;
                  const checked = selectedSet.has(entity.id);
                  const color = colorFor(entity.id, colorIndex);
                  return (
                    <li key={entity.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800/80 ${
                          depth === 1 ? "pl-8 text-slate-400" : "text-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(entity.id)}
                          className="size-4 shrink-0 rounded border-slate-600 bg-slate-950"
                        />
                        <span
                          className="inline-block size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {depth === 1 ? `↳ ${entity.label}` : entity.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {volume}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {selectedEntities.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Seleccioná al menos un origen o suborigen para comparar.
        </p>
      ) : !hasSignal ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Todavía no hay eventos únicos en este período.
        </p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={36}
              />
              <Tooltip
                labelFormatter={(label) => {
                  if (typeof label !== "string") return "";
                  const [y, m, d] = label.split("-");
                  return `${d}/${m}/${y}`;
                }}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#475569",
                  backgroundColor: "#0f172a",
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ color: "#cbd5e1" }}
              />
              {selectedEntities.flatMap((entity) => {
                const menuIndex = menuItems.findIndex(
                  (m) => m.entity.id === entity.id,
                );
                const color = colorFor(
                  entity.id,
                  menuIndex >= 0 ? menuItems[menuIndex].colorIndex : 0,
                );
                return [
                  <Line
                    key={`${entity.id}-views`}
                    type="monotone"
                    dataKey={`${entity.id}__views`}
                    name={`${entity.label} · visitas`}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />,
                  <Line
                    key={`${entity.id}-clicks`}
                    type="monotone"
                    dataKey={`${entity.id}__clicks`}
                    name={`${entity.label} · clics`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />,
                ];
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
