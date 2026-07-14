"use client";

import { useState } from "react";

interface WeatherDay {
  day: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
  rainProb: number;
  risk: string;
}

const HUANCAYO_FORECAST: WeatherDay[] = [
  { day: "Lun", tempMax: 18, tempMin: 6, condition: "Nublado con lluvias", icon: "🌧️", rainProb: 75, risk: "Riesgo de encharcamiento en Av. Huancavelica." },
  { day: "Mar", tempMax: 19, tempMin: 5, condition: "Parcialmente nublado", icon: "⛅", rainProb: 20, risk: "Clima favorable para reparaciones de baches." },
  { day: "Mié", tempMax: 17, tempMin: 7, condition: "Lluvia intensa", icon: "⛈️", rainProb: 90, risk: "Alerta por posibles inundaciones en zonas bajas." },
  { day: "Jue", tempMax: 18, tempMin: 6, condition: "Intervalos soleados", icon: "🌤️", rainProb: 15, risk: "Buen día para reportar señalizaciones desgastadas." },
  { day: "Vie", tempMax: 20, tempMin: 4, condition: "Despejado", icon: "☀️", rainProb: 5, risk: "Bajo riesgo de incidencias climatológicas." },
  { day: "Sáb", tempMax: 17, tempMin: 8, condition: "Llovizna", icon: "🌦️", rainProb: 60, risk: "Superficies resbaladizas, precaución al transitar." },
  { day: "Dom", tempMax: 16, tempMin: 7, condition: "Tormenta eléctrica", icon: "⚡", rainProb: 85, risk: "Evitar zonas con cableado expuesto o árboles altos." }
];

export default function WeatherWidget({ embedded = false }: { embedded?: boolean }) {
  const [selectedDay, setSelectedDay] = useState<WeatherDay>(HUANCAYO_FORECAST[0]);

  return (
    <div 
      className={`relative overflow-hidden animate-slide-up ${
        embedded ? "pt-4 border-t border-[var(--border)]" : "p-5 border border-[var(--text-primary)] bg-white"
      }`}
      style={{
        boxShadow: embedded ? "none" : "var(--shadow-card)",
      }}
    >
      {/* Decorative dots background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FF6B35_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Clima en Huancayo
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase bg-[var(--qhali-primary-pale)] text-[var(--qhali-primary)] border border-[var(--qhali-primary-light)] px-2 py-0.5">
            Sierra Central
          </span>
        </div>

        {/* Current / Selected Day Hero Details */}
        <div className="flex items-center justify-between p-2.5 bg-[var(--bg-primary)] border border-[var(--text-primary)]">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Pronóstico ({selectedDay.day})
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[var(--text-primary)]">{selectedDay.tempMax}°C</span>
              <span className="text-xs font-bold text-[var(--text-muted)]">/ {selectedDay.tempMin}°C</span>
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>{selectedDay.icon}</span>
              <span>{selectedDay.condition}</span>
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1 bg-white border border-[var(--border)] px-2 py-1">
              <span className="text-xs">💧</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{selectedDay.rainProb}% Lluvia</span>
            </div>
          </div>
        </div>



        {/* Weekly Slider / Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {HUANCAYO_FORECAST.map((day) => {
            const isSelected = selectedDay.day === day.day;
            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day)}
                className={`py-1 px-0.5 text-center transition-all border duration-100 flex flex-col items-center justify-between cursor-pointer ${
                  isSelected
                    ? "border-[var(--text-primary)] bg-[var(--qhali-primary)] text-white"
                    : "border-[var(--border)] bg-white hover:bg-[var(--bg-primary)] text-[var(--text-primary)]"
                }`}
              >
                <span className={`text-[9px] font-bold ${isSelected ? "text-white" : "text-[var(--text-muted)]"}`}>
                  {day.day}
                </span>
                <span className="text-sm my-0.5">{day.icon}</span>
                <span className="text-[9px] font-black">{day.tempMax}°</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
