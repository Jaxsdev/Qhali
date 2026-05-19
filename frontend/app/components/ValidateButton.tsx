"use client";

import { useState } from "react";
import { api } from "../lib/api";

type BtnState =
  | "idle"
  | "loading"
  | "success"
  | "already_validated"
  | "own_incident"
  | "too_far"
  | "confirmed"
  | "error";

interface ValidateButtonProps {
  incidentId: number;
  incidentStatus: string;
  userLat: number | null;
  userLng: number | null;
  onValidated?: (newCount: number, newStatus: string) => void;
}

function normalizeStatus(s: string) {
  return s.toLowerCase().replace(/\s+/g, "_");
}

const STATE_CONFIG: Record<BtnState, { label: string; disabled: boolean; style: React.CSSProperties }> = {
  idle: {
    label: "Confirmar incidente",
    disabled: false,
    style: { background: "var(--qhali-primary)", color: "#fff", boxShadow: "var(--shadow-primary)" },
  },
  loading: {
    label: "Enviando…",
    disabled: true,
    style: { background: "var(--qhali-primary)", color: "#fff", opacity: 0.7 },
  },
  success: {
    label: "✓ Validación registrada",
    disabled: true,
    style: { background: "var(--color-success)", color: "#fff" },
  },
  already_validated: {
    label: "Ya confirmaste este incidente",
    disabled: true,
    style: { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  },
  own_incident: {
    label: "No puedes confirmar tu propio reporte",
    disabled: true,
    style: { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  },
  too_far: {
    label: "Estás demasiado lejos (> 300 m)",
    disabled: true,
    style: { background: "var(--status-pending-bg)", color: "var(--status-pending-text)", border: "1px solid var(--status-pending-border)" },
  },
  confirmed: {
    label: "✓ Confirmado por la comunidad",
    disabled: true,
    style: { background: "var(--status-confirmed-bg)", color: "var(--status-confirmed-text)", border: "1px solid var(--status-confirmed-border)" },
  },
  error: {
    label: "Error al validar — reintentar",
    disabled: false,
    style: { background: "var(--status-pending-bg)", color: "var(--status-pending-text)", border: "1px solid var(--status-pending-border)" },
  },
};

export default function ValidateButton({
  incidentId,
  incidentStatus,
  userLat,
  userLng,
  onValidated,
}: ValidateButtonProps) {
  const initialState: BtnState =
    normalizeStatus(incidentStatus) !== "pendiente" ? "confirmed" : "idle";
  const [btnState, setBtnState] = useState<BtnState>(initialState);

  async function handleClick() {
    if (STATE_CONFIG[btnState].disabled) return;

    if (userLat == null || userLng == null) {
      setBtnState("too_far");
      return;
    }

    setBtnState("loading");
    try {
      const result = await api.validateIncident(incidentId, userLat, userLng);
      if (result.status === "Confirmado") {
        setBtnState("confirmed");
      } else {
        setBtnState("success");
      }
      onValidated?.(result.validation_count, result.status);
    } catch (e: unknown) {
      const msg = (e instanceof Error ? e.message : "").toLowerCase();
      if (msg.includes("propio")) {
        setBtnState("own_incident");
      } else if (msg.includes("ya confirmaste") || msg.includes("duplicad")) {
        setBtnState("already_validated");
      } else if (msg.includes("lejos") || msg.includes("300")) {
        setBtnState("too_far");
      } else if (msg.includes("confirmado") || msg.includes("estado")) {
        setBtnState("confirmed");
      } else {
        setBtnState("error");
      }
    }
  }

  const cfg = STATE_CONFIG[btnState];

  return (
    <button
      onClick={handleClick}
      disabled={cfg.disabled}
      className="w-full rounded-xl text-sm font-semibold py-2.5 px-4 transition-all active:scale-95"
      style={{
        ...cfg.style,
        cursor: cfg.disabled ? "not-allowed" : "pointer",
      }}
    >
      {btnState === "loading" ? (
        <span className="flex items-center justify-center gap-2">
          <span
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
            style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "#fff" }}
          />
          {cfg.label}
        </span>
      ) : (
        cfg.label
      )}
    </button>
  );
}
