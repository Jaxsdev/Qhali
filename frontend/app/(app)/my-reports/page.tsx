"use client";

import { useEffect, useState } from "react";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { api, type IncidentResponse } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", otro: "📌",
};

const TABS = ["Todos", "En proceso", "Resueltos"] as const;
type Tab = (typeof TABS)[number];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function normalizeStatus(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Todos");

  useEffect(() => {
    api.getMyIncidents()
      .then(setReports)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => {
    const s = normalizeStatus(r.status);
    if (activeTab === "En proceso") return s === "pendiente" || s === "confirmado" || s === "en_revisión";
    if (activeTab === "Resueltos") return s === "resuelto";
    return true;
  });

  const countPending  = reports.filter((r) => normalizeStatus(r.status) === "pendiente").length;
  const countReview   = reports.filter((r) => normalizeStatus(r.status) === "confirmado" || normalizeStatus(r.status) === "en_revisión").length;
  const countResolved = reports.filter((r) => normalizeStatus(r.status) === "resuelto").length;

  return (
    <div className="min-h-screen pb-6" style={{ background: "var(--bg-primary)" }}>

      {/* Header + Tabs */}
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Mis reportes
          </h1>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {loading ? "Cargando…" : `${reports.length} reportes realizados`}
          </p>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer border"
              style={
                activeTab === tab
                  ? {
                      background: "var(--qhali-primary-pale)",
                      color: "var(--qhali-primary)",
                      borderColor: "var(--qhali-primary-light)",
                    }
                  : {
                      color: "var(--text-muted)",
                      borderColor: "transparent",
                      background: "transparent",
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 animate-slide-up">
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-warning)" }}>{countPending}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pendientes</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--qhali-primary)" }}>{countReview}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>En proceso</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-success)" }}>{countResolved}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Resueltos</p>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--qhali-primary-pale)", borderTopColor: "var(--qhali-primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando reportes…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              No se pudieron cargar tus reportes
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        )}

        {/* Reports list */}
        {!loading && !error && (
          <div className="space-y-2">
            {filtered.map((report, i) => (
              <div key={report.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <Card hover className="p-4">
                  <div className="flex items-start gap-3">

                    {/* Icon or thumbnail */}
                    {report.image_url ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
                      >
                        {CATEGORY_ICONS[report.category] ?? "📌"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {report.description.length > 60
                          ? report.description.slice(0, 60) + "…"
                          : report.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusBadge status={report.status} />
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {formatDate(report.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="text-[10px] capitalize px-2 py-0.5 rounded"
                          style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {report.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {report.validation_count} validaciones
                        </span>
                      </div>
                    </div>

                    <svg
                      className="w-4 h-4 flex-shrink-0 mt-1"
                      style={{ color: "var(--border)" }}
                      fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Card>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  No hay reportes en esta categoría
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {reports.length === 0 ? "Aún no has realizado ningún reporte." : "Prueba seleccionando otra pestaña."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
