"use client";

import { useEffect, useRef } from "react";

if (typeof window !== "undefined" && Element.prototype.releasePointerCapture) {
  const originalRelease = Element.prototype.releasePointerCapture;
  Element.prototype.releasePointerCapture = function (pointerId) {
    try {
      originalRelease.call(this, pointerId);
    } catch (e) {
      // Evitar error de DOM cuando el puntero ya no es activo
    }
  };
}

interface ReportMapViewProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
}

export default function ReportMapView({ lat, lng, onSelect }: ReportMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Helper to construct custom SVG pointing pin icon
  const getPinIcon = (L: any) => {
    return L.divIcon({
      className: "custom-select-pin",
      html: `
        <div style="width: 32px; height: 42px; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.3));">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16 24.84 0 16 0ZM16 22C12.68 22 10 19.32 10 16C10 12.68 12.68 10 16 10C19.32 10 22 12.68 22 16C22 19.32 19.32 22 16 22Z" fill="#FF6B35" stroke="#000000" stroke-width="2"/>
            <circle cx="16" cy="16" r="4.5" fill="white" />
          </svg>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });
  };

  useEffect(() => {
    let active = true;
    if (!containerRef.current || mapRef.current || (containerRef.current as any)._leaflet_id) return;

    import("leaflet").then((L) => {
      if (!active || !containerRef.current || mapRef.current || (containerRef.current as any)._leaflet_id) return;

      // Default to Huancayo center
      const defaultCenter: [number, number] = [-12.06513, -75.20486];
      const initialCenter: [number, number] = lat && lng ? [lat, lng] : defaultCenter;

      const map = L.map(containerRef.current!).setView(initialCenter, 14);
      mapRef.current = map;

      // CartoDB Positron tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const selectIcon = getPinIcon(L);

      // Create update position helper for dragging
      const handleMarkerPositionChange = (position: any) => {
        onSelect(position.lat, position.lng);
      };

      // Add marker if location exists
      if (lat && lng) {
        const marker = L.marker([lat, lng], { icon: selectIcon, draggable: true }).addTo(map);
        marker.on("dragend", (e: any) => {
          handleMarkerPositionChange(e.target.getLatLng());
        });
        markerRef.current = marker;
      }

      // Click listener to select coordinates
      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        onSelect(clickLat, clickLng);

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          const marker = L.marker(e.latlng, { icon: selectIcon, draggable: true }).addTo(map);
          marker.on("dragend", (evt: any) => {
            handleMarkerPositionChange(evt.target.getLatLng());
          });
          markerRef.current = marker;
        }
      });
    });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [onSelect]);

  // Update marker position if coordinates change from GPS/external (but avoid trigger feedback loops during drag)
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    import("leaflet").then((L) => {
      const latlng: [number, number] = [lat, lng];
      const selectIcon = getPinIcon(L);

      if (markerRef.current) {
        const currentPos = markerRef.current.getLatLng();
        // Only update if difference is meaningful to prevent jumpiness on drag
        if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
          markerRef.current.setLatLng(latlng);
        }
      } else {
        const marker = L.marker(latlng, { icon: selectIcon, draggable: true }).addTo(mapRef.current);
        marker.on("dragend", (e: any) => {
          onSelect(e.target.getLatLng().lat, e.target.getLatLng().lng);
        });
        markerRef.current = marker;
      }
    });
  }, [lat, lng, onSelect]);

  return (
    <div
      ref={containerRef}
      className="w-full h-64 border border-[var(--text-primary)]"
      style={{ background: "#f0f0f0" }}
    />
  );
}
