"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../lib/auth";
import { api, type IncidentResponse } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", señalización: "🚦", áreas_verdes: "🌳",
  ruido: "🔊", seguridad: "🔒", otro: "📌",
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

  useEffect(() => {
    api.getPublicIncidents()
      .then(setIncidents)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

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
  const recentIncidents = incidents.slice(0, 3);

  const quickActions = [
    {
      href: "/report",
      label: "Nuevo reporte",
      sub: "Reportar incidencia",
      icon: "📋",
      bg: "var(--qhali-primary)",
      shadow: "var(--shadow-primary)",
    },
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

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">

        {/* Banner bienvenida */}
        <div
          className="p-6 animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--text-primary)] bg-white"
          style={{
            boxShadow: "var(--shadow-primary)",
          }}
        >
          <div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Bienvenido,</p>
            <h2 className="text-2xl font-black mt-0.5" style={{ color: "var(--text-primary)" }}>
              {user?.alias_anonimo ?? "Ciudadano"}
            </h2>
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

        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

            {/* Incidencias recientes */}
            <div className="animate-slide-up" style={{ animationDelay: "0.12s" }}>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Incidencias recientes
                </h3>
                <Link href="/map" className="text-xs font-bold" style={{ color: "var(--qhali-primary)" }}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <p className="text-xs font-black leading-none" style={{ color: "var(--text-primary)" }}>{inc.public_alias}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{formatRelativeDate(inc.created_at)}</p>
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
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column (1/3 width on desktop) */}
          <div className="space-y-6 order-1 lg:order-2">

            {/* Acciones rápidas */}
            <div className="animate-slide-up" style={{ animationDelay: "0.06s" }}>
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Acciones rápidas
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {quickActions.map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div
                      className="p-4 text-center lg:text-left flex flex-col lg:flex-row lg:items-center lg:gap-4 transition-all duration-150 active:scale-95 cursor-pointer border border-[var(--text-primary)] rounded-none bg-white"
                      style={{
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div
                        className="w-10 h-10 mx-auto lg:mx-0 flex items-center justify-center text-xl mb-2 lg:mb-0 flex-shrink-0 text-white border border-[var(--text-primary)]"
                        style={{ background: a.bg }}
                      >
                        {a.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                          {a.label}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {a.sub}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
