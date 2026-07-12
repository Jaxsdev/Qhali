"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { api, type DuplicateCheckResponse } from "../../lib/api";

const ReportMapView = dynamic(() => import("../../components/ReportMapView"), { ssr: false });

const CATEGORIES = [
  { value: "bache",        label: "Bache",        icon: "🕳️" },
  { value: "alumbrado",    label: "Alumbrado",    icon: "💡" },
  { value: "basura",       label: "Basura",       icon: "🗑️" },
  { value: "agua",         label: "Agua",         icon: "💧" },
  { value: "alcantarillado", label: "Alcantarillado", icon: "🚰" },
  { value: "señalización", label: "Señalización", icon: "🚦" },
  { value: "áreas_verdes", label: "Áreas verdes", icon: "🌳" },
  { value: "ruido",        label: "Ruido",        icon: "🔊" },
  { value: "seguridad",    label: "Seguridad",    icon: "🔒" },
  { value: "otro",         label: "Otro",         icon: "📌" },
];

type GpsState = "idle" | "loading" | "ok" | "denied" | "error";

interface FormState {
  category: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
}

export default function ReportPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const [locMode, setLocMode] = useState<"gps" | "map">("gps");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResponse | null>(null);

  const [form, setForm] = useState<FormState>({
    category: "",
    description: "",
    imageFile: null,
    imagePreview: null,
    latitude: null,
    longitude: null,
    locationAccuracy: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── GPS ──────────────────────────────────────────────────────────────────
  function captureGps() {
    setGpsState("loading");
    setError(null);

    if (!navigator.geolocation) {
      setGpsState("error");
      setError("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({
          ...f,
          latitude: lat,
          longitude: lng,
          locationAccuracy: pos.coords.accuracy ?? null,
        }));
        setGpsState("ok");
        // Check for nearby duplicates — non-blocking warning only
        api.checkDuplicate(lat, lng, form.category)
          .then(setDuplicateWarning)
          .catch(() => {});
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsState("denied");
          setError("Permiso de ubicación denegado. Actívalo en la configuración del navegador.");
        } else {
          setGpsState("error");
          setError("No se pudo obtener la ubicación. Inténtalo de nuevo.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  // ── Imagen ───────────────────────────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: url }));
  }

  // ── Navegación de pasos ──────────────────────────────────────────────────
  function goBack() {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) { setStep(2); setDuplicateWarning(null); }
    else router.back();
  }

  function goToStep2() {
    if (!form.category) {
      setError("Selecciona una categoría para continuar.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function goToStep3() {
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres.");
      return;
    }
    if (!form.imageFile) {
      setError("Adjunta una fotografía del incidente.");
      return;
    }
    setError(null);
    setDuplicateWarning(null);
    setStep(3);
    captureGps();
  }

  // ── Envío ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (form.latitude === null || form.longitude === null) {
      setError("Necesitamos tu ubicación GPS para enviar el reporte.");
      return;
    }
    if (!form.imageFile) return;

    setError(null);
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("description", form.description.trim());
      fd.append("latitude", String(form.latitude));
      fd.append("longitude", String(form.longitude));
      if (form.locationAccuracy !== null) {
        fd.append("location_accuracy", String(form.locationAccuracy));
      }
      fd.append("image", form.imageFile);

      const result = await api.createIncident(fd);
      setIncidentId(result.id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: "var(--bg-primary)" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: "var(--qhali-primary-pale)" }}
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            style={{ color: "var(--qhali-primary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Reporte enviado correctamente
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          Tu reporte #{incidentId} fue registrado con estado
        </p>
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: "var(--qhali-primary-pale)", color: "var(--qhali-primary)" }}
        >
          Pendiente
        </span>
        <p className="text-xs mb-8 max-w-xs" style={{ color: "var(--text-muted)" }}>
          Las autoridades revisarán tu reporte. Otros ciudadanos podrán validarlo en el mapa.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            fullWidth
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setForm({ category: "", description: "", imageFile: null, imagePreview: null, latitude: null, longitude: null, locationAccuracy: null });
              setGpsState("idle");
            }}
          >
            Hacer otro reporte
          </Button>
          <Button variant="secondary" fullWidth onClick={() => router.replace("/home")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 surface-header">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Nuevo reporte</h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Paso {step} de 3</p>
          </div>
          {/* Indicador de pasos */}
          <div className="flex gap-1.5">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className="h-1.5 rounded-none transition-all duration-300"
                style={{
                  width: s === step ? 24 : 8,
                  background: s <= step ? "var(--qhali-primary)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">

        {/* ── Paso 1: Categoría ────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                ¿Qué tipo de incidencia?
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Selecciona la categoría que describe mejor el problema
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {CATEGORIES.map((cat) => {
                const active = form.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => { setForm((f) => ({ ...f, category: cat.value })); setError(null); }}
                    className="rounded-none p-4 text-center transition-all duration-150 active:scale-95 border"
                    style={{
                      background: active ? "var(--qhali-primary-pale)" : "var(--bg-card)",
                      borderColor: active ? "var(--text-primary)" : "var(--border)",
                      borderWidth: active ? "2px" : "1px",
                    }}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p
                      className="text-xs font-semibold mt-1.5"
                      style={{ color: active ? "var(--qhali-primary)" : "var(--text-primary)" }}
                    >
                      {cat.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {error && <ErrorBanner message={error} />}

            <Button fullWidth size="lg" disabled={!form.category} onClick={goToStep2}>
              Continuar
            </Button>
          </div>
        )}

        {/* ── Paso 2: Descripción + Imagen ─────────────────────────── */}
        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selectedCat?.icon}</span>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedCat?.label}
                </h2>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Describe el problema y adjunta una fotografía
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Description */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      Descripción
                    </label>
                    <span className="text-[10px]" style={{ color: form.description.length > 230 ? "var(--color-error)" : "var(--text-muted)" }}>
                      {form.description.length}/250
                    </span>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 250) }))}
                    placeholder="Ej: Bache profundo frente al colegio, lleva 2 semanas sin atención..."
                    rows={6}
                    className="w-full rounded-none text-sm px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-all duration-150"
                    style={{
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-primary)",
                      lineHeight: "1.5",
                    } as React.CSSProperties}
                  />
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Mínimo 10 caracteres
                  </p>
                </div>
              </div>

              {/* Right Column: Image */}
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />

                {form.imagePreview ? (
                  <div className="relative rounded-none overflow-hidden border border-[var(--text-primary)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imagePreview}
                      alt="Vista previa"
                      className="w-full object-cover max-h-64"
                    />
                    <button
                      onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: null }))}
                      className="absolute top-2 right-2 w-8 h-8 rounded-none flex items-center justify-center border border-white text-white"
                      style={{ background: "rgba(0,0,0,0.7)" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div
                      className="absolute bottom-2 left-2 text-[10px] px-2 py-1 font-bold border border-white"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                    >
                      Foto adjunta
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-none p-8 text-center transition-all duration-150 active:scale-[0.98] border border-dashed border-[var(--text-primary)] bg-white"
                  >
                    <div
                      className="w-12 h-12 mx-auto flex items-center justify-center mb-3 text-2xl border border-[var(--text-primary)]"
                      style={{ background: "var(--qhali-primary-pale)" }}
                    >
                      📷
                    </div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Adjuntar fotografía
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Toca para tomar foto o elegir de la galería
                    </p>
                  </button>
                )}
              </div>
            </div>

            {error && <ErrorBanner message={error} />}

            <Button fullWidth size="lg" onClick={goToStep3}>
              Continuar
            </Button>
          </div>
        )}

        {/* ── Paso 3: Ubicación GPS + Enviar ───────────────────────── */}
        {step === 3 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Ubicación del incidente
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Selecciona cómo deseas registrar la ubicación de la incidencia
              </p>
            </div>

            {/* Toggle ubicacion */}
            <div className="flex border border-[var(--text-primary)] rounded-none overflow-hidden max-w-md bg-white">
              <button
                onClick={() => {
                  setLocMode("gps");
                  setError(null);
                  captureGps();
                }}
                className="flex-1 text-xs font-bold py-2.5 text-center cursor-pointer transition-colors"
                style={{
                  background: locMode === "gps" ? "var(--text-primary)" : "transparent",
                  color: locMode === "gps" ? "#FFFFFF" : "var(--text-primary)",
                  border: "none",
                }}
              >
                📍 Mi ubicación (GPS)
              </button>
              <button
                onClick={() => {
                  setLocMode("map");
                  setError(null);
                }}
                className="flex-1 text-xs font-bold py-2.5 text-center cursor-pointer transition-colors"
                style={{
                  background: locMode === "map" ? "var(--text-primary)" : "transparent",
                  color: locMode === "map" ? "#FFFFFF" : "var(--text-primary)",
                  border: "none",
                }}
              >
                🗺️ Seleccionar en el mapa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: GPS info or Map */}
              <div className="space-y-4">
                
                {locMode === "gps" && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Estado GPS */}
                    <Card className="p-5 border border-[var(--text-primary)] rounded-none bg-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0 border border-[var(--text-primary)] bg-[var(--bg-primary)]"
                        >
                          📍
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {gpsState === "loading" && "Obteniendo ubicación..."}
                            {gpsState === "ok"      && "Ubicación obtenida"}
                            {gpsState === "denied"  && "Permiso denegado"}
                            {gpsState === "error"   && "Error de GPS"}
                            {gpsState === "idle"    && "GPS no iniciado"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div
                              className="w-2 h-2 rounded-none"
                              style={{
                                background: gpsState === "ok" ? "#22C55E"
                                  : gpsState === "loading" ? "var(--qhali-primary)"
                                  : gpsState === "denied" || gpsState === "error" ? "var(--color-error)"
                                  : "var(--border)",
                                ...(gpsState === "loading" || gpsState === "ok" ? { animation: "pulse 1.5s infinite" } : {}),
                              }}
                            />
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {gpsState === "loading" && "Solicitando permiso y posición..."}
                              {gpsState === "ok" && form.locationAccuracy !== null
                                ? `Precisión: ~${Math.round(form.locationAccuracy)} m`
                                : gpsState === "ok" ? "Posición confirmada" : ""}
                              {gpsState === "denied" && "Activa el permiso en el navegador"}
                              {gpsState === "error"  && "Inténtalo de nuevo"}
                              {gpsState === "idle"   && "Iniciando..."}
                            </span>
                          </div>
                        </div>
                        {(gpsState === "denied" || gpsState === "error") && (
                          <Button
                            onClick={() => { setError(null); captureGps(); }}
                            size="sm"
                          >
                            Reintentar
                          </Button>
                        )}
                      </div>

                      {form.latitude !== null && (
                        <div
                          className="grid grid-cols-2 gap-3 p-3 border border-[var(--text-primary)]"
                          style={{ background: "var(--bg-primary)" }}
                        >
                          <CoordField label="Latitud" value={form.latitude.toFixed(6)} />
                          <CoordField label="Longitud" value={form.longitude!.toFixed(6)} />
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {locMode === "map" && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Haz clic en el mapa para marcar el punto exacto donde ocurre la incidencia:
                    </p>
                    <ReportMapView
                      lat={form.latitude}
                      lng={form.longitude}
                      onSelect={(clickLat, clickLng) => {
                        setForm((f) => ({
                          ...f,
                          latitude: clickLat,
                          longitude: clickLng,
                          locationAccuracy: 1, // Alta precisión al ser manual
                        }));
                        api.checkDuplicate(clickLat, clickLng, form.category)
                          .then(setDuplicateWarning)
                          .catch(() => {});
                      }}
                    />
                    {form.latitude !== null && (
                      <div
                        className="grid grid-cols-2 gap-3 p-3 border border-[var(--text-primary)] bg-white"
                        style={{ background: "var(--bg-primary)" }}
                      >
                        <CoordField label="Latitud" value={form.latitude.toFixed(6)} />
                        <CoordField label="Longitud" value={form.longitude!.toFixed(6)} />
                      </div>
                    )}
                  </div>
                )}

                {duplicateWarning?.has_duplicates && (
                  <div
                    className="border border-[#FED7AA] px-3 py-3 text-xs"
                    style={{ background: "#FFF7ED", color: "#92400E" }}
                  >
                    <p className="font-bold mb-1">
                      Posible incidente duplicado
                    </p>
                    <p>
                      Ya existe {duplicateWarning.duplicates.length} reporte similar de esta categoría
                      a menos de 50 m. Puedes validarlo en &quot;Alertas&quot; o continuar si es un problema distinto.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Summary & Submit */}
              <div className="space-y-4">
                {/* Resumen del reporte */}
                <Card className="p-4 border border-[var(--text-primary)] rounded-none bg-white">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                    Resumen
                  </p>
                  <div className="space-y-2">
                    <SummaryRow icon={selectedCat?.icon ?? "📌"} label="Categoría" value={selectedCat?.label ?? ""} />
                    <SummaryRow
                      icon="📝"
                      label="Descripción"
                      value={form.description.length > 60 ? form.description.slice(0, 60) + "..." : form.description}
                    />
                    <SummaryRow icon="📷" label="Fotografía" value={form.imageFile ? "Adjunta" : "Sin foto"} />
                  </div>
                </Card>

                {error && <ErrorBanner message={error} />}

                <Button
                  fullWidth
                  size="lg"
                  disabled={submitting || form.latitude === null}
                  onClick={handleSubmit}
                >
                  {submitting ? "Enviando reporte..." : "Enviar reporte"}
                </Button>

                {form.latitude === null && gpsState !== "loading" && gpsState !== "denied" && (
                  <p className="text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Esperando ubicación GPS para habilitar el envío...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componentes auxiliares ───────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs flex items-start gap-2"
      style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "var(--color-error)" }}
    >
      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

function CoordField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-5 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}
