"use client";

import React, { useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";

const categories = [
  { value: "bache", label: "Bache", icon: "🕳️" },
  { value: "alumbrado", label: "Alumbrado", icon: "💡" },
  { value: "basura", label: "Basura", icon: "🗑️" },
  { value: "agua", label: "Agua", icon: "💧" },
  { value: "alcantarillado", label: "Alcantarillado", icon: "🚰" },
  { value: "señalización", label: "Señalización", icon: "🚦" },
  { value: "áreas_verdes", label: "Áreas verdes", icon: "🌳" },
  { value: "ruido", label: "Ruido", icon: "🔊" },
  { value: "seguridad", label: "Seguridad", icon: "🔒" },
  { value: "otro", label: "Otro", icon: "📌" },
];

export default function ReportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen pb-4">
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => step > 1 && setStep(step - 1)} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-200">Nuevo reporte</h1>
            <p className="text-[10px] text-slate-500">Paso {step} de 3</p>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-1 rounded-full transition-colors ${s <= step ? "bg-emerald-500" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-6">
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-slide-up space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-200">¿Qué tipo de incidencia?</h2>
              <p className="text-xs text-slate-500 mt-1">Selecciona la categoría que mejor describe el problema</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Card
                  key={cat.value}
                  hover
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-4 text-center transition-all ${selectedCategory === cat.value ? "!border-emerald-500/50 !bg-emerald-500/10" : ""}`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-xs font-medium text-slate-300 mt-1.5">{cat.label}</p>
                </Card>
              ))}
            </div>
            <Button fullWidth size="lg" disabled={!selectedCategory} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Describe la incidencia</h2>
              <p className="text-xs text-slate-500 mt-1">Agrega detalles para que otros puedan identificarla</p>
            </div>
            <Input label="Título" placeholder="Ej: Bache peligroso en Av. Real" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Descripción</label>
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all min-h-[100px] resize-none"
                placeholder="Describe la incidencia con el mayor detalle posible..."
              />
            </div>
            {/* Photo upload area */}
            <Card className="p-6 text-center border-dashed !border-slate-600 hover:!border-emerald-500/40 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm font-medium text-slate-300">Agregar foto</p>
              <p className="text-[10px] text-slate-500 mt-1">Toca para tomar o seleccionar una foto</p>
            </Card>
            <Button fullWidth size="lg" onClick={() => setStep(3)}>Continuar</Button>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="animate-slide-up space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Ubicación</h2>
              <p className="text-xs text-slate-500 mt-1">Confirma la ubicación de la incidencia</p>
            </div>
            {/* Map placeholder */}
            <Card className="h-56 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-sm text-slate-400 font-medium">Mapa de ubicación</p>
                <p className="text-[10px] text-slate-500 mt-1">Se detectará tu GPS automáticamente</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  GPS activo — Precisión: ~10m
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitud" value="-12.0651" readOnly />
              <Input label="Longitud" value="-75.2049" readOnly />
            </div>
            <Button fullWidth size="lg" onClick={() => alert("¡Reporte enviado! (Demo Sprint 1)")}>
              Enviar reporte
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
