"use client";

import React from "react";
import Link from "next/link";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";

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

export default function HomePage() {
  return (
    <div className="min-h-screen pb-4">
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold gradient-text">QHALI</h1>
            <p className="text-[10px] text-slate-500">Huancayo, Junín</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">C</div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-6 mt-4">
        {/* Welcome Banner */}
        <div className="animate-slide-up">
          <Card className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              <p className="text-sm text-slate-400">¡Hola, Ciudadano! 👋</p>
              <h2 className="text-xl font-bold mt-1">Tu ciudad, <span className="gradient-text">tu voz</span></h2>
              <p className="text-xs text-slate-500 mt-2">Reporta incidencias urbanas y ayuda a mejorar Huancayo.</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">24</p>
                  <p className="text-[10px] text-slate-500">Activos</p>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div className="text-center">
                  <p className="text-lg font-bold text-sky-400">8</p>
                  <p className="text-[10px] text-slate-500">Resueltos</p>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div className="text-center">
                  <p className="text-lg font-bold text-violet-400">156</p>
                  <p className="text-[10px] text-slate-500">Validaciones</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/report", label: "Reportar", icon: "➕", color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
              { href: "/map", label: "Mapa", icon: "🗺️", color: "from-sky-500 to-blue-500", shadow: "shadow-sky-500/20" },
              { href: "/my-reports", label: "Historial", icon: "📋", color: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <Card hover className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl shadow-lg ${a.shadow} mb-2`}>
                    {a.icon}
                  </div>
                  <p className="text-xs font-semibold text-slate-200">{a.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Incidencias recientes</h3>
            <Link href="/map" className="text-[10px] text-emerald-400 hover:text-emerald-300">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {recentIncidents.map((inc) => (
              <Card key={inc.id} hover className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-lg flex-shrink-0">
                    {categoryIcons[inc.category] || "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-slate-200 truncate">{inc.title}</h4>
                      <StatusBadge status={inc.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-500">{inc.time}</span>
                      <span className="text-[10px] text-slate-500">✓ {inc.validations} validaciones</span>
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
