"use client";

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import type { IncidentResponse } from '../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  bache: "#A0522D", alumbrado: "#FFD700", basura: "#8B4513", agua: "#00BFFF",
  alcantarillado: "#708090", señalización: "#FF4500", áreas_verdes: "#32CD32",
  ruido: "#9932CC", seguridad: "#DC143C", robos: "#800000", otro: "#808080",
};

const PRIORITY_COLORS: Record<string, string> = {
  "Crítica": "#DC2626", // red-600
  "Alta": "#EA580C", // orange-600
  "Media": "#2563EB", // blue-600
  "Baja": "#4B5563", // gray-600
};

export default function AdminCharts({ incidents }: { incidents: IncidentResponse[] }) {
  // Aggregate category data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      counts[inc.category] = (counts[inc.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace("_", " "), value, key: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [incidents]);

  // Aggregate priority data
  const priorityData = useMemo(() => {
    const counts = { "Crítica": 0, "Alta": 0, "Media": 0, "Baja": 0 };
    incidents.forEach(inc => {
      if (inc.ai_priority && inc.ai_priority in counts) {
        counts[inc.ai_priority as keyof typeof counts]++;
      } else {
        counts["Baja"]++; // Default or Unassigned
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  if (incidents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Gráfico de Barras: Top Categorías */}
      <div className="p-4 bg-white border border-[var(--border)]" style={{ boxShadow: "var(--shadow-card)" }}>
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Top 5 Categorías Reportadas
        </h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.key] || "#CBD5E1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Circular: Prioridad IA */}
      <div className="p-4 bg-white border border-[var(--border)]" style={{ boxShadow: "var(--shadow-card)" }}>
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Distribución por Prioridad (IA)
        </h4>
        <div className="h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Leyenda manual rápida al lado derecho */}
          <div className="flex flex-col justify-center ml-4 space-y-2">
            {priorityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }}></div>
                <span className="text-[10px] font-bold text-[var(--text-primary)]">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
