"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import Button from "../components/Button";
import Input from "../components/Input";

type Mode = "login" | "register";

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState<string | null>(null);

  const isRegister = mode === "register";

  function validate(): string | null {
    if (!email.trim()) return "El correo es obligatorio";
    if (!/\S+@\S+\.\S+/.test(email)) return "Correo inválido";
    if (!password) return "La contraseña es obligatoria";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (isRegister && password !== confirmPassword) return "Las contraseñas no coinciden";
    return null;
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    const ve = validate();
    if (ve) { setError(ve); return; }
    setSubmitting(true);
    try {
      if (isRegister) {
        const u = await register(email, password);
        setNewAlias(u.alias_anonimo);
        setTimeout(() => router.replace("/home"), 2200);
      } else {
        await login(email, password);
        router.replace("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al autenticar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--qhali-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>

      {/* Franja superior de color */}
      <div className="w-full h-2" style={{ background: "var(--qhali-primary)" }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">

        {/* Logo + nombre */}
        <div className="animate-slide-up mb-7 text-center w-full max-w-sm">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--qhali-primary)", boxShadow: "var(--shadow-primary)" }}
          >
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h1 className="text-3xl brand-text">QHALI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Reporte ciudadano · Huancayo, Junín
          </p>
        </div>

        {/* Tarjeta */}
        <div
          className="w-full max-w-sm rounded-2xl p-6 space-y-5 animate-slide-up"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
            animationDelay: "0.06s",
          }}
        >
          {/* Tabs login / registro */}
          <div
            className="flex rounded-lg p-1"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setNewAlias(null); setConfirmPassword(""); }}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-150"
                style={{
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? "var(--qhali-primary)" : "var(--text-muted)",
                  boxShadow: mode === m ? "var(--shadow-button)" : "none",
                }}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Alias asignado */}
          {newAlias && (
            <div
              className="rounded-xl px-4 py-4 text-center"
              style={{ background: "var(--qhali-primary-pale)", border: "1px solid var(--qhali-primary-light)" }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--qhali-primary)" }}>
                Tu alias anónimo asignado
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: "var(--qhali-primary)" }}>
                {newAlias}
              </p>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                Ingresando a tu cuenta...
              </p>
            </div>
          )}

          {!newAlias && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                }
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                }
              />

              {isRegister && (
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  }
                />
              )}

              {error && (
                <div
                  className="rounded-lg px-3 py-2.5 text-xs flex items-start gap-2"
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "var(--color-error)",
                  }}
                >
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" disabled={submitting} className="mt-1">
                {submitting
                  ? (isRegister ? "Creando cuenta..." : "Ingresando...")
                  : (isRegister ? "Crear cuenta" : "Ingresar")}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] mt-5 max-w-xs" style={{ color: "var(--text-muted)" }}>
          Al continuar aceptas los términos de servicio y política de privacidad de QHALI.
        </p>
      </div>
    </div>
  );
}
