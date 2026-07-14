"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import WeatherWidget from "../../components/WeatherWidget";
import AdminCharts from "../../components/AdminCharts";
import { useAuth } from "../../lib/auth";
import { api, type IncidentResponse } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", señalización: "🚦", áreas_verdes: "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Hace unos minutos";
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filtros interactivos
  const [filterCategory, setFilterCategory] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [filterPriority, setFilterPriority] = useState<string>("Todas");

  // Chatbot Assistant State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "¡Hola! Soy tu Asistente QHALI. Pregúntame sobre las reglas de Huancayo, validación (radio de 300m), duplicados (50m) o qué incidencias puedes reportar." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    
    // Convert current chatMessages to the history format expected by backend
    const history = chatMessages.map(msg => ({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.text
    }));

    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await api.chat(userMsg, history);
      setChatMessages((prev) => [...prev, { sender: "ai", text: res.response }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: "ai", text: "Error de conexión con la IA. Inténtalo más tarde." }]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    api.getPublicIncidents()
      .then(setIncidents)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
      
    if (user?.role === "admin") {
      setAiSummaryLoading(true);
      api.getAiSummary()
        .then(res => setAiSummary(res.summary))
        .catch(() => setAiSummary("No se pudo cargar el resumen de IA."))
        .finally(() => setAiSummaryLoading(false));
    }
  }, [user]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const [validatingId, setValidatingId] = useState<number | null>(null);

  async function handleLikeValidate(incId: number, lat: number, lng: number) {
    try {
      setValidatingId(incId);
      const res = await api.validateIncident(incId, lat, lng);
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incId
            ? { ...inc, validation_count: res.validation_count, status: res.status }
            : inc
        )
      );
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

  const aliasInitial = user?.alias_anonimo?.[0]?.toUpperCase() ?? "C";
  const isAdmin = user?.role === "admin";

  const totalActive = incidents.filter((i) => i.status !== "Resuelto").length;
  const totalResueltos = incidents.filter((i) => i.status === "Resuelto").length;
  const totalValidaciones = incidents.reduce((sum, i) => sum + (i.validation_count ?? 0), 0);
  
  const filteredIncidents = incidents.filter(inc => {
    if (filterCategory !== "Todas" && inc.category !== filterCategory) return false;
    if (filterStatus !== "Todos" && inc.status !== filterStatus) return false;
    if (filterPriority !== "Todas" && inc.ai_priority !== filterPriority) return false;
    return true;
  });
  
  const recentIncidents = filteredIncidents.slice(0, isAdmin ? 9 : 4);

  // Opciones únicas para filtros
  const uniqueCategories = Array.from(new Set(incidents.map(i => i.category))).sort();
  const uniqueStatuses = Array.from(new Set(incidents.map(i => i.status))).sort();
  const uniquePriorities = Array.from(new Set(incidents.map(i => i.ai_priority || "Baja"))).sort();

  // Calcular validaciones totales por usuario para definir ciudadanos confiables (>= 5 validaciones)
  const userValidationTotals = incidents.reduce((acc, inc) => {
    acc[inc.public_alias] = (acc[inc.public_alias] || 0) + (inc.validation_count || 0);
    return acc;
  }, {} as Record<string, number>);

  const isUserVerified = (alias: string) => {
    return (userValidationTotals[alias] ?? 0) >= 5;
  };

  const quickActions = [
    ...(!isAdmin ? [{
      href: "/report",
      label: "Nuevo reporte",
      sub: "Reportar incidencia",
      icon: "📋",
      bg: "var(--qhali-primary)",
      shadow: "var(--shadow-primary)",
    }] : []),
    {
      href: "/map",
      label: "Ver mapa",
      sub: "Incidencias cercanas",
      icon: "🗺️",
      bg: "var(--qhali-primary)",
      shadow: "var(--shadow-primary)",
    },
    {
      href: "/my-reports",
      label: "Mis reportes",
      sub: "Ver historial",
      icon: "📁",
      bg: "var(--qhali-primary)",
      shadow: "var(--shadow-primary)",
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/dashboard",
            label: "Dashboard",
            sub: "Panel admin",
            icon: "⚙️",
            bg: "var(--qhali-primary)",
            shadow: "var(--shadow-primary)",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 surface-header md:hidden">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--qhali-primary)" }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold brand-text leading-none">QHALI</h1>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Huancayo, Junín</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--qhali-primary)" }}
            >
              {aliasInitial}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        {/* Banner bienvenida */}
        <div
          className="p-6 animate-slide-up flex flex-col gap-5 border border-[var(--text-primary)] bg-white"
          style={{
            boxShadow: "var(--shadow-primary)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Bienvenido,</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                  {user?.alias_anonimo ?? "Ciudadano"}
                </h2>
                 {user?.alias_anonimo && isUserVerified(user.alias_anonimo) && (
                  <span 
                    title="Ciudadano Confiable: Tus reportes tienen alta aprobación por otros ciudadanos"
                    className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#2D3142] text-white border border-[#2D3142]"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    Confiable
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Reporta incidencias y ayuda a mejorar tu ciudad.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 border border-[var(--border)] p-4 self-start md:self-auto">
              {[
                { value: String(totalActive),      label: "Activos" },
                { value: String(totalResueltos),    label: "Resueltos" },
                { value: String(totalValidaciones), label: "Validaciones" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-1">
                  {i > 0 && <div className="w-px h-8 bg-gray-200 mx-2" />}
                  <div className="text-center">
                    <p className="text-lg font-black leading-none" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isAdmin ? (
            <WeatherWidget embedded={true} />
          ) : (
            <div className="pt-4 border-t border-[var(--border)]">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Resumen Ejecutivo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Por Estado */}
                <div className="p-3 bg-gray-50 border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2">Por Estado</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Pendientes:</span> <strong>{incidents.filter(i => i.status === "Pendiente").length}</strong></div>
                    <div className="flex justify-between"><span>En revisión:</span> <strong>{incidents.filter(i => i.status === "En revisión").length}</strong></div>
                    <div className="flex justify-between"><span>Confirmados:</span> <strong>{incidents.filter(i => i.status === "Confirmado").length}</strong></div>
                    <div className="flex justify-between"><span>Resueltos:</span> <strong>{incidents.filter(i => i.status === "Resuelto").length}</strong></div>
                  </div>
                </div>
                {/* Por Prioridad IA */}
                <div className="p-3 bg-gray-50 border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2">Por Prioridad (IA)</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-red-600"><span>Crítica:</span> <strong>{incidents.filter(i => i.ai_priority === "Crítica").length}</strong></div>
                    <div className="flex justify-between text-orange-600"><span>Alta:</span> <strong>{incidents.filter(i => i.ai_priority === "Alta").length}</strong></div>
                    <div className="flex justify-between text-blue-600"><span>Media:</span> <strong>{incidents.filter(i => i.ai_priority === "Media").length}</strong></div>
                    <div className="flex justify-between text-gray-600"><span>Baja:</span> <strong>{incidents.filter(i => i.ai_priority === "Baja").length}</strong></div>
                  </div>
                </div>
                {/* Top Categorías */}
                <div className="p-3 bg-gray-50 border border-[var(--border)] col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2">Top Categorías</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(incidents.reduce((acc, inc) => { acc[inc.category] = (acc[inc.category] || 0) + 1; return acc; }, {} as Record<string, number>))
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([cat, count]) => (
                        <div key={cat} className="flex justify-between capitalize">
                          <span>{CATEGORY_ICONS[cat]} {cat.replace("_", " ")}:</span> 
                          <strong>{count}</strong>
                        </div>
                      ))
                    }
                    {incidents.length === 0 && <div className="text-[var(--text-muted)] text-center py-2">Sin datos</div>}
                  </div>
                </div>
              </div>

              {/* Gráficos Recharts */}
              <AdminCharts incidents={incidents} />
            </div>
          )}
        </div>

        {/* AI Executive Summary Card (Only for Admin) */}
        {isAdmin && (
          <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <div className="bg-[#1A1D2D] text-white border border-[#1A1D2D] p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--qhali-primary)]">
                  Análisis de IA: Resumen Ejecutivo
                </h3>
              </div>
              {aiSummaryLoading ? (
                <div className="flex flex-col gap-2 py-2">
                  <div className="h-3 bg-white/10 animate-pulse rounded w-full"></div>
                  <div className="h-3 bg-white/10 animate-pulse rounded w-5/6"></div>
                  <div className="h-3 bg-white/10 animate-pulse rounded w-4/6"></div>
                </div>
              ) : (
                <div className="text-xs space-y-3 leading-relaxed text-gray-200">
                  {aiSummary ? (
                    aiSummary.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p>No hay resumen disponible.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Column */}
          <div className={`space-y-6 order-2 lg:order-1 ${isAdmin ? 'lg:col-span-3' : 'lg:col-span-2'}`}>

            {/* Incidencias recientes */}
            <div className="animate-slide-up" style={{ animationDelay: "0.12s" }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Incidencias recientes
                </h3>
                
                {/* Controles de Filtros */}
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="text-[10px] uppercase font-bold p-1.5 border border-[var(--border)] bg-white cursor-pointer outline-none focus:border-[var(--qhali-primary)] transition-colors"
                  >
                    <option value="Todas">Todas las categorías</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                  
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-[10px] uppercase font-bold p-1.5 border border-[var(--border)] bg-white cursor-pointer outline-none focus:border-[var(--qhali-primary)] transition-colors"
                  >
                    <option value="Todos">Todos los estados</option>
                    {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select 
                    value={filterPriority} 
                    onChange={e => setFilterPriority(e.target.value)}
                    className="text-[10px] uppercase font-bold p-1.5 border border-[var(--border)] bg-white cursor-pointer outline-none focus:border-[var(--qhali-primary)] transition-colors"
                  >
                    <option value="Todas">Cualquier prioridad</option>
                    {uniquePriorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <Link href="/map" className="text-xs font-bold shrink-0 hidden md:block" style={{ color: "var(--qhali-primary)" }}>
                  Ver mapa →
                </Link>
              </div>

              {statsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 h-16 animate-pulse border border-[var(--border)] bg-white"
                    />
                  ))}
                </div>
              ) : recentIncidents.length === 0 ? (
                <div className="text-center py-12 border border-[var(--border)] bg-white">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    No hay incidencias activas cerca.
                  </p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-4`}>
                  {recentIncidents.map((inc) => (
                    <Card key={inc.id} className="overflow-hidden border border-[var(--text-primary)] rounded-none flex flex-col justify-between bg-white">
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-black leading-none" style={{ color: "var(--text-primary)" }}>{inc.public_alias}</p>
                              {isUserVerified(inc.public_alias) && (
                                <span 
                                  title="Ciudadano Confiable: Alta tasa de reportes confirmados" 
                                  className="inline-flex items-center gap-0.5 text-[8px] font-extrabold uppercase px-1 py-0.5 bg-[#2D3142] text-white border border-[#2D3142]"
                                >
                                  <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                  </svg>
                                  Confiable
                                </span>
                              )}
                              {inc.ai_is_valid && (
                                <span 
                                  title="Pre-verificado por Inteligencia Artificial" 
                                  className="inline-flex items-center gap-0.5 text-[8px] font-extrabold uppercase px-1 py-0.5 bg-[#10B981] text-white border border-[#10B981]"
                                >
                                  ✨ IA OK
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>{formatRelativeDate(inc.created_at)}</p>
                          </div>
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>

                      {/* Post Image */}
                      {inc.image_url ? (
                        <div 
                          className="relative w-full bg-gray-50 border-b border-[var(--border)] overflow-hidden flex items-center justify-center"
                          style={{ minHeight: "180px", maxHeight: "300px" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={inc.image_url} 
                            alt="" 
                            className="w-full h-auto max-h-[300px] object-contain block" 
                          />
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
                              onClick={() => handleLikeValidate(inc.id, inc.latitude, inc.longitude)}
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

                        {inc.ai_priority && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--border-subtle)] mt-1.5">
                            <span 
                              className={`text-[8px] font-black uppercase px-1 py-0.5 border ${
                                inc.ai_priority === "Crítica" 
                                  ? "bg-red-50 text-red-600 border-red-200" 
                                  : inc.ai_priority === "Alta"
                                  ? "bg-orange-50 text-orange-600 border-orange-200"
                                  : inc.ai_priority === "Media"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              Prioridad IA: {inc.ai_priority}
                            </span>
                            {inc.ai_summary && (
                              <span className="text-[9px] font-bold text-[var(--text-muted)] italic">
                                "{inc.ai_summary}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column (1/3 width on desktop) */}
          {!isAdmin && (
            <div className="space-y-6 order-1 lg:order-2">

              {/* Acciones rápidas */}
              <div className="animate-slide-up" style={{ animationDelay: "0.06s" }}>
                <h3
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Acciones rápidas
                </h3>
                <div className={`grid gap-2 lg:grid-cols-1 ${quickActions.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                  {quickActions.map((a) => (
                    <Link key={a.href} href={a.href}>
                      <div
                        className="p-2 py-3 text-center lg:text-left flex flex-col lg:flex-row lg:items-center lg:gap-3 transition-all duration-150 active:scale-95 cursor-pointer border border-[var(--text-primary)] rounded-none bg-white h-full justify-center"
                        style={{
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        <div
                          className="w-8 h-8 mx-auto lg:mx-0 flex items-center justify-center text-lg mb-1 lg:mb-0 flex-shrink-0 text-white border border-[var(--text-primary)]"
                          style={{ background: a.bg }}
                        >
                          {a.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] md:text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                            {a.label}
                          </p>
                          <p className="text-[8px] md:text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {a.sub}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Floating Chat Widget (Asistente del Ciudadano) */}
      {!isAdmin && (
        <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end">
          {chatOpen ? (
            <div 
              className="w-80 h-96 border border-[var(--text-primary)] bg-white flex flex-col justify-between animate-slide-up mb-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Header */}
              <div className="bg-[#2D3142] text-white p-3 flex items-center justify-between border-b border-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Asistente QHALI</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-white hover:text-gray-300 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto space-y-2 bg-[var(--bg-primary)]">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] text-xs p-2 border ${
                        msg.sender === "user" 
                          ? "bg-[var(--qhali-primary-pale)] text-[var(--text-primary)] border-[var(--qhali-primary-light)]"
                          : "bg-white text-[var(--text-primary)] border-[var(--border)]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[var(--border)] text-xs p-2 flex items-center gap-1 text-[var(--text-muted)]">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="p-2 border-t border-[var(--border)] bg-white flex items-center gap-1.5">
                <input 
                  type="text"
                  placeholder="Escribe tu consulta aquí..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  className="flex-1 text-xs border border-[var(--border)] p-2 focus:outline-none focus:border-[var(--text-primary)]"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={chatLoading}
                  className="bg-[var(--qhali-primary)] hover:bg-[var(--qhali-primary-hover)] text-white text-xs font-bold py-2 px-3 border border-[var(--text-primary)]"
                >
                  Enviar
                </button>
              </div>
            </div>
          ) : null}

          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="w-12 h-12 bg-[var(--qhali-primary)] hover:bg-[var(--qhali-primary-hover)] border border-[var(--text-primary)] flex items-center justify-center text-xl transition-all duration-150 active:scale-90"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}
            title="Asistente de IA"
          >
            💬
          </button>
        </div>
      )}
    </div>
  );
}
