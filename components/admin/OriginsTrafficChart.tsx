"use client";

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

type OriginsTrafficChartProps = {
  data: TrafficSeriesPoint[];
  rangeLabel: string;
};

function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function OriginsTrafficChart({
  data,
  rangeLabel,
}: OriginsTrafficChartProps) {
  const hasSignal = data.some((p) => p.views > 0 || p.clicks > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Visitas y clics</h2>
          <p className="mt-1 text-xs text-slate-500">{rangeLabel}</p>
        </div>
      </div>
      {!hasSignal ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Todavía no hay eventos únicos en este período.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: "#64748b" }}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
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
                  borderColor: "#e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                name="Visitas"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                name="Clics CTA"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
