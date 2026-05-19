"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../lib/auth";

const recentIncidents = [
  { id: 1, title: "Bache peligroso en Av. Real", category: "bache", status: "pendiente" as const, time: "Hace 2h", validations: 3 },
  { id: 2, title: "Poste de luz apagado en Jr. Puno", category: "alumbrado", status: "confirmado" as const, time: "Hace 5h", validations: 7 },
  { id: 3, title: "Basura acumulada en Av. Giraldez", category: "basura", status: "en_revisión" as const, time: "Ayer", validations: 12 },
];

const categoryIcons: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", señalización: "🚦", áreas_verdes: "🌳",
  ruido: "🔊", seguridad: "🔒", otro: "📌",
};

const quickActions = [
  {
    href: "/report",
    label: "Nuevo reporte",
    sub: "Reportar incidencia",
    icon: "📋",
    bg: "var(--qhali-orange)",
    shadow: "0 4px 14px rgba(234,88,12,0.3)",
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
    bg: "#0F766E",
    shadow: "0 4px 14px rgba(15,118,110,0.3)",
  },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const aliasInitial = user?.alias_anonimo?.[0]?.toUpperCase() ?? "C";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 surface-header">
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
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
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

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Banner bienvenida */}
        <div
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            background: "linear-gradient(135deg, var(--qhali-primary) 0%, #0369A1 100%)",
            boxShadow: "var(--shadow-primary)",
          }}
        >
          <p className="text-sm text-white/80">Bienvenido,</p>
          <h2 className="text-xl font-bold text-white mt-0.5">
            {user?.alias_anonimo ?? "Ciudadano"}
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Reporta incidencias y ayuda a mejorar tu ciudad.
          </p>

          <div className="flex items-center gap-1 mt-4">
            {[
              { value: "24",  label: "Activos" },
              { value: "8",   label: "Resueltos" },
              { value: "156", label: "Validaciones" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-1">
                {i > 0 && <div className="w-px h-6 bg-white/20 mx-1" />}
                <div>
                  <p className="text-base font-bold text-white leading-none">{s.value}</p>
                  <p className="text-[10px] text-white/60">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="animate-slide-up" style={{ animationDelay: "0.06s" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href}>
                <div
                  className="rounded-xl p-3.5 text-center transition-all duration-150 active:scale-95"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div
                    className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-xl mb-2"
                    style={{ background: a.bg, boxShadow: a.shadow }}
                  >
                    {a.icon}
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                    {a.label}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {a.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Incidencias recientes */}
        <div className="animate-slide-up" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Incidencias recientes
            </h3>
            <Link href="/map" className="text-xs font-medium" style={{ color: "var(--qhali-primary)" }}>
              Ver mapa →
            </Link>
          </div>

          <div className="space-y-2">
            {recentIncidents.map((inc) => (
              <Card key={inc.id} hover className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
                  >
                    {categoryIcons[inc.category] ?? "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {inc.title}
                      </p>
                      <StatusBadge status={inc.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{inc.time}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        ✓ {inc.validations} validaciones
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
