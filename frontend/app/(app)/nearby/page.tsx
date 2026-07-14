"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import ValidateButton from "../../components/ValidateButton";
import { api, type NearbyIncidentItem } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
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

  // Forum State
  const [forumIncident, setForumIncident] = useState<NearbyIncidentItem | null>(null);
  const [forumComments, setForumComments] = useState<import("../../lib/api").CommentResponse[]>([]);
  const [forumLoading, setForumLoading] = useState(false);
  const [forumInput, setForumInput] = useState("");
  const [forumError, setForumError] = useState<string | null>(null);

  async function openForum(inc: NearbyIncidentItem) {
    setForumIncident(inc);
    setForumLoading(true);
    setForumError(null);
    try {
      const comments = await api.getComments(inc.id);
      setForumComments(comments);
    } catch (e: any) {
      setForumError(e.message || "Error al cargar el foro.");
    } finally {
      setForumLoading(false);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!forumInput.trim() || !forumIncident || !userLat || !userLng) return;
    try {
      setForumError(null);
      const newComment = await api.postComment(forumIncident.id, forumInput, userLat, userLng);
      setForumComments([...forumComments, newComment]);
      setForumInput("");
    } catch (err: any) {
      setForumError(err.message || "Error al enviar mensaje.");
    }
  }

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

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        {/* Banner (Desktop) */}
        <div
          className="p-6 animate-slide-up hidden md:flex flex-col gap-5 border border-[var(--text-primary)] bg-white"
          style={{
            boxShadow: "var(--shadow-primary)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--qhali-primary)]">Tu barrio en vivo</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                  Alertas Cercanas
                </h2>
                <span className="text-2xl">🗺️</span>
              </div>
              <p className="text-xs mt-2 max-w-xl" style={{ color: "var(--text-muted)" }}>
                Descubre, valida y discute los incidentes reportados por tus vecinos en tiempo real. 
                Solo mostramos reportes dentro de tu zona permitida.
              </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-center px-6 py-2 border-l border-gray-200">
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Radio</p>
                 <p className="text-lg font-black text-[var(--qhali-primary)]">300m</p>
               </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
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
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start w-full">
                {/* Left Column: Feed */}
                <div className="flex-1 w-full grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {incidents.map((inc, i) => (
                      <div key={inc.id} className="animate-slide-up w-full" style={{ animationDelay: `${i * 0.05}s` }}>
                        <Card className="overflow-hidden border border-[var(--text-primary)] rounded-none flex flex-col justify-between bg-white h-full">
                          {/* Post Header */}
                          <div className="p-3 flex items-center justify-between border-b border-[var(--text-primary)]">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold border border-[var(--text-primary)]"
                                style={{ background: "var(--qhali-primary)" }}
                              >
                                {inc.public_alias?.[0]?.toUpperCase() ?? "C"}
                              </div>
                              <div>
                                <p className="text-xs font-bold leading-none" style={{ color: "var(--text-primary)" }}>{inc.public_alias}</p>
                                <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  📍 {formatDistance(inc.distance_meters)} • {formatDate(inc.created_at)}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={inc.status} size="sm" />
                          </div>

                          {/* Post Image */}
                          {inc.image_url ? (
                            <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 border-b border-[var(--text-primary)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={inc.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-48 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] border-b border-[var(--text-primary)] relative overflow-hidden">
                              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B35_1px,transparent_1px)] [background-size:16px_16px]" />
                              <span className="text-5xl z-10">{CATEGORY_ICONS[inc.category] ?? "📌"}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest mt-2 z-10 text-[var(--text-muted)]">#{inc.category}</span>
                            </div>
                          )}

                          {/* Interaction Bar & Caption */}
                          <div className="p-4 space-y-3">
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

                                <button
                                  onClick={() => openForum(inc)}
                                  className="flex items-center gap-1.5 text-xs font-bold hover:text-blue-500 transition-colors cursor-pointer group"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  <span className="text-base group-hover:scale-125 transition-transform duration-100">
                                    🗣️
                                  </span>
                                  <span>Foro</span>
                                </button>
                              </div>

                              <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                                ✓ {inc.validation_count} val.
                              </span>
                            </div>

                            {/* Caption */}
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              <span className="font-bold mr-1.5" style={{ color: "var(--text-primary)" }}>{inc.public_alias}</span>
                              {inc.description}
                            </p>
                          </div>
                        </Card>
                      </div>
                    ))}
                </div>

                {/* Right Column: Side Panel */}
                <div className="hidden lg:block lg:w-80 flex-shrink-0 sticky top-6 space-y-6">
                  {/* Stats Box */}
                  <div className="bg-white p-6 rounded-none border border-[var(--text-primary)] shadow-sm">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Estadísticas de tu zona</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)]">
                        <span className="text-xs font-medium text-[var(--text-muted)]">Radio actual</span>
                        <span className="text-xs font-bold px-2.5 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-none">300 m</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)]">
                        <span className="text-xs font-medium text-[var(--text-muted)]">Alertas pendientes</span>
                        <span className="text-2xl font-black text-[var(--qhali-primary)]">{pendingCount}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-[var(--text-muted)] mb-1">Problema principal</span>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--text-primary)]">
                            <span className="text-xl">{incidents.length > 0 ? CATEGORY_ICONS[incidents[0].category] ?? "📌" : "📌"}</span>
                          </div>
                          <span className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>{incidents.length > 0 ? incidents[0].category : "Ninguno"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Alert */}
                  {incidents.length > 0 && (
                    <div className="bg-white p-1.5 rounded-none border border-[var(--text-primary)] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-red-500 animate-pulse text-lg">🔴</span>
                          <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">Alerta más crítica</h3>
                        </div>
                        
                        {(() => {
                          const topIncident = [...incidents].sort((a, b) => b.validation_count - a.validation_count)[0];
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{CATEGORY_ICONS[topIncident.category] ?? "📌"}</span>
                                <p className="text-sm font-bold capitalize text-[var(--text-primary)]">{topIncident.category}</p>
                              </div>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">{topIncident.description}</p>
                              <div className="pt-2">
                                <button 
                                  onClick={() => handleShareWhatsApp(topIncident.id, topIncident.category, topIncident.description)}
                                  className="w-full py-3 rounded-none text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                  style={{ background: "#25D366", color: "white", boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)" }}
                                >
                                  <span className="text-base">💬</span>
                                  Alertar por WhatsApp
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Forum Modal */}
      {forumIncident && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "var(--bg-primary)" }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Foro Vecinal</h3>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>#{forumIncident.category} • {formatDistance(forumIncident.distance_meters)}</p>
              </div>
              <button 
                onClick={() => setForumIncident(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {forumLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-6 h-6 border-2 border-t-transparent border-[var(--qhali-primary)] rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-400">Cargando comentarios...</span>
                </div>
              ) : forumComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                  <span className="text-4xl">💬</span>
                  <span className="text-xs font-medium">Sé el primero en comentar</span>
                </div>
              ) : (
                forumComments.map(c => (
                  <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-slide-up">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{c.public_alias}</span>
                      <span className="text-[9px] text-gray-400">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {forumError && (
                <div className="mb-2 p-2 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">
                  {forumError}
                </div>
              )}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={forumInput}
                  onChange={(e) => setForumInput(e.target.value)}
                  className="flex-1 bg-gray-100 border-none text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--qhali-primary-pale)]"
                />
                <button
                  type="submit"
                  disabled={!forumInput.trim()}
                  className="bg-[var(--qhali-primary)] text-white font-bold text-xs px-4 rounded-xl disabled:opacity-50 transition-opacity"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
