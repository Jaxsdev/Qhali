"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import ValidateButton from "../../components/ValidateButton";
import { api, type NearbyIncidentItem } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", otro: "📌",
};

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric", month: "short",
  });
}

type GpsState = "requesting" | "granted" | "denied" | "unavailable";

export default function NearbyPage() {
  const [gpsState, setGpsState] = useState<GpsState>("requesting");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<NearbyIncidentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNearbyIncidents(lat, lng);
      setIncidents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar incidentes cercanos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setGpsState("granted");
        if (!fetchedRef.current) {
          fetchedRef.current = true;
          fetchNearby(lat, lng);
        }
      },
      () => setGpsState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchNearby]);

  const [validatingId, setValidatingId] = useState<number | null>(null);

  async function handleLikeValidate(incId: number, lat: number, lng: number) {
    try {
      setValidatingId(incId);
      const res = await api.validateIncident(incId, lat, lng);
      handleValidated(incId, res.validation_count, res.status);
    } catch (err: any) {
      alert(err.message || "Error al validar");
    } finally {
      setValidatingId(null);
    }
  }

  function handleShareWhatsApp(id: number, category: string, description: string) {
    const text = `🚨 *QHALI — Reporte Ciudadano* 🚨\n\n*Categoría:* #${category}\n*Detalle:* ${description}\n\nAyúdanos a confirmar este reporte para alertar a las autoridades. Consúltalo aquí:\n${window.location.origin}/post/${id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleValidated(incidentId: number, newCount: number, newStatus: string) {
    setIncidents((prev) =>
      prev
        .map((i) =>
          i.id === incidentId
            ? { ...i, validation_count: newCount, status: newStatus }
            : i
        )
        .filter((i) => i.status === "Pendiente")
    );
  }

  const pendingCount = incidents.filter((i) => i.status === "Pendiente").length;

  return (
    <div className="min-h-screen pb-6" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 surface-header md:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Incidentes cercanos
          </h1>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {gpsState === "granted" && !loading
              ? `${pendingCount} pendientes a menos de 300 m`
              : gpsState === "requesting"
              ? "Obteniendo ubicación…"
              : gpsState === "denied"
              ? "GPS no disponible"
              : "Geolocalización no soportada"}
          </p>
        </div>

        {/* Info strip */}
        <div
          className="max-w-lg mx-auto px-4 pb-2.5 flex items-center gap-2"
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: "var(--qhali-primary-pale)",
              color: "var(--qhali-primary)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Radio: 300 m
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
            }}
          >
            Solo pendientes de otros vecinos
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-4">

        {/* GPS denied / unavailable */}
        {(gpsState === "denied" || gpsState === "unavailable") && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {gpsState === "denied"
                ? "Permiso de ubicación denegado"
                : "Geolocalización no disponible"}
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {gpsState === "denied"
                ? "Para ver incidentes cercanos necesitamos acceder a tu ubicación. Actívala en la configuración de tu navegador."
                : "Tu navegador no soporta geolocalización. Prueba con Chrome o Safari en móvil."}
            </p>
          </div>
        )}

        {/* Loading GPS */}
        {gpsState === "requesting" && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--qhali-primary-pale)", borderTopColor: "var(--qhali-primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Obteniendo tu ubicación…</p>
          </div>
        )}

        {/* Loading incidents */}
        {gpsState === "granted" && loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--qhali-primary-pale)", borderTopColor: "var(--qhali-primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Buscando incidentes cercanos…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              No se pudieron cargar los incidentes
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{error}</p>
            <button
              onClick={() => userLat && userLng && fetchNearby(userLat, userLng)}
              className="mt-4 text-xs font-medium px-4 py-2 rounded-lg"
              style={{
                background: "var(--qhali-primary-pale)",
                color: "var(--qhali-primary)",
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Incidents list */}
        {gpsState === "granted" && !loading && !error && (
          <>
            {incidents.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  No hay incidentes pendientes cerca
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  No encontramos reportes de otros vecinos en un radio de 300 m.
                </p>
                <button
                  onClick={() => userLat && userLng && fetchNearby(userLat, userLng)}
                  className="mt-4 text-xs font-medium px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--qhali-primary-pale)",
                    color: "var(--qhali-primary)",
                  }}
                >
                  Actualizar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incidents.map((inc, i) => (
                  <div key={inc.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <Card className="overflow-hidden border border-[var(--text-primary)] rounded-none flex flex-col justify-between bg-white h-full">
                      {/* Post Header */}
                      <div className="p-3 flex items-center justify-between border-b border-[var(--border)]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold border border-[var(--text-primary)]"
                            style={{ background: "var(--qhali-primary)" }}
                          >
                            {inc.public_alias?.[0]?.toUpperCase() ?? "C"}
                          </div>
                          <div>
                            <p className="text-xs font-black leading-none" style={{ color: "var(--text-primary)" }}>{inc.public_alias}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                              📍 {formatDistance(inc.distance_meters)} • {formatDate(inc.created_at)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>

                      {/* Post Image */}
                      {inc.image_url ? (
                        <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 border-b border-[var(--border)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={inc.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-48 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] border-b border-[var(--border)] relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B35_1px,transparent_1px)] [background-size:16px_16px]" />
                          <span className="text-5xl z-10">{CATEGORY_ICONS[inc.category] ?? "📌"}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest mt-2 z-10 text-[var(--text-muted)]">#{inc.category}</span>
                        </div>
                      )}

                      {/* Interaction Bar & Caption */}
                      <div className="p-3 space-y-2">
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLikeValidate(inc.id, userLat ?? inc.latitude, userLng ?? inc.longitude)}
                              disabled={validatingId === inc.id}
                              className="flex items-center gap-1.5 text-xs font-bold hover:text-[var(--qhali-primary)] transition-colors cursor-pointer group"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <span className="text-base group-hover:scale-125 transition-transform duration-100">
                                {validatingId === inc.id ? "⏳" : "🧡"}
                              </span>
                              <span>Validar</span>
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(inc.id, inc.category, inc.description)}
                              className="flex items-center gap-1.5 text-xs font-bold hover:text-[#25D366] transition-colors cursor-pointer group"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <span className="text-base group-hover:scale-125 transition-transform duration-100">
                                💬
                              </span>
                              <span>Compartir</span>
                            </button>
                          </div>

                          <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                            ✓ {inc.validation_count} validaciones
                          </span>
                        </div>

                        {/* Caption */}
                        <p className="text-xs leading-normal" style={{ color: "var(--text-primary)" }}>
                          <span className="font-black mr-1.5">{inc.public_alias}</span>
                          {inc.description}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
