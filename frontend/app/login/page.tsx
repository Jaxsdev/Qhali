"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-sky-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Logo ── */}
      <div className="animate-slide-up mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold gradient-text">QHALI</h1>
        <p className="text-slate-400 text-sm mt-2">
          Reporte ciudadano de incidencias urbanas
        </p>
      </div>

      {/* ── Form Card ── */}
      <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-200">
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister
                ? "Regístrate para reportar incidencias"
                : "Ingresa para continuar"}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            {isRegister && (
              <Input
                label="Alias anónimo"
                type="text"
                placeholder="Ej: CiudadanoHyo23"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
              />
            )}

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              }
            />
          </div>

          <Link href="/home">
            <Button fullWidth size="lg" className="mt-2">
              {isRegister ? "Crear cuenta" : "Ingresar"}
            </Button>
          </Link>

          <div className="text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isRegister
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-slate-600 mt-6">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </div>
  );
}
