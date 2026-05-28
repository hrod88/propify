/**
 * Dashboard — Propify Mobile
 * Vista principal con KPIs del edificio y actividad reciente.
 */
import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/format'
import { COLORS } from '../_layout'

interface KPI {
  label: string
  value: string
  sub?:  string
  color: string
}

export default function DashboardScreen() {
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [kpis,        setKpis]        = useState<KPI[]>([])
  const [edificioNombre, setEdificio] = useState('Propify')

  async function cargar() {
    try {
      // Obtener datos del edificio activo
      const { data: unidades } = await supabase.from('unidades').select('*').limit(200)
      const { data: gastos   } = await supabase.from('gastos_comunes').select('*').limit(200)
      const { data: sols     } = await supabase.from('solicitudes').select('*').limit(200)

      const u  = unidades ?? []
      const g  = gastos   ?? []
      const s  = sols     ?? []

      const ocupadas  = u.filter((x: any) => x.estado === 'ocupado').length
      const morosos   = g.filter((x: any) => x.estadoPago === 'vencido' || x.estadoPago === 'parcial').length
      const pendSols  = s.filter((x: any) => x.estado === 'pendiente').length
      const monto     = g.filter((x: any) => x.estadoPago === 'vencido').reduce((s: number, x: any) => s + (x.montoTotal ?? 0), 0)

      setKpis([
        { label: 'Unidades ocupadas', value: `${ocupadas}/${u.length}`,   sub: 'total',           color: COLORS.primary },
        { label: 'Morosos',           value: String(morosos),             sub: 'unidades',         color: COLORS.danger  },
        { label: 'Monto en mora',     value: formatCLP(monto),            sub: 'pendiente',        color: COLORS.warning },
        { label: 'Solicitudes',       value: String(pendSols),            sub: 'pendientes',       color: '#7c3aed'      },
      ])
    } catch (e) {
      console.warn('Dashboard error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { cargar() }, [])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🏢 Propify</Text>
          <Text style={styles.headerSub}>Panel de administración</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* KPIs */}
          <Text style={styles.sectionTitle}>Resumen del edificio</Text>
          <View style={styles.kpiGrid}>
            {kpis.map(k => (
              <View key={k.label} style={[styles.kpiCard, { borderLeftColor: k.color }]}>
                <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                {k.sub && <Text style={styles.kpiSub}>{k.sub}</Text>}
              </View>
            ))}
          </View>

          {/* Accesos rápidos */}
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'Gastos',        emoji: '💰', screen: '/gastos'        },
              { label: 'Solicitudes',   emoji: '🔧', screen: '/solicitudes'   },
              { label: 'Comunicados',   emoji: '📢', screen: '/comunicaciones' },
              { label: 'Mi perfil',     emoji: '👤', screen: '/perfil'        },
            ].map(q => (
              <TouchableOpacity key={q.label} style={styles.quickCard}>
                <Text style={styles.quickEmoji}>{q.emoji}</Text>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  content:      { paddingBottom: 32 },
  header:       { backgroundColor: COLORS.dark, padding: 20, paddingTop: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:   {},
  headerTitle:  { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSub:    { fontSize: 13, color: COLORS.accent, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  kpiCard:      { flex: 1, minWidth: '44%', backgroundColor: 'white', borderRadius: 16, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  kpiValue:     { fontSize: 22, fontWeight: 'bold' },
  kpiLabel:     { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginTop: 2 },
  kpiSub:       { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  quickCard:    { flex: 1, minWidth: '44%', backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  quickEmoji:   { fontSize: 28, marginBottom: 8 },
  quickLabel:   { fontSize: 13, fontWeight: '600', color: COLORS.text },
})
