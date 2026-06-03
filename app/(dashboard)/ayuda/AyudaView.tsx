'use client'

/**
 * AyudaView.tsx — Centro de ayuda y FAQ de Propify
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle,
  BookOpen, Play, ExternalLink, Search, Building2,
  Receipt, Users, FileText, Bell, CreditCard, Wrench,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────
interface FaqItem {
  q: string
  a: string | React.ReactNode
}

interface FaqSection {
  title:  string
  icon:   React.ElementType
  color:  string
  items:  FaqItem[]
}

// ─── Contenido FAQ ────────────────────────────────────────────
const SECCIONES: FaqSection[] = [
  {
    title: 'Primeros pasos',
    icon:  Building2,
    color: '#2563ae',
    items: [
      {
        q: '¿Cómo agrego unidades a mi edificio?',
        a: 'Ve a Operaciones → Unidades → botón "Nueva Unidad". Ingresa el número, piso, superficie y tipo (departamento/local/estacionamiento). Puedes crear todas las unidades una por una o hacer un seed masivo contactando soporte.',
      },
      {
        q: '¿Cómo invito a un residente?',
        a: 'En Residentes → "Nuevo Residente". Ingresa nombre, email y asigna la unidad. El residente recibirá un email de bienvenida con su acceso al portal. Asegúrate de tener RESEND_API_KEY configurado en Vercel.',
      },
      {
        q: '¿Puedo gestionar más de un edificio?',
        a: 'Sí. En el menú superior aparece un selector de edificios si tienes más de uno asociado a tu cuenta de administrador. Cada edificio tiene sus propios datos completamente separados.',
      },
      {
        q: '¿Cómo configuro el logo y datos del edificio?',
        a: 'Ve a Configuración (ícono de engranaje en el sidebar) → pestaña "Edificio". Ahí puedes actualizar nombre, dirección, datos bancarios para las liquidaciones PDF y el email del administrador.',
      },
    ],
  },
  {
    title: 'Gastos Comunes',
    icon:  Receipt,
    color: '#16a34a',
    items: [
      {
        q: '¿Cómo genero los gastos comunes del mes?',
        a: 'En Finanzas → Gastos Comunes → "Nuevo Gasto". Selecciona el mes/año, ingresa los montos (base, agua, electricidad, fondo de reserva). Puedes generarlos individualmente por unidad o usar la Calculadora en Finanzas+ para proyectar el reparto.',
      },
      {
        q: '¿Cómo envío las liquidaciones a los residentes?',
        a: 'En Gastos Comunes, abre el detalle de un gasto y haz clic en "Enviar por email". Requiere que RESEND_API_KEY esté configurado en Vercel. También puedes descargar el PDF y enviarlo manualmente.',
      },
      {
        q: '¿Qué es el Fondo de Reserva?',
        a: 'Es el porcentaje de cada gasto común destinado a una cuenta de ahorro para gastos mayores (pinturas, ascensores, impermeabilización). La Ley 21.442 establece un mínimo del 5%. Se configura en la Calculadora de Dividendos.',
      },
      {
        q: '¿Cómo marco un pago como recibido?',
        a: 'En Finanzas → Pagos → "Registrar Pago". Selecciona la unidad, el monto y el método de pago (transferencia, efectivo, WebPay, etc.). El sistema actualiza automáticamente el estado del gasto a "pagado".',
      },
    ],
  },
  {
    title: 'Residentes y Unidades',
    icon:  Users,
    color: '#7c3aed',
    items: [
      {
        q: '¿Qué diferencia hay entre propietario y arrendatario?',
        a: 'Propietario: dueño de la unidad, recibe liquidaciones, tiene voto en asambleas con mayor peso. Arrendatario: inquilino, puede acceder al portal para ver cobros pero con permisos más limitados. Ambos ven el Muro y pueden usar Marketplace.',
      },
      {
        q: '¿Cómo edito los datos de un residente?',
        a: 'En Residentes, haz clic en el ícono de lápiz junto al residente. Puedes cambiar nombre, email, teléfono, unidad asignada y rol.',
      },
      {
        q: '¿Puedo tener una unidad sin residente asignado?',
        a: 'Sí. Una unidad puede estar vacante. Aparecerá en el listado de unidades sin asignar. Los gastos comunes pueden generarse igual para unidades vacantes.',
      },
    ],
  },
  {
    title: 'Documentos y Actas',
    icon:  FileText,
    color: '#d97706',
    items: [
      {
        q: '¿Cómo creo un acta de asamblea?',
        a: 'En Operaciones → Actas → "Nueva Acta". Ingresa el tipo (ordinaria/extraordinaria/directiva), asistentes, quórum y el contenido. Puedes guardar como borrador y publicarla cuando esté aprobada. El botón "Imprimir PDF" genera el documento formal.',
      },
      {
        q: '¿Cómo funciona el módulo de Votaciones?',
        a: 'En Comunidad → Votaciones → "Nueva Votación". Define el tema, fecha y quórum requerido (según Ley 21.442). Los residentes votan A favor / En contra / Abstención. Al cerrar la votación, el sistema calcula automáticamente el resultado (aprobado/rechazado/sin quórum).',
      },
      {
        q: '¿Qué pasa si una votación no alcanza quórum?',
        a: 'El resultado se marca como "Sin quórum". Deberás citar a una segunda asamblea donde el quórum requerido puede ser menor según la ley. El acta queda registrada con el resultado.',
      },
    ],
  },
  {
    title: 'Notificaciones y Comunicaciones',
    icon:  Bell,
    color: '#dc2626',
    items: [
      {
        q: '¿Cómo activo las notificaciones push?',
        a: 'En Configuración → Notificaciones → "Activar notificaciones push". Requiere aceptar el permiso en el navegador. Funciona en Chrome, Edge y Safari (iOS 16.4+). Las notificaciones llegarán aunque tengas la app en segundo plano.',
      },
      {
        q: '¿Cómo envío un comunicado a todos los residentes?',
        a: 'En Operaciones → Comunicaciones → "Nueva Comunicación". Elige el tipo (aviso/reunión/urgente/circular/informativo). Cada tipo tiene campos específicos: reuniones incluyen fecha y link Zoom, urgentes incluyen área afectada y contacto.',
      },
      {
        q: '¿Qué es el Muro Comunitario?',
        a: 'Es un feed social interno del edificio. Los residentes y el administrador pueden publicar avisos, eventos, contenido general o alertas urgentes. Incluye likes, comentarios y la opción de fijar publicaciones importantes al tope.',
      },
    ],
  },
  {
    title: 'Pagos y Conciliación',
    icon:  CreditCard,
    color: '#0891b2',
    items: [
      {
        q: '¿Cómo funciona la conciliación bancaria?',
        a: 'En Finanzas+ → Conciliación → pestaña "CSV". Descarga la cartola de tu banco (BancoEstado o cualquier banco en formato CSV genérico), súbela al sistema. Propify detecta automáticamente qué transferencias corresponden a pagos de gastos comunes y los marca como pagados.',
      },
      {
        q: '¿Qué bancos soporta la importación CSV?',
        a: 'BancoEstado (separador punto y coma) y formato genérico (separador coma). Para otros bancos, exporta en formato CSV y selecciona "Genérico". Si el banco usa otro formato, contáctanos y lo agregamos.',
      },
      {
        q: '¿Qué es Fintoc y cuándo estará disponible?',
        a: 'Fintoc es una API de open banking chilena que permite conectar cuentas bancarias directamente. Estará disponible en una próxima versión de Propify. Por ahora, usa la importación CSV que es la solución práctica actualmente.',
      },
    ],
  },
  {
    title: 'Mantenciones y Solicitudes',
    icon:  Wrench,
    color: '#ea580c',
    items: [
      {
        q: '¿Cómo un residente crea una solicitud de mantención?',
        a: 'El residente accede a su portal y en "Mis Solicitudes" crea una nueva con descripción, prioridad y foto opcional. El administrador la ve en Mantenciones con badge de pendientes y puede cambiar el estado a "en proceso" o "cerrada".',
      },
      {
        q: '¿Cómo registro una multa a un residente?',
        a: 'En Operaciones → Multas → "Nueva Multa". Selecciona la unidad, elige una regla predefinida (o ingresa motivo y monto libre) y la fecha. La multa queda en estado "pendiente" hasta que el residente pague o se anule.',
      },
    ],
  },
]

// ─── Componente FAQ item ──────────────────────────────────────
function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left hover:bg-gray-50 px-4 -mx-4 rounded-xl transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{item.q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-600 leading-relaxed pl-0">
          {item.a}
        </div>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  edificioNombre: string
}

// ─── Vista principal ──────────────────────────────────────────
export default function AyudaView({ edificioNombre }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const seccionesFiltradas = busqueda.trim()
    ? SECCIONES.map(s => ({
        ...s,
        items: s.items.filter(
          i => i.q.toLowerCase().includes(busqueda.toLowerCase()) ||
               (typeof i.a === 'string' && i.a.toLowerCase().includes(busqueda.toLowerCase()))
        ),
      })).filter(s => s.items.length > 0)
    : SECCIONES

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
        <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">¿En qué podemos ayudarte?</h2>
            <p className="text-blue-200 text-sm max-w-xl">
              Encuentra respuestas a las preguntas más frecuentes, o contáctanos directamente.
            </p>
          </div>
          <HelpCircle className="w-10 h-10 text-blue-300 shrink-0 opacity-60" />
        </div>

        {/* Buscador */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en preguntas frecuentes…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>

      {/* ── Acceso rápido ── */}
      {!busqueda && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Términos de Uso',        href: '/terminos',   icon: BookOpen,       color: '#2563ae' },
            { label: 'Política de Privacidad', href: '/privacidad', icon: FileText,       color: '#7c3aed' },
            { label: 'Enviar email de soporte',href: 'mailto:soporte@propify.cl', icon: Mail, color: '#16a34a', ext: true },
          ].map(({ label, href, icon: Icon, color, ext }) => (
            <Link
              key={label}
              href={href}
              target={ext ? '_blank' : undefined}
              rel={ext ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: color + '15' }}>
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
              {ext && <ExternalLink className="w-3 h-3 text-gray-300 ml-auto shrink-0" />}
            </Link>
          ))}
        </div>
      )}

      {/* ── FAQ por sección ── */}
      {seccionesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No encontramos resultados para <strong>&ldquo;{busqueda}&rdquo;</strong></p>
          <p className="text-gray-400 text-xs mt-1">Intenta con otras palabras o contáctanos directamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seccionesFiltradas.map(sec => (
            <div key={sec.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header sección */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: sec.color + '15' }}>
                  <sec.icon className="w-4 h-4" style={{ color: sec.color }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{sec.title}</h3>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {sec.items.length} respuesta{sec.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              {/* Items */}
              <div className="px-5 divide-y divide-gray-50">
                {sec.items.map((item, i) => <FaqItem key={i} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Contacto ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">¿No encontraste lo que buscabas?</h3>
        <p className="text-sm text-gray-500 mb-4">Nuestro equipo responde en menos de 24 horas hábiles.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="mailto:soporte@propify.cl"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Email de soporte</p>
              <p className="text-xs text-gray-400">soporte@propify.cl</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto" />
          </a>
          <a
            href="https://wa.me/56912345678?text=Hola%2C%20necesito%20ayuda%20con%20Propify"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-100">
              <MessageCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">WhatsApp</p>
              <p className="text-xs text-gray-400">+56 9 1234 5678</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto" />
          </a>
        </div>
      </div>

      {/* ── Links legales ── */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
        <Link href="/terminos" target="_blank" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Términos de Uso
        </Link>
        <span>·</span>
        <Link href="/privacidad" target="_blank" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <FileText className="w-3 h-3" /> Política de Privacidad
        </Link>
        <span>·</span>
        <span>© 2026 Propify</span>
      </div>

    </div>
  )
}
