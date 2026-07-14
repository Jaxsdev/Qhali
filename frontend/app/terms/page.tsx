import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Minimalista */}
      <div className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link href="/login" className="flex items-center text-sm font-medium transition-colors" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
          <div className="flex-1 text-center font-bold brand-text text-lg pr-12">
            QHALI
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>Términos y Condiciones de Uso</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Última actualización: Julio 2026</p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>1. Naturaleza de la Plataforma</h2>
            <p>
              QHALI es una plataforma digital de participación ciudadana diseñada para facilitar el reporte de incidencias urbanas en la ciudad de Huancayo, Junín. QHALI actúa <strong>exclusivamente como un puente de comunicación y visibilización</strong> de problemas públicos (tales como baches, acumulación de basura, problemas de alumbrado, etc.).
            </p>
            <p className="mt-2 font-medium" style={{ color: "var(--text-primary)" }}>
              Limitación de Responsabilidad: Los creadores, administradores y desarrolladores de QHALI NO son una entidad gubernamental ni municipal. Por lo tanto, no asumen ninguna responsabilidad, obligación legal ni garantía de solucionar, reparar o atender las incidencias reportadas en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>2. Privacidad y Protección de Identidad (Anonimato)</h2>
            <p>
              Para promover la denuncia ciudadana libre y proteger a los usuarios de posibles represalias, QHALI utiliza un estricto sistema de anonimato. 
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>No se requieren ni se muestran nombres reales en la aplicación.</li>
              <li>Al registrarse, el sistema le asigna un <strong>Alias Anónimo</strong> único (ej. <code>Vecino_A3HS</code>).</li>
              <li>Este alias será su única identidad visible al crear reportes, comentar o validar incidencias.</li>
            </ul>
            <p className="mt-2">
              Aunque la identidad es anónima frente a otros usuarios, el usuario acepta que los administradores de la plataforma conservan datos técnicos básicos para evitar abusos o spam en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>3. Responsabilidad del Contenido y Reportes</h2>
            <p>
              El usuario es el único y exclusivo responsable legal de la información, descripciones y fotografías que suba a la plataforma. Al utilizar QHALI, usted se compromete a <strong>NO</strong> publicar:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Información falsa, engañosa o fabricada.</li>
              <li>Fotografías de propiedad privada (interiores de casas, negocios) sin consentimiento.</li>
              <li>Rostros de personas, placas de vehículos o datos personales identificables (la app fomenta enfocar el problema urbano, no a las personas).</li>
              <li>Contenido difamatorio, obsceno, discriminatorio o que incite al odio.</li>
            </ul>
            <p className="mt-2 text-sm italic">
              El incumplimiento de estas reglas resultará en la eliminación del reporte y la posible suspensión del alias y/o dispositivo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>4. Moderación por Inteligencia Artificial</h2>
            <p>
              QHALI integra sistemas de Inteligencia Artificial para el análisis de texto y categorización de reportes. El usuario acepta que sus reportes (texto y metadatos) serán procesados por algoritmos para evaluar su prioridad y legitimidad.
            </p>
            <p className="mt-2">
              La plataforma se reserva el derecho de ocultar, rechazar o modificar automáticamente reportes que la IA clasifique como spam, ofensivos o no relacionados al propósito cívico de la aplicación, sin necesidad de previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>5. Geolocalización (GPS)</h2>
            <p>
              Para garantizar que los reportes correspondan a problemas reales en tiempo real, QHALI requiere acceso a la ubicación GPS de su dispositivo única y exclusivamente en el momento exacto en que se envía un reporte o se valida uno existente. La plataforma <strong>no rastrea</strong> su ubicación en segundo plano ni guarda su historial de movimientos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>6. Exención de Daños y Perjuicios</h2>
            <p>
              El usuario acepta utilizar QHALI bajo su propio riesgo. Los desarrolladores de QHALI se eximen de cualquier daño material, inmaterial, lucro cesante o consecuencia legal derivada del uso de la aplicación, la exposición de los reportes, o la interacción con otros ciudadanos en la plataforma.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>
            Al registrar una cuenta en QHALI, usted acepta estos términos en su totalidad.
          </p>
          <Link href="/login" className="inline-block mt-4 px-6 py-2 rounded-lg font-bold text-white transition-opacity hover:opacity-90" style={{ background: "var(--qhali-primary)" }}>
            Acepto los Términos (Volver)
          </Link>
        </div>
      </div>
    </div>
  );
}
