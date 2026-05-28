/**
 * Gastos Comunes — Propify Mobile
 * Lista de gastos del mes con estado de pago.
 */
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { formatCLP, MESES_FULL } from '@/lib/format'
import { COLORS } from '../_layout'

const estadoCfg: Record<string, { label: string; color: string; bg: string }> = {
  pagado:   { label: 'Pagado',   color: '#16a34a', bg: '#dcfce7' },
  pendiente:{ label: 'Pendiente',color: '#d97706', bg: '#fef3c7' },
  vencido:  { label: 'Vencido',  color: '#dc2626', bg: '#fee2e2' },
  parcial:  { label: 'Parcial',  color: '#7c3aed', bg: '#f3e8ff' },
}

export default function GastosScreen() {
  const [gastos,     setGastos]     = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro,     setFiltro]     = useState<string>('todos')

  async function cargar() {
    const { data } = await supabase
      .from('gastos_comunes')
      .select('*')
      .order('mes', { ascending: false })
      .limit(100)
    setGastos(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { cargar() }, [])

  const mesActual = new Date().getMonth() + 1
  const filtered  = gastos.filter(g => {
    if (filtro === 'todos')   return g.mes === mesActual
    return g.estadoPago === filtro
  })

  const totalPendiente = gastos.filter(g => g.mes === mesActual && (g.estadoPago === 'pendiente' || g.estadoPago === 'vencido')).reduce((s, g) => s + (g.montoTotal ?? 0), 0)

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Gastos — {MESES_FULL[mesActual]}</Text>
        <Text style={styles.summaryAmount}>{formatCLP(totalPendiente)}</Text>
        <Text style={styles.summarySub}>por cobrar este mes</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {['todos', 'pagado', 'pendiente', 'vencido'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFiltro(f)}
            style={[styles.filterBtn, filtro === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>
              {f === 'todos' ? 'Este mes' : estadoCfg[f]?.label ?? f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={COLORS.primary} />}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin gastos para mostrar</Text>
            </View>
          }
          renderItem={({ item }) => {
            const est = estadoCfg[item.estadoPago] ?? estadoCfg.pendiente
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardUnidad}>Unidad {item.unidadId}</Text>
                  <Text style={styles.cardPeriodo}>{MESES_FULL[item.mes]} {item.año}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardMonto}>{formatCLP(item.montoTotal)}</Text>
                  <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                    <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                  </View>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.bg },
  summary:         { backgroundColor: COLORS.dark, padding: 20, paddingTop: 28, paddingBottom: 24 },
  summaryTitle:    { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  summaryAmount:   { color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  summarySub:      { color: COLORS.accent, fontSize: 12, marginTop: 2 },
  filters:         { flexDirection: 'row', gap: 6, padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText:      { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  filterTextActive:{ color: 'white' },
  card:            { backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardLeft:        {},
  cardUnidad:      { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardPeriodo:     { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  cardRight:       { alignItems: 'flex-end' },
  cardMonto:       { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  estadoBadge:     { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  estadoText:      { fontSize: 11, fontWeight: '700' },
  empty:           { alignItems: 'center', paddingVertical: 48 },
  emptyText:       { color: COLORS.textLight, fontSize: 14 },
})
