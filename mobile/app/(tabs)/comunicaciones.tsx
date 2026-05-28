/**
 * Comunicaciones — Propify Mobile
 * Circulares y avisos del edificio.
 */
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '../_layout'

const tipoCfg: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  circular:    { label: 'Circular',    color: '#2563ae', bg: '#dbeafe', emoji: '📄' },
  urgente:     { label: 'Urgente',     color: '#dc2626', bg: '#fee2e2', emoji: '🚨' },
  informativo: { label: 'Informativo', color: '#16a34a', bg: '#dcfce7', emoji: 'ℹ️' },
  'reunión':   { label: 'Reunión',     color: '#7c3aed', bg: '#f3e8ff', emoji: '📅' },
}

export default function ComunicacionesScreen() {
  const [items,      setItems]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function cargar() {
    const { data } = await supabase
      .from('comunicaciones')
      .select('*')
      .order('creadoEn', { ascending: false })
      .limit(40)
    setItems(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { cargar() }, [])

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Sin comunicaciones</Text></View>}
          renderItem={({ item }) => {
            const t = tipoCfg[item.tipo] ?? tipoCfg.informativo
            return (
              <View style={[styles.card, item.tipo === 'urgente' && styles.cardUrgente]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: t.bg }]}>
                    <Text style={[styles.badgeText, { color: t.color }]}>{t.emoji} {t.label}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(item.creadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                {item.contenido ? <Text style={styles.cardContent} numberOfLines={3}>{item.contenido}</Text> : null}
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  card:        { backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardUrgente: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  cardDate:    { fontSize: 11, color: '#94a3b8' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardContent: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
  empty:       { alignItems: 'center', paddingVertical: 48 },
  emptyText:   { color: COLORS.textLight, fontSize: 14 },
})
