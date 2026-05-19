"use client";

import React, { useState } from "react";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";

const myReports = [
  { id: 1, title: "Bache peligroso en Av. Real", category: "bache", icon: "🕳️", status: "pendiente" as const, date: "15 May 2026", validations: 3 },
  { id: 2, title: "Basura acumulada en Jr. Piura", category: "basura", icon: "🗑️", status: "confirmado" as const, date: "14 May 2026", validations: 8 },
  { id: 3, title: "Semáforo dañado cruce Real", category: "señalización", icon: "🚦", status: "resuelto" as const, date: "10 May 2026", validations: 15 },
];

const tabs = ["Todos", "Pendientes", "Resueltos"];

export default function MyReportsPage() {
  const [activeTab, setActiveTab] = useState("Todos");

  const filteredReports = myReports.filter((r) => {
    if (activeTab === "Pendientes") return r.status === "pendiente" || r.status === "confirmado";
    if (activeTab === "Resueltos") return r.status === "resuelto";
    return true;
  });

  return (
    <div className="min-h-screen pb-4">
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-slate-200">Mis reportes</h1>
          <p className="text-[10px] text-slate-500">{myReports.length} reportes realizados</p>
        </div>
        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 animate-slide-up">
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{myReports.filter((r) => r.status === "pendiente").length}</p>
            <p className="text-[10px] text-slate-500">Pendientes</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{myReports.filter((r) => r.status === "confirmado").length}</p>
            <p className="text-[10px] text-slate-500">Confirmados</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-violet-400">{myReports.filter((r) => r.status === "resuelto").length}</p>
            <p className="text-[10px] text-slate-500">Resueltos</p>
          </Card>
        </div>

        {/* Reports List */}
        <div className="space-y-2">
          {filteredReports.map((report, i) => (
            <div key={report.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <Card hover className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl flex-shrink-0">
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-200 truncate">{report.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={report.status} />
                      <span className="text-[10px] text-slate-500">{report.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {report.validations} validaciones ciudadanas
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-slate-400">No hay reportes en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
