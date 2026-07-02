"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { readTwclidFromSearchParams, TWCLID_PARAM } from "@/lib/twclid";

type WhatsAppButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

export default function WhatsAppButton({
  children,
  className = "",
  variant = "primary",
}: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleClick() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const twclid = readTwclidFromSearchParams(searchParams);
      if (twclid) {
        params.set(TWCLID_PARAM, twclid);
      }
      const res = await fetch(`/api/wa-link?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error");

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      alert("No se pudo abrir WhatsApp. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const baseStyles =
    variant === "primary"
      ? "bg-gradient-to-r from-cyan-400 via-teal-400 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:brightness-110 active:scale-[0.98]"
      : "border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${baseStyles} ${className}`}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Conectando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
