"use client";

import React from "react";

interface StatusBadgeProps {
  status: "pendiente" | "confirmado" | "en_revisión" | "resuelto";
  size?: "sm" | "md";
}

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  "en_revisión": "En revisión",
  resuelto: "Resuelto",
};

const statusStyles: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "en_revisión": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  resuelto: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

const statusIcons: Record<string, string> = {
  pendiente: "⏳",
  confirmado: "✅",
  "en_revisión": "🔍",
  resuelto: "🎉",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${statusStyles[status] || statusStyles.pendiente}
        ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"}
      `}
    >
      <span>{statusIcons[status]}</span>
      {statusLabels[status] || status}
    </span>
  );
}
