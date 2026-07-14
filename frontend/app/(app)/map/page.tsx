"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { api, type IncidentResponse } from "../../lib/api";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

const CATEGORY_FILTERS = [
  { key: "", label: "Todos", icon: "🌎" },
  { key: "bache", label: "Baches", icon: "🕳️" },
  { key: "alumbrado", label: "Alumbrado", icon: "💡" },
  { key: "basura", label: "Basura", icon: "🗑️" },
  { key: "agua", label: "Agua", icon: "💧" },
  { key: "alcantarillado", label: "Alcantarilla", icon: "🚰" },
  { key: "seguridad", label: "Seguridad", icon: "🔒" },
];

const STATUS_LEGEND = [
  { key: "pendiente",     color: "#9CA3AF", label: "Pendiente" },
  { key: "confirmado",    color: "#EF4444", label: "Confirmado" },
  { key: "en_revisión",   color: "#3B82F6", label: "En revisión" },
  { key: "resuelto",      color: "#22C55E", label: "Resuelto" },
];

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function MapPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [filtered, setFiltered] = useState<IncidentResponse[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [selected, setSelected] = useState<IncidentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"points" | "heatmap">("points");

  useEffect(() => {
    api.getPublicIncidents()
      .then((data) => {
        setIncidents(data);
        setFiltered(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCategory) {
      setFiltered(incidents);
    } else {
      setFiltered(incidents.filter((i) => i.category === activeCategory));
    }
    setSelected(null);
  }, [activeCategory, incidents]);

  const handleSelect = useCallback((inc: IncidentResponse) => {
    setSelected((prev) => (prev?.id === inc.id ? null : inc));
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--bottom-nav-height))] md:h-screen">

      {/* Header */}
      <header className="flex-shrink-0 surface-header z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Mapa de incidencias
              </h1>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Huancayo — {loading ? "…" : `${filtered.length} incidencias`}
              </p>
            </div>
            {/* Legend and Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {STATUS_LEGEND.map((s) => (
                  <div key={s.key} className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: s.color, border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                    />
                    <span className="text-[9px] hidden sm:block" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex bg-gray-100 rounded-md p-0.5 border border-[var(--border)]">
                <button
                  onClick={() => setViewMode("points")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${viewMode === "points" ? "bg-white shadow-sm text-[var(--qhali-primary)]" : "text-[var(--text-muted)]"}`}
                >
                  Puntos
                </button>
                <button
                  onClick={() => setViewMode("heatmap")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${viewMode === "heatmap" ? "bg-white shadow-sm text-red-600" : "text-[var(--text-muted)]"}`}
                >
                  Calor
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "var(--bg-secondary)" }}>
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full border-4 border-t-transparent mx-auto animate-spin mb-3"
                style={{ borderColor: "var(--qhali-primary-pale)", borderTopColor: "var(--qhali-primary)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando mapa…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "var(--bg-secondary)" }}>
            <div className="text-center px-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No se pudo cargar el mapa</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <MapView
            incidents={filtered}
            onSelect={handleSelect}
            selectedId={selected?.id ?? null}
            viewMode={viewMode}
          />
        )}

        {/* Side panel — incident detail */}
        {selected && (
          <div className="absolute top-4 right-4 bottom-4 z-[1000] w-[calc(100%-2rem)] md:w-96 animate-fade-in overflow-y-auto rounded-2xl"
               style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)" }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Detalle del reporte</h3>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}>
                    {CATEGORY_ICONS[selected.category] ?? "📌"}
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>{selected.category}</p>
                    <StatusBadge status={selected.status} size="sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Descripción</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{selected.description}</p>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">📍</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-muted)]">Ubicación</p>
                      <p className="text-xs">{selected.address || `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">📅</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-muted)]">Fecha</p>
                      <p className="text-xs">{formatDate(selected.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">👤</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-muted)]">Reportado por</p>
                      <p className="text-xs">{selected.public_alias}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">✓</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-muted)]">Validaciones</p>
                      <p className="text-xs">{selected.validation_count}</p>
                    </div>
                  </div>
                </div>

                {selected.image_url && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Fotografía</p>
                    <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selected.image_url} alt="Foto del incidente" className="w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category filter bar */}
      <div
        className="flex-shrink-0 z-30 px-4 py-2.5"
        style={{
          background: "var(--bg-header)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "0 -1px 0 var(--border-subtle)",
        }}
      >
        <div className="w-full max-w-5xl mx-auto flex items-stretch md:justify-center gap-2 md:gap-4 overflow-x-auto py-1 scrollbar-thin">
          {CATEGORY_FILTERS.map((f) => {
            const active = activeCategory === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveCategory(f.key)}
                className="flex-shrink-0 flex flex-col items-center justify-center p-2 md:py-3 rounded-none transition-all duration-150 active:scale-95 border cursor-pointer min-w-[72px] md:min-w-[100px]"
                style={{
                  background: active ? "var(--qhali-primary-pale)" : "var(--bg-card)",
                  borderColor: active ? "var(--text-primary)" : "var(--border)",
                  borderWidth: active ? "2px" : "1px",
                }}
              >
                <span className="text-lg">{f.icon}</span>
                <span
                  className="text-[9px] font-bold mt-1"
                  style={{ color: active ? "var(--qhali-primary)" : "var(--text-primary)" }}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
