"use client";

import { useEffect, useRef, useState } from "react";
import type { IncidentResponse } from "../lib/api";

interface MapViewProps {
  incidents: IncidentResponse[];
  onSelect: (incident: IncidentResponse) => void;
  selectedId: number | null;
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
  ruido: "🔊", seguridad: "🔒", otro: "📌",
};

const STATUS_MAPPINGS: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:    { bg: "var(--status-pending-bg, #FEF3C7)", text: "var(--status-pending-text, #92400E)", label: "Pendiente" },
  confirmado:   { bg: "var(--status-confirmed-bg, #DCFCE7)", text: "var(--status-confirmed-text, #166534)", label: "Confirmado" },
  en_revisión:  { bg: "var(--status-review-bg, #E0F2FE)", text: "var(--status-review-text, #075985)", label: "En revisión" },
  resuelto:     { bg: "var(--status-resolved-bg, #EDE9FE)", text: "var(--status-resolved-text, #4C1D95)", label: "Resuelto" },
};

export default function MapView({ incidents, onSelect, selectedId }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const markersRef = useRef<Map<number, ReturnType<typeof import("leaflet")["marker"]>>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let alive = true;

    import("leaflet").then((L) => {
      if (!alive || !containerRef.current || mapRef.current) return;

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
        if (alive && mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      alive = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

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

        const imageHtml = inc.image_url ? `
          <div style="margin-top: 8px; margin-bottom: 8px; border-radius: 8px; overflow: hidden; height: 90px; width: 100%;">
            <img src="${inc.image_url}" alt="Foto del reporte" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : '';

        const popupHtml = `
          <div style="
            font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
            min-width: 210px;
            max-width: 260px;
            color: var(--text-primary, #0F172A);
            padding: 2px;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 13px; text-transform: capitalize; color: var(--text-primary);">
                ${categoryEmoji} ${inc.category}
              </span>
              <span style="
                font-size: 9px;
                font-weight: 600;
                padding: 1.5px 6px;
                border-radius: 9999px;
                background-color: ${statusMap.bg};
                color: ${statusMap.text};
                border: 1px solid rgba(0,0,0,0.05);
              ">
                ${statusMap.label}
              </span>
            </div>
            
            <p style="
              font-size: 11.5px;
              color: var(--text-secondary, #334155);
              margin: 0 0 6px 0;
              line-height: 1.35;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">
              ${inc.description}
            </p>
            
            ${imageHtml}
            
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 9.5px;
              color: var(--text-muted, #64748B);
              border-top: 1px solid var(--border-subtle, #E2E8F0);
              padding-top: 6px;
              margin-top: 6px;
            ">
              <span style="font-weight: 500;">✓ ${inc.validation_count} validaciones</span>
              <span>${new Date(inc.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
            </div>
          </div>
        `;

        const marker = L.marker([inc.latitude, inc.longitude], { icon })
          .addTo(mapRef.current!)
          .bindPopup(popupHtml, {
            closeButton: false,
            offset: [0, -8],
          })
          .on("click", () => onSelect(inc));

        markersRef.current.set(inc.id, marker);
      });

      // Auto open popup for selected marker
      if (selectedId) {
        const selectedMarker = markersRef.current.get(selectedId);
        if (selectedMarker) {
          selectedMarker.openPopup();
        }
      }
    });
  }, [mapReady, incidents, onSelect, selectedId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    />
  );
}
