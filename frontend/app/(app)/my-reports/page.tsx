"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../lib/auth";
import { api, type IncidentResponse } from "../../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  bache: "🕳️", alumbrado: "💡", basura: "🗑️", agua: "💧",
  alcantarillado: "🚰", "señalización": "🚦", "áreas_verdes": "🌳",
  ruido: "🔊", seguridad: "🔒", robos: "🚨", otro: "📌",
};

const TABS = ["Todos", "En proceso", "Resueltos"] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS = ["Pendiente", "Confirmado", "En revisión"];
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
  confirmado: { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" },
  "en_revisión": { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #BFDBFE" },
  resuelto: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function normalizeStatus(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

function AdminStatusSelect({ incidentId, currentStatus, onStatusChanged }: { incidentId: number; currentStatus: string; onStatusChanged: (id: number, status: string) => void }) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    setSaving(true);
    try {
      await api.updateIncidentStatus(incidentId, newStatus);
      onStatusChanged(incidentId, newStatus);
    } catch (err) {
      alert("Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  const key = normalizeStatus(currentStatus);
  const styleBase = STATUS_STYLE[key] ?? {};

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      className="text-xs font-bold rounded-lg px-2 py-1 cursor-pointer outline-none transition-opacity"
      style={{ ...styleBase, opacity: saving ? 0.5 : 1, border: styleBase.border }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

export default function MyReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Resolution Flow State
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Evidence Modal State
  const [viewingEvidence, setViewingEvidence] = useState<{url: string, comment: string} | null>(null);

  async function handleLikeValidate(incId: number, lat: number, lng: number) {
    try {
      setValidatingId(incId);
      const res = await api.validateIncident(incId, lat, lng);
      setReports((prev) =>
        prev.map((inc) =>
          inc.id === incId
            ? { ...inc, validation_count: res.validation_count, status: res.status }
            : inc
        )
      );
    } catch (err: any) {
      alert(err.message || "Error al validar");
    } finally {
      setValidatingId(null);
    }
  }

  async function handleDeleteIncident(id: number) {
    if (!confirm("¿Seguro que deseas eliminar este incidente permanentemente?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("qhali_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/incidents/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  async function submitResolution(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvingId || !resolutionFile || resolutionComment.length < 5) return;
    setIsResolving(true);
    try {
      const fd = new FormData();
      fd.append("image", resolutionFile);
      fd.append("comment", resolutionComment);
      const updated = await api.resolveIncident(resolvingId, fd);
      setReports((prev) => prev.map((r) => r.id === resolvingId ? { ...r, ...updated } : r));
      setResolvingId(null);
      setResolutionComment("");
      setResolutionFile(null);
    } catch (err: any) {
      alert(err.message || "Error al resolver incidente");
    } finally {
      setIsResolving(false);
    }
  }

  function handleStatusChanged(id: number, newStatus: string) {
    setReports((prev) => prev.map((inc) => inc.id === id ? { ...inc, status: newStatus } : inc));
  }

  function handleShareWhatsApp(id: number, category: string, description: string) {
    const text = `🚨 *QHALI — Reporte Ciudadano* 🚨\n\n*Categoría:* #${category}\n*Detalle:* ${description}\n\nAyúdanos a confirmar este reporte para alertar a las autoridades. Consúltalo aquí:\n${window.location.origin}/post/${id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  useEffect(() => {
    let isMounted = true;
    function fetchReports() {
      // Si es administrador, vemos TODOS los reportes (getAdminIncidents)
      // Si es ciudadano, solo vemos sus propios reportes (getMyIncidents)
      const fetcher = isAdmin ? api.getAdminIncidents() : api.getMyIncidents();
      
      fetcher
        .then(data => { if (isMounted) setReports(data); })
        .catch((e: Error) => { if (isMounted) setError(e.message); })
        .finally(() => { if (isMounted) setLoading(false); });
    }
    
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [isAdmin]);

  const dateFiltered = reports.filter((r) => {
    if (!selectedDate) return true;
    const d = new Date(r.created_at);
    const rDateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
    return rDateStr === selectedDate;
  });

  const filtered = dateFiltered.filter((r) => {
    const s = normalizeStatus(r.status);
    if (activeTab === "En proceso") return s === "pendiente" || s === "confirmado" || s === "en_revisión";
    if (activeTab === "Resueltos") return s === "resuelto";
    return true;
  });

  const countPending  = dateFiltered.filter((r) => normalizeStatus(r.status) === "pendiente").length;
  const countReview   = dateFiltered.filter((r) => normalizeStatus(r.status) === "confirmado" || normalizeStatus(r.status) === "en_revisión").length;
  const countResolved = dateFiltered.filter((r) => normalizeStatus(r.status) === "resuelto").length;

  return (
    <div className="min-h-screen pb-6" style={{ background: "var(--bg-primary)" }}>

      {/* Header + Tabs */}
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-2">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {isAdmin ? "Historial de Reportes" : "Mis reportes"}
          </h1>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {loading ? "Cargando…" : `${filtered.length} reportes encontrados`}
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer border"
                style={
                  activeTab === tab
                    ? {
                        background: "var(--qhali-primary-pale)",
                        color: "var(--qhali-primary)",
                        borderColor: "var(--qhali-primary-light)",
                      }
                    : {
                        color: "var(--text-muted)",
                        borderColor: "transparent",
                        background: "transparent",
                      }
                }
              >
                {tab}
              </button>
            ))}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label htmlFor="calendarFilter" className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                Filtrar por fecha:
              </label>
              <input 
                id="calendarFilter"
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs p-1.5 border outline-none bg-white font-bold"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate("")}
                  className="text-xs hover:underline cursor-pointer"
                  style={{ color: "var(--qhali-primary)" }}
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-4">

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-warning)" }}>{countPending}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pendientes</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--qhali-primary)" }}>{countReview}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>En proceso</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-success)" }}>{countResolved}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Resueltos</p>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--qhali-primary-pale)", borderTopColor: "var(--qhali-primary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando reportes…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              No se pudieron cargar tus reportes
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        )}

        {/* Reports list */}
        {!loading && !error && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px" }}>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>No hay reportes en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((report, i) => (
                  <div key={report.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <Card 
                      className="overflow-hidden border border-[var(--text-primary)] rounded-none flex flex-col justify-between bg-white h-full"
                      onClick={() => router.push(`/map?incidentId=${report.id}`)}
                      hover={true}
                    >
                      {/* Post Header */}
                      <div className="p-3 flex items-center justify-between border-b border-[var(--border)]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold border border-[var(--text-primary)]"
                            style={{ background: "var(--qhali-primary)" }}
                          >
                            {report.public_alias?.[0]?.toUpperCase() ?? "C"}
                          </div>
                          <div>
                            <p className="text-xs font-black leading-none" style={{ color: "var(--text-primary)" }}>{report.public_alias}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                        </div>
                        {isAdmin ? (
                          <AdminStatusSelect 
                            incidentId={report.id} 
                            currentStatus={report.status} 
                            onStatusChanged={handleStatusChanged} 
                          />
                        ) : (
                          <StatusBadge status={report.status} />
                        )}
                      </div>

                      {/* Post Image */}
                      {report.image_url ? (
                        <div 
                          className="relative w-full h-48 bg-gray-100 flex-shrink-0 border-b border-[var(--border)] cursor-pointer overflow-hidden"
                          onClick={(e) => { e.stopPropagation(); setZoomedImage(report.image_url); }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={report.image_url} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform" />
                        </div>
                      ) : (
                        <div className="w-full h-48 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] border-b border-[var(--border)] relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B35_1px,transparent_1px)] [background-size:16px_16px]" />
                          <span className="text-5xl z-10">{CATEGORY_ICONS[report.category] ?? "📌"}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest mt-2 z-10 text-[var(--text-muted)]">#{report.category}</span>
                        </div>
                      )}

                      {/* Interaction Bar & Caption */}
                      <div className="p-3 space-y-2">
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteIncident(report.id); }}
                              disabled={deletingId === report.id}
                              className="flex items-center gap-1.5 text-xs font-bold hover:text-[var(--color-error)] transition-colors cursor-pointer group"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <span className="text-base group-hover:scale-125 transition-transform duration-100">
                                {deletingId === report.id ? "⏳" : "🗑️"}
                              </span>
                              <span>Eliminar</span>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(report.id, report.category, report.description); }}
                              className="flex items-center gap-1.5 text-xs font-bold hover:text-[#25D366] transition-colors cursor-pointer group"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <span className="text-base group-hover:scale-125 transition-transform duration-100">
                                💬
                              </span>
                              <span>Compartir</span>
                            </button>
                          </div>

                          <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                            ✓ {report.validation_count} validaciones
                          </span>
                        </div>

                        {/* Admin Resolve / Citizen View Evidence Buttons */}
                        {isAdmin && report.status !== "Resuelto" && (
                          <div className="pt-2 border-t border-[var(--border-subtle)] mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setResolvingId(report.id); }}
                              className="w-full py-1.5 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors"
                            >
                              ✅ Resolver Incidente
                            </button>
                          </div>
                        )}
                        {report.status === "Resuelto" && report.resolution_image_url && (
                          <div className="pt-2 border-t border-[var(--border-subtle)] mt-2">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setViewingEvidence({ url: report.resolution_image_url!, comment: report.resolution_comment || "" }); 
                              }}
                              className="w-full py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              🔍 Ver evidencia de resolución
                            </button>
                          </div>
                        )}

                        {/* Caption */}
                        <p className="text-xs leading-normal" style={{ color: "var(--text-primary)" }}>
                          <span className="font-black mr-1.5">{report.public_alias}</span>
                          {report.description}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-zoom-out p-4"
          onClick={() => setZoomedImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={zoomedImage} 
            alt="Ampliación" 
            className="max-w-full max-h-[90vh] object-contain rounded-sm"
          />
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--qhali-primary)] text-white p-4 font-bold flex justify-between items-center">
              <span>Resolver Incidente</span>
              <button onClick={() => setResolvingId(null)} className="text-white hover:opacity-75">✕</button>
            </div>
            <form onSubmit={submitResolution} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--text-primary)]">Foto de Evidencia (Requerido)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  required
                  onChange={(e) => setResolutionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--text-primary)]">Descripción de la Solución (Requerido)</label>
                <textarea 
                  required
                  rows={3}
                  minLength={5}
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                  placeholder="Explica brevemente cómo se resolvió..."
                  className="w-full border border-[var(--border)] rounded p-2 text-xs outline-none focus:border-[var(--qhali-primary)]"
                />
              </div>
              <button 
                type="submit" 
                disabled={isResolving || !resolutionFile || resolutionComment.length < 5}
                className="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isResolving ? "Guardando..." : "Confirmar Resolución"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Evidence View Modal */}
      {viewingEvidence && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 cursor-pointer"
          onClick={() => setViewingEvidence(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-600 text-white p-4 font-bold flex justify-between items-center">
              <span>Evidencia de Resolución</span>
              <button onClick={() => setViewingEvidence(null)} className="text-white hover:opacity-75">✕</button>
            </div>
            <div className="p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewingEvidence.url} alt="Evidencia" className="w-full h-auto max-h-[50vh] object-contain bg-gray-100" />
            </div>
            <div className="p-4 bg-gray-50 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                <span className="font-bold block mb-1">Comentario del Administrador:</span>
                "{viewingEvidence.comment}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
