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
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-lg mx-auto px-4 py-3">
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

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">

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
              incidents.map((inc, i) => (
                <div key={inc.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon / thumbnail */}
                      {inc.image_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={inc.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
                        >
                          {CATEGORY_ICONS[inc.category] ?? "📌"}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Distance badge + status */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--qhali-primary-pale)",
                              color: "var(--qhali-primary)",
                            }}
                          >
                            📍 {formatDistance(inc.distance_meters)}
                          </span>
                          <StatusBadge status={inc.status} size="sm" />
                        </div>

                        {/* Description */}
                        <p
                          className="text-sm leading-snug"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {inc.description.length > 80
                            ? inc.description.slice(0, 80) + "…"
                            : inc.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span
                            className="text-[10px] capitalize px-1.5 py-0.5 rounded"
                            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
                          >
                            {inc.category}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            ✓ {inc.validation_count} validaciones
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {formatDate(inc.created_at)}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {inc.public_alias}
                          </span>
                        </div>

                        {/* Validate button */}
                        <div className="mt-3">
                          <ValidateButton
                            incidentId={inc.id}
                            incidentStatus={inc.status}
                            userLat={userLat}
                            userLng={userLng}
                            onValidated={(count, newStatus) =>
                              handleValidated(inc.id, count, newStatus)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
