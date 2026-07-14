"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AdminIncident, type AdminMetrics } from "../../../lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  bache: "Bache", alumbrado: "Alumbrado", basura: "Basura", agua: "Agua",
  alcantarillado: "Alcantarillado", "señalización": "Señalización",
  "áreas_verdes": "Áreas verdes", ruido: "Ruido", seguridad: "Seguridad", robos: "Robos", otro: "Otro",
};

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

const STATUS_OPTIONS = ["Pendiente", "Confirmado", "En revisión", "Resuelto"];

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
  confirmado: { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" },
  "en_revisión": { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #BFDBFE" },
  resuelto: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" },
};

function normalizeStatus(s: string) {
  return s.toLowerCase().replace(/\s+/g, "_");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

interface MetricCardProps {
  label: string;
  value: number | string;
  accent?: React.CSSProperties;
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", ...accent }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

interface StatusSelectProps {
  incidentId: number;
  currentStatus: string;
  onUpdated: (id: number, newStatus: string) => void;
}

function StatusSelect({ incidentId, currentStatus, onUpdated }: StatusSelectProps) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    setSaving(true);
    try {
      await api.updateIncidentStatus(incidentId, newStatus);
      onUpdated(incidentId, newStatus);
    } catch {
      // silently revert; UI keeps original value
    } finally {
      setSaving(false);
    }
  }

  const key = normalizeStatus(currentStatus);
  const styleBase = STATUS_STYLE[key] ?? {};

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={saving}
      className="text-[11px] font-semibold rounded-lg px-2 py-1 cursor-pointer"
      style={{ ...styleBase, opacity: saving ? 0.6 : 1, border: styleBase.border }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [incidents, setIncidents] = useState<AdminIncident[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const fetchAll = useCallback(async (sf: string, cf: string) => {
    setLoadingIncidents(true);
    try {
      const data = await api.getAdminIncidents(sf || undefined, cf || undefined);
      setIncidents(data);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.toLowerCase().includes("administrador")) {
        setAccessDenied(true);
      }
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    api.getAdminMetrics()
      .then(setMetrics)
      .catch((e: unknown) => {
        if (e instanceof Error && e.message.toLowerCase().includes("administrador")) {
          setAccessDenied(true);
        }
      })
      .finally(() => setLoadingMetrics(false));
  }, []);

  useEffect(() => {
    fetchAll(statusFilter, categoryFilter);
  }, [statusFilter, categoryFilter, fetchAll]);

  function handleStatusUpdated(id: number, newStatus: string) {
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    api.getAdminMetrics().then(setMetrics).catch(() => {});
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: "var(--bg-primary)" }}>
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Acceso restringido</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Esta sección requiere rol de administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Dashboard Admin</h1>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Gestión de incidencias QHALI</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-5">

        {/* Metrics */}
        {loadingMetrics ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse h-20"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }} />
            ))}
          </div>
        ) : metrics ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Total reportes" value={metrics.total_reportes} />
              <MetricCard label="Pendientes" value={metrics.reportes_pendientes}
                accent={{ borderColor: "#FDE68A" }} />
              <MetricCard label="Confirmados" value={metrics.reportes_confirmados}
                accent={{ borderColor: "#FECACA" }} />
              <MetricCard label="En revisión" value={metrics.reportes_en_revision}
                accent={{ borderColor: "#BFDBFE" }} />
              <MetricCard label="Resueltos" value={metrics.reportes_resueltos}
                accent={{ borderColor: "#BBF7D0" }} />
              <MetricCard
                label="Categoría frecuente"
                value={metrics.categoria_mas_frecuente
                  ? (CATEGORY_ICONS[metrics.categoria_mas_frecuente] ?? "") + " " +
                    (CATEGORY_LABELS[metrics.categoria_mas_frecuente] ?? metrics.categoria_mas_frecuente)
                  : "—"}
              />
            </div>
          </>
        ) : null}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {["", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: statusFilter === s ? "var(--qhali-primary)" : "var(--bg-elevated)",
                  color: statusFilter === s ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {s || "Todos"}
              </button>
            ))}
          </div>

          {/* Category select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-full"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{CATEGORY_ICONS[v]} {l}</option>
            ))}
          </select>
        </div>

        {/* Incidents list */}
        {loadingIncidents ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse h-24"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }} />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              No hay incidentes{statusFilter ? ` con estado "${statusFilter}"` : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              {incidents.length} incidente{incidents.length !== 1 ? "s" : ""}
            </p>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--bg-primary)" }}
                  >
                    {CATEGORY_ICONS[inc.category] ?? "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                        #{inc.id} · {inc.public_alias}
                      </span>
                      <StatusSelect
                        incidentId={inc.id}
                        currentStatus={inc.status}
                        onUpdated={handleStatusUpdated}
                      />
                    </div>
                    <p className="text-sm leading-snug mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {inc.description.length > 90
                        ? inc.description.slice(0, 90) + "…"
                        : inc.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="text-[10px] capitalize px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
                      >
                        {CATEGORY_LABELS[inc.category] ?? inc.category}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        ✓ {inc.validation_count} val.
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {formatDate(inc.created_at)}
                      </span>
                      {inc.latitude && (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          📍 {inc.latitude.toFixed(4)}, {inc.longitude?.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
