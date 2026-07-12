"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { api, type IncidentResponse } from "../../lib/api";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

const CATEGORY_FILTERS = [
  { key: "", label: "Todos" },
  { key: "bache", label: "Baches" },
  { key: "alumbrado", label: "Alumbrado" },
  { key: "basura", label: "Basura" },
  { key: "agua", label: "Agua" },
  { key: "alcantarillado", label: "Alcantarilla" },
  { key: "seguridad", label: "Seguridad" },
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
  ruido: "🔊", seguridad: "🔒", otro: "📌",
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
            {/* Legend */}
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
          </div>
        </div>
      </header>

      {/* Map area — flex-1 so it fills remaining height */}
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
          />
        )}

        {/* Bottom sheet — incident detail */}
        {selected && (
          <div className="absolute bottom-0 left-0 right-0 z-20 animate-slide-up">
            <div
              className="mx-auto max-w-lg rounded-t-2xl p-4 shadow-lg"
              style={{
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border-subtle)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Drag handle */}
              <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ background: "var(--border)" }} />

              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
                >
                  {CATEGORY_ICONS[selected.category] ?? "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium capitalize" style={{ color: "var(--text-muted)" }}>
                        {selected.category}
                      </p>
                      <StatusBadge status={selected.status} size="sm" />
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm mt-2 leading-snug" style={{ color: "var(--text-primary)" }}>
                    {selected.description}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      📍 {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ✓ {selected.validation_count} validaciones
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {formatDate(selected.created_at)}
                    </span>
                  </div>

                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Reportado por {selected.public_alias}
                  </p>
                </div>
              </div>

              {selected.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden" style={{ maxHeight: "160px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.image_url}
                    alt="Foto del incidente"
                    className="w-full object-cover"
                    style={{ maxHeight: "160px" }}
                  />
                </div>
              )}
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
        <div className="max-w-lg mx-auto flex items-center gap-2 overflow-x-auto">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveCategory(f.key)}
              className="flex-shrink-0 text-[10px] font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer"
              style={
                activeCategory === f.key
                  ? {
                      background: "var(--qhali-primary-pale)",
                      color: "var(--qhali-primary)",
                      borderColor: "var(--qhali-primary-light)",
                    }
                  : {
                      background: "var(--bg-primary)",
                      color: "var(--text-muted)",
                      borderColor: "var(--border-subtle)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
