"use client";

import React, { useState } from "react";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";

const sampleIncidents = [
  { id: 1, title: "Bache en Av. Real", category: "bache", icon: "🕳️", status: "pendiente" as const, lat: -12.0651, lng: -75.2049 },
  { id: 2, title: "Poste apagado Jr. Puno", category: "alumbrado", icon: "💡", status: "confirmado" as const, lat: -12.0660, lng: -75.2045 },
  { id: 3, title: "Basura Av. Giraldez", category: "basura", icon: "🗑️", status: "en_revisión" as const, lat: -12.0643, lng: -75.2055 },
  { id: 4, title: "Fuga de agua Calle Real", category: "agua", icon: "💧", status: "en_revisión" as const, lat: -12.0670, lng: -75.2040 },
  { id: 5, title: "Alcantarilla Jr. Amazonas", category: "alcantarillado", icon: "🚰", status: "pendiente" as const, lat: -12.0635, lng: -75.2060 },
];

export default function MapPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = sampleIncidents.find((i) => i.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-slate-200">Mapa de incidencias</h1>
          <p className="text-[10px] text-slate-500">Huancayo — {sampleIncidents.length} incidencias activas</p>
        </div>
      </header>

      {/* Map placeholder */}
      <div className="flex-1 relative bg-slate-800/50 min-h-[400px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-slate-400 font-medium">Mapa interactivo</p>
            <p className="text-xs text-slate-500 mt-1">Se integrará con Leaflet/Mapbox en Sprint 4</p>
          </div>
        </div>

        {/* Simulated markers */}
        <div className="absolute inset-0 pointer-events-none">
          {sampleIncidents.map((inc, i) => (
            <button
              key={inc.id}
              onClick={() => setSelectedId(inc.id)}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform cursor-pointer"
              style={{ top: `${25 + i * 12}%`, left: `${20 + i * 15}%` }}
              title={inc.title}
            >
              <div className="w-10 h-10 rounded-full bg-slate-900/80 border-2 border-emerald-500/50 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
                {inc.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Selected incident card */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto animate-slide-up">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl flex-shrink-0">
                  {selected.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{selected.title}</h3>
                    <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300">✕</button>
                  </div>
                  <StatusBadge status={selected.status} />
                  <p className="text-[10px] text-slate-500 mt-2">
                    📍 {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="glass-strong px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {["Todos", "🕳️ Baches", "💡 Alumbrado", "🗑️ Basura", "💧 Agua"].map((filter) => (
            <button
              key={filter}
              className="flex-shrink-0 text-[10px] font-medium px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
