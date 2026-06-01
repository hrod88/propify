// Todas las páginas del dashboard se renderizan en runtime (usan Supabase)
export const dynamic = 'force-dynamic'

import Sidebar                    from '@/components/sidebar'
import Header                     from '@/components/header'
import AsistenteIA                from '@/components/asistente-ia'
import { NotificacionesProvider } from '@/context/notificaciones-context'
import { RolProvider }            from '@/context/rol-context'
import { EdificioProvider }       from '@/context/edificio-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RolProvider>
    <EdificioProvider>
    <NotificacionesProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
        {/* Sidebar fijo */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <Header />

          {/* Página */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>

        {/* Asistente IA flotante */}
        <AsistenteIA />
      </div>
    </NotificacionesProvider>
    </EdificioProvider>
    </RolProvider>
  )
}
