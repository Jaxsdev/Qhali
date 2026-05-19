"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

function normalizeStatus(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

const statusLabels: Record<string, string> = {
  pendiente:     "Pendiente",
  confirmado:    "Confirmado",
  "en_revisión": "En revisión",
  resuelto:      "Resuelto",
};

const statusDot: Record<string, string> = {
  pendiente:     "var(--status-pending-text)",
  confirmado:    "var(--status-confirmed-text)",
  "en_revisión": "var(--status-review-text)",
  resuelto:      "var(--status-resolved-text)",
};

const statusClass: Record<string, string> = {
  pendiente:     "status-pendiente",
  confirmado:    "status-confirmado",
  "en_revisión": "status-en_revision",
  resuelto:      "status-resuelto",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const key = normalizeStatus(status);
  const cls = statusClass[key] ?? "status-pendiente";
  const dot = statusDot[key] ?? statusDot.pendiente;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md font-medium
        ${cls}
        ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}
      `}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dot }}
      />
      {statusLabels[key] ?? status}
    </span>
  );
}
