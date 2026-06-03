import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Shield, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos de Uso — Propify',
  description: 'Condiciones de uso de la plataforma Propify para administración de edificios y condominios.',
}

export default function TerminosPage() {
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
            <Shield className="w-6 h-6" style={{ color: '#2563ae' }} />
            <p className="text-sm font-medium" style={{ color: '#2563ae' }}>Documento legal</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de Uso</h1>
          <p className="text-sm text-gray-400 mb-10">Última actualización: 3 de junio de 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Aceptación de los términos</h2>
              <p>
                Al registrarse y utilizar la plataforma <strong>Propify</strong> (en adelante, "el Servicio"),
                usted acepta quedar vinculado por los presentes Términos de Uso. Si no está de acuerdo con estos
                términos, no debe utilizar el Servicio.
              </p>
              <p className="mt-2">
                El uso del Servicio está sujeto también a nuestra{' '}
                <Link href="/privacidad" className="text-blue-600 hover:underline font-medium">Política de Privacidad</Link>,
                incorporada por referencia.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
              <p>
                Propify es una plataforma de software como servicio (SaaS) para la administración de edificios y
                condominios en Chile. Permite gestionar gastos comunes, residentes, visitas, mantenimientos,
                comunicaciones, y otros aspectos de la operación de una copropiedad inmobiliaria.
              </p>
              <p className="mt-2">
                El Servicio está diseñado para cumplir con las disposiciones de la{' '}
                <strong>Ley N° 21.442 de Copropiedad Inmobiliaria</strong> vigente desde 2022.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Registro y cuenta de usuario</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Para acceder al Servicio debe crear una cuenta con datos verídicos y actualizados.</li>
                <li>Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades realizadas bajo su cuenta.</li>
                <li>Debe notificarnos inmediatamente ante cualquier uso no autorizado de su cuenta a través de{' '}
                  <a href="mailto:contacto@propify.cl" className="text-blue-600 hover:underline">contacto@propify.cl</a>.
                </li>
                <li>Cada cuenta de administrador puede gestionar uno o más edificios según el plan contratado.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Uso aceptable</h2>
              <p>Usted se compromete a:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Usar el Servicio únicamente para administrar copropiedades inmobiliarias legítimas.</li>
                <li>No introducir datos falsos, fraudulentos o que induzcan a error a otros usuarios.</li>
                <li>No intentar acceder a datos de otros edificios o usuarios.</li>
                <li>No realizar ingeniería inversa, copiar o redistribuir el software.</li>
                <li>Cumplir con toda la normativa chilena aplicable, incluyendo la Ley de Copropiedad Inmobiliaria y la Ley de Protección de Datos Personales.</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Planes y facturación</h2>
              <p>
                Propify ofrece distintos planes de suscripción (Gratuito, Básico y Pro). Los planes de pago se
                facturan mensualmente mediante tarjeta de crédito o débito procesada por Stripe, Inc.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Los cobros se realizan de forma anticipada al inicio de cada período mensual.</li>
                <li>El plan Gratuito no tiene costo pero puede tener limitaciones en funcionalidades o número de unidades.</li>
                <li>Puede cancelar su suscripción en cualquier momento. La cancelación será efectiva al término del período ya pagado, sin reembolsos proporcionales.</li>
                <li>Nos reservamos el derecho de modificar los precios con 30 días de aviso previo.</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Propiedad intelectual</h2>
              <p>
                Todo el código, diseño, marca, logotipos y contenido del Servicio son propiedad exclusiva de Propify
                y están protegidos por las leyes de propiedad intelectual vigentes en Chile. Ninguna disposición de
                estos términos le otorga derechos de propiedad sobre el Servicio.
              </p>
              <p className="mt-2">
                Los datos ingresados por usted (información de su edificio, residentes, gastos, etc.) son de su
                exclusiva propiedad. Propify únicamente los procesa para prestar el Servicio contratado.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Disponibilidad y soporte</h2>
              <p>
                Propify procura mantener el Servicio disponible de forma continua, pero no garantiza una
                disponibilidad del 100%. Puede haber períodos de mantenimiento programado o interrupciones
                fuera de nuestro control.
              </p>
              <p className="mt-2">
                El soporte técnico se presta a través de{' '}
                <a href="mailto:soporte@propify.cl" className="text-blue-600 hover:underline">soporte@propify.cl</a>.
                Los tiempos de respuesta dependen del plan contratado.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Limitación de responsabilidad</h2>
              <p>
                En la máxima medida permitida por la ley chilena, Propify no será responsable por:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Pérdidas de datos causadas por el usuario (eliminación accidental, credenciales comprometidas).</li>
                <li>Decisiones administrativas, financieras o legales tomadas con base en los datos del Servicio.</li>
                <li>Daños indirectos, emergentes o consecuentes derivados del uso o imposibilidad de uso del Servicio.</li>
              </ul>
              <p className="mt-2">
                La responsabilidad total de Propify frente a usted no superará el monto pagado en los últimos
                3 meses por concepto de suscripción.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Terminación</h2>
              <p>
                Podemos suspender o cancelar su cuenta, con o sin aviso previo, si:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Incumple estos Términos de Uso.</li>
                <li>No paga su suscripción y mantiene una deuda vencida por más de 15 días.</li>
                <li>Utiliza el Servicio de forma fraudulenta o ilegal.</li>
              </ul>
              <p className="mt-2">
                Al cancelar la cuenta, sus datos serán eliminados de nuestros sistemas activos en un plazo de
                30 días, conforme a nuestra Política de Privacidad.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Modificaciones a estos términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Le notificaremos
                los cambios relevantes por correo electrónico o mediante aviso en la plataforma con al menos
                15 días de anticipación. El uso continuado del Servicio tras la entrada en vigencia de los
                cambios implica su aceptación.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Ley aplicable y jurisdicción</h2>
              <p>
                Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia se
                someterá a los tribunales ordinarios de justicia competentes en la ciudad de Santiago, Chile,
                sin perjuicio de otros mecanismos de resolución de conflictos acordados por las partes.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contacto</h2>
              <p>
                Para consultas sobre estos Términos, puede contactarnos en:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm space-y-1">
                <p><strong>Propify</strong></p>
                <p>Email: <a href="mailto:legal@propify.cl" className="text-blue-600 hover:underline">legal@propify.cl</a></p>
                <p>Sitio web: <Link href="/" className="text-blue-600 hover:underline">propify-rust.vercel.app</Link></p>
              </div>
            </section>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</Link>
            <Link href="/" className="text-gray-400 hover:text-gray-600">Volver al inicio</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 Propify · Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  )
}
