"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { IncidentResponse } from "../lib/api";

interface MapViewProps {
  incidents: IncidentResponse[];
  onSelect: (incident: IncidentResponse) => void;
  selectedId: number | null;
  viewMode?: "points" | "heatmap";
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:     "#9CA3AF",
  confirmado:    "#EF4444",
  "en_revisión": "#3B82F6",
  resuelto:      "#22C55E",
};

function normalizeStatus(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

function pinHtml(color: string, selected: boolean): string {
  const size = selected ? 32 : 24;
  const border = selected ? 4 : 3;
  return `<div style="
    width:${size}px;height:${size}px;
    border-radius:50%;
    background:${color};
    border:${border}px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    transition:all 0.15s;
    cursor:pointer;
  "></div>`;
}

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

const STATUS_MAPPINGS: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:    { bg: "var(--status-pending-bg, #FEF3C7)", text: "var(--status-pending-text, #92400E)", label: "Pendiente" },
  confirmado:   { bg: "var(--status-confirmed-bg, #DCFCE7)", text: "var(--status-confirmed-text, #166534)", label: "Confirmado" },
  en_revisión:  { bg: "var(--status-review-bg, #E0F2FE)", text: "var(--status-review-text, #075985)", label: "En revisión" },
  resuelto:     { bg: "var(--status-resolved-bg, #EDE9FE)", text: "var(--status-resolved-text, #4C1D95)", label: "Resuelto" },
};

export default function MapView({ incidents, onSelect, selectedId, viewMode = "points" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const markersRef = useRef<Map<number, ReturnType<typeof import("leaflet")["marker"]>>>(new Map());
  const heatLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Configurar Leaflet.heat inyectando el script si no existe
    if (typeof window !== "undefined") {
      (window as any).L = L;
      if (!document.getElementById("leaflet-heat-script")) {
        const script = document.createElement("script");
        script.id = "leaflet-heat-script";
        script.src = "https://unpkg.com/leaflet.heat/dist/leaflet-heat.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    const map = L.map(containerRef.current, {
      center: [-12.065, -75.204],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (viewMode === "heatmap") {
      const heatData = incidents.map(inc => [inc.latitude, inc.longitude, 1]);
      if (typeof (L as any).heatLayer === 'function') {
        heatLayerRef.current = (L as any).heatLayer(heatData, {
          radius: 30,
          blur: 20,
          maxZoom: 15,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(mapRef.current);
      }
      return;
    }

    incidents.forEach((inc) => {
      const key = normalizeStatus(inc.status);
        const color = STATUS_COLORS[key] ?? "#9CA3AF";
        const isSelected = inc.id === selectedId;

        const icon = L.divIcon({
          className: "",
          html: pinHtml(color, isSelected),
          iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
          iconAnchor: [isSelected ? 16 : 12, isSelected ? 16 : 12],
        });

        const categoryEmoji = CATEGORY_ICONS[inc.category] ?? "📌";
        const statusMap = STATUS_MAPPINGS[key] ?? { bg: "#F3F4F6", text: "#374151", label: inc.status };

        const marker = L.marker([inc.latitude, inc.longitude], { icon })
          .addTo(mapRef.current!)
          .on("click", () => onSelect(inc));

        markersRef.current.set(inc.id, marker);
      });

    if (selectedId && mapRef.current) {
       const selectedInc = incidents.find(i => i.id === selectedId);
       if (selectedInc) {
          mapRef.current.setView([selectedInc.latitude, selectedInc.longitude], 16, { animate: true });
       }
    }

  }, [mapReady, incidents, onSelect, selectedId, viewMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    />
  );
}
