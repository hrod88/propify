import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Lock, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Propify',
  description: 'Cómo Propify recopila, usa y protege tus datos personales según la Ley 19.628.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: '#1e3a5f' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#1e3a5f' }}>Propify</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">

          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6" style={{ color: '#2563ae' }} />
            <p className="text-sm font-medium" style={{ color: '#2563ae' }}>Documento legal</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-400 mb-2">Última actualización: 3 de junio de 2026</p>
          <p className="text-sm text-gray-500 mb-10">
            Esta política cumple con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> de
            Chile y sus modificaciones vigentes.
          </p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
              <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                <p><strong>Propify</strong> — Plataforma de administración de edificios</p>
                <p>Email: <a href="mailto:privacidad@propify.cl" className="text-blue-600 hover:underline">privacidad@propify.cl</a></p>
                <p>Sitio web: <Link href="/" className="text-blue-600 hover:underline">propify-rust.vercel.app</Link></p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Datos que recopilamos</h2>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Datos del administrador</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre completo y correo electrónico</li>
                <li>Contraseña (almacenada con hash bcrypt — nunca en texto plano)</li>
                <li>Teléfono de contacto (opcional)</li>
                <li>Información bancaria del edificio (cuenta corriente, banco) — para liquidaciones PDF</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Datos del edificio</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre, dirección, RUT del edificio</li>
                <li>Número de unidades, pisos, información financiera mensual</li>
                <li>Egresos, proveedores, contratos</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Datos de residentes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre, correo electrónico, RUT (opcional), teléfono (opcional)</li>
                <li>Número de unidad y rol (propietario / arrendatario)</li>
                <li>Historial de pagos de gastos comunes</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.4 Datos operacionales</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Registro de visitas: nombre, RUT, fecha/hora de entrada</li>
                <li>Solicitudes de mantención, reservas de espacios comunes</li>
                <li>Publicaciones en el muro comunitario, encuestas y votaciones</li>
                <li>Registros de acceso biométrico (si el edificio tiene terminal compatible)</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.5 Datos técnicos</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dirección IP y tipo de navegador (registros de acceso del servidor)</li>
                <li>Cookies de sesión necesarias para la autenticación</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
              <p>Utilizamos sus datos exclusivamente para:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Prestar el Servicio:</strong> gestionar su edificio, generar liquidaciones, controlar accesos.</li>
                <li><strong>Comunicaciones del Servicio:</strong> notificaciones sobre pagos, mantenciones, alertas relevantes.</li>
                <li><strong>Facturación:</strong> procesar el cobro de la suscripción contratada.</li>
                <li><strong>Seguridad:</strong> detectar accesos no autorizados y prevenir fraudes.</li>
                <li><strong>Mejora del Servicio:</strong> análisis agregados y anónimos de uso de la plataforma.</li>
              </ul>
              <p className="mt-3 font-medium text-gray-800">
                No vendemos, arrendamos ni compartimos sus datos personales con terceros para fines de
                marketing.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Dónde se almacenan sus datos</h2>
              <p>
                Los datos son almacenados en <strong>Supabase</strong> (PostgreSQL), con servidores ubicados en
                la región <strong>South America (São Paulo, Brasil)</strong>. Supabase cumple con estándares
                internacionales de seguridad (SOC 2 Type II, ISO 27001).
              </p>
              <p className="mt-2">
                La transmisión de datos se realiza siempre mediante <strong>HTTPS/TLS 1.3</strong>.
              </p>
              <p className="mt-2">
                Para pagos de suscripción, utilizamos <strong>Stripe, Inc.</strong> (certificado PCI DSS Level 1).
                Propify nunca almacena datos de tarjetas de crédito directamente.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Tiempo de retención</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Cuenta activa:</strong> los datos se conservan mientras la cuenta esté activa.</li>
                <li><strong>Tras cancelación:</strong> los datos se eliminan de sistemas activos en 30 días y de backups en 90 días.</li>
                <li><strong>Registros contables:</strong> los documentos financieros (liquidaciones, pagos) pueden conservarse hasta 6 años conforme a la normativa tributaria chilena, aunque la cuenta esté cancelada.</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Sus derechos (Ley 19.628)</h2>
              <p>Como titular de datos personales en Chile, usted tiene derecho a:</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { t: 'Acceso', d: 'Solicitar qué datos suyos tenemos almacenados.' },
                  { t: 'Rectificación', d: 'Corregir datos inexactos o incompletos.' },
                  { t: 'Cancelación', d: 'Solicitar la eliminación de sus datos.' },
                  { t: 'Oposición', d: 'Oponerse al tratamiento en ciertos casos.' },
                ].map(({ t, d }) => (
                  <div key={t} className="p-3 bg-blue-50 rounded-xl">
                    <p className="font-semibold text-blue-800 text-xs uppercase tracking-wide mb-1">{t}</p>
                    <p className="text-xs text-blue-700">{d}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                Para ejercer cualquiera de estos derechos, escríbanos a{' '}
                <a href="mailto:privacidad@propify.cl" className="text-blue-600 hover:underline font-medium">
                  privacidad@propify.cl
                </a>{' '}
                indicando su nombre, correo registrado y la solicitud específica. Responderemos en un plazo
                máximo de <strong>10 días hábiles</strong>.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h2>
              <p>
                Propify utiliza únicamente <strong>cookies estrictamente necesarias</strong> para mantener su
                sesión iniciada. No utilizamos cookies de publicidad, seguimiento o análisis de terceros.
              </p>
              <p className="mt-2">
                Las cookies de sesión se eliminan al cerrar el navegador o al hacer clic en "Cerrar sesión".
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Seguridad</h2>
              <p>Aplicamos las siguientes medidas técnicas y organizativas:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Contraseñas almacenadas con bcrypt (hash irreversible).</li>
                <li>Autenticación y autorización gestionadas por Supabase Auth.</li>
                <li>Row Level Security (RLS) en base de datos: cada administrador solo accede a los datos de su edificio.</li>
                <li>Comunicaciones cifradas con TLS 1.3.</li>
                <li>Backups automáticos diarios en Supabase.</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Menores de edad</h2>
              <p>
                El Servicio está destinado a mayores de 18 años. No recopilamos intencionalmente datos
                personales de menores. Si detecta que un menor ha proporcionado datos sin autorización,
                contáctenos para eliminarlos inmediatamente.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Cambios a esta política</h2>
              <p>
                Podemos actualizar esta Política en cualquier momento. Los cambios relevantes serán
                notificados por correo electrónico o mediante aviso en la plataforma. La versión vigente
                siempre estará disponible en{' '}
                <Link href="/privacidad" className="text-blue-600 hover:underline">propify-rust.vercel.app/privacidad</Link>.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contacto</h2>
              <div className="p-4 bg-gray-50 rounded-xl space-y-1 text-sm">
                <p>Para consultas de privacidad: <a href="mailto:privacidad@propify.cl" className="text-blue-600 hover:underline">privacidad@propify.cl</a></p>
                <p>Para soporte técnico: <a href="mailto:soporte@propify.cl" className="text-blue-600 hover:underline">soporte@propify.cl</a></p>
              </div>
            </section>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/terminos" className="text-blue-600 hover:underline">Términos de Uso</Link>
            <Link href="/" className="text-gray-400 hover:text-gray-600">Volver al inicio</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 Propify · Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  )
}
