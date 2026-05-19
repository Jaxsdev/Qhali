"use client";

import "leaflet/dist/leaflet.css";
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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
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

        const marker = L.marker([inc.latitude, inc.longitude], { icon })
          .addTo(mapRef.current!)
          .on("click", () => onSelect(inc));

        markersRef.current.set(inc.id, marker);
      });
    });
  }, [mapReady, incidents, onSelect, selectedId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    />
  );
}
