"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "../../../components/Card";
import StatusBadge from "../../../components/StatusBadge";
import Button from "../../../components/Button";
import { api, type IncidentResponse } from "../../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getProfile().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api.getIncident(id as string)
      .then(setIncident)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLikeValidate() {
    if (!incident) return;
    try {
      setValidating(true);
      const res = await api.validateIncident(incident.id, incident.latitude, incident.longitude);
      setIncident((prev) => prev ? { ...prev, validation_count: res.validation_count, status: res.status } : null);
    } catch (err: any) {
      alert(err.message || "Error al validar");
    } finally {
      setValidating(false);
    }
  }

  async function handleDelete() {
    if (!incident) return;
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte?")) return;
    try {
      setDeleting(true);
      await api.deleteIncident(incident.id);
      router.replace("/home");
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  function handleShareWhatsApp() {
    if (!incident) return;
    const text = `🚨 *QHALI — Reporte Ciudadano* 🚨\n\n*Categoría:* #${incident.category}\n*Detalle:* ${incident.description}\n\nAyúdanos a confirmar este reporte para alertar a las autoridades. Consúltalo aquí:\n${window.location.origin}/post/${incident.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center transition-colors border border-[var(--text-primary)] bg-white cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Detalle del Reporte</h1>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-6">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-none border border-t-transparent border-[var(--text-primary)] animate-spin"
              style={{ borderTopColor: "var(--qhali-primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando detalles del reporte…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 border border-[var(--text-primary)] bg-white p-6">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              No se pudo cargar el reporte
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
            <Button onClick={() => router.replace("/home")}>Volver al Inicio</Button>
          </div>
        )}

        {incident && (
          <div className="animate-slide-up space-y-4">
            <Card className="overflow-hidden border border-[var(--text-primary)] rounded-none flex flex-col bg-white">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 flex items-center justify-center text-white text-sm font-bold border border-[var(--text-primary)]"
                    style={{ background: "var(--qhali-primary)" }}
                  >
                    {incident.public_alias?.[0]?.toUpperCase() ?? "C"}
                  </div>
                  <div>
                    <p className="text-sm font-black leading-none" style={{ color: "var(--text-primary)" }}>{incident.public_alias}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatDate(incident.created_at)}
                      {incident.address && ` • 📍 ${incident.address}`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={incident.status} />
              </div>

              {/* Post Image */}
              {incident.image_url ? (
                <div className="relative w-full h-80 bg-gray-100 flex-shrink-0 border-b border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={incident.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-64 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] border-b border-[var(--border)] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B35_1px,transparent_1px)] [background-size:16px_16px]" />
                  <span className="text-6xl z-10">{CATEGORY_ICONS[incident.category] ?? "📌"}</span>
                  <span className="text-xs uppercase font-bold tracking-widest mt-2 z-10 text-[var(--text-muted)]">#{incident.category}</span>
                </div>
              )}

              {/* Interaction Bar & Caption */}
              <div className="p-4 space-y-3">
                {/* Actions */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-4">
                    {user && incident && (incident.public_alias === user.alias_anonimo || user.role === "admin") ? (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 text-sm font-bold hover:text-[var(--color-error)] transition-colors cursor-pointer group"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span className="text-base group-hover:scale-125 transition-transform duration-100">
                          {deleting ? "⏳" : "🗑️"}
                        </span>
                        <span>Eliminar reporte</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleLikeValidate}
                        disabled={validating}
                        className="flex items-center gap-1.5 text-sm font-bold hover:text-[var(--qhali-primary)] transition-colors cursor-pointer group"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span className="text-base group-hover:scale-125 transition-transform duration-100">
                          {validating ? "⏳" : "🧡"}
                        </span>
                        <span>Validar reporte</span>
                      </button>
                    )}

                    <button
                      onClick={handleShareWhatsApp}
                      className="flex items-center gap-1.5 text-sm font-bold hover:text-[#25D366] transition-colors cursor-pointer group"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="text-base group-hover:scale-125 transition-transform duration-100">
                        💬
                      </span>
                      <span>Compartir</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    ✓ {incident.validation_count} validaciones
                  </span>
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    <span className="font-black mr-2">{incident.public_alias}</span>
                    {incident.description}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Map preview link */}
            <Link href={`/map?selected=${incident.id}`} className="block">
              <Button variant="secondary" fullWidth>
                🗺️ Ver ubicación en el mapa
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
