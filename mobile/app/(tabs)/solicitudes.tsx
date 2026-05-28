/**
 * Solicitudes de Mantención — Propify Mobile
 * Lista + crear nueva solicitud.
 */
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal, Alert,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '../_layout'

const prioridadCfg: Record<string, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: '#64748b' },
  media:   { label: 'Media',   color: '#d97706' },
  alta:    { label: 'Alta',    color: '#dc2626' },
  urgente: { label: 'Urgente', color: '#7c3aed' },
}
const estadoCfg: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  en_progreso: { label: 'En progreso', color: '#2563ae', bg: '#dbeafe' },
  resuelto:    { label: 'Resuelto',    color: '#16a34a', bg: '#dcfce7' },
  cancelado:   { label: 'Cancelado',   color: '#64748b', bg: '#f1f5f9' },
}

export default function SolicitudesScreen() {
  const [items,      setItems]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalNueva, setModalNueva] = useState(false)
  const [titulo,     setTitulo]     = useState('')
  const [desc,       setDesc]       = useState('')
  const [saving,     setSaving]     = useState(false)

  async function cargar() {
    const { data } = await supabase
      .from('solicitudes')
      .select('*')
      .order('creadoEn', { ascending: false })
      .limit(60)
    setItems(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { cargar() }, [])

  async function crear() {
    if (!titulo.trim()) { Alert.alert('Error', 'El título es obligatorio'); return }
    setSaving(true)
    const nueva = {
      id:          `sol-${Date.now()}`,
      titulo:      titulo.trim(),
      descripcion: desc.trim(),
      estado:      'pendiente',
      prioridad:   'media',
      categoria:   'general',
      unidadId:    'u1',
      edificioId:  'e1',
      solicitanteId: 'mobile',
      creadoEn:    new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    }
    await supabase.from('solicitudes').insert([nueva])
    setItems(prev => [nueva, ...prev])
    setTitulo(''); setDesc(''); setSaving(false); setModalNueva(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Mis solicitudes</Text>
        <TouchableOpacity onPress={() => setModalNueva(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar() }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Sin solicitudes</Text></View>}
          renderItem={({ item }) => {
            const est  = estadoCfg[item.estado]   ?? estadoCfg.pendiente
            const prior = prioridadCfg[item.prioridad] ?? prioridadCfg.media
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.prior, { color: prior.color }]}>⬤ {prior.label}</Text>
                  <View style={[styles.badge, { backgroundColor: est.bg }]}>
                    <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                {item.descripcion ? <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text> : null}
                <Text style={styles.cardDate}>{new Date(item.creadoEn).toLocaleDateString('es-CL')}</Text>
              </View>
            )
          }}
        />
      )}

      {/* Modal nueva solicitud */}
      <Modal visible={modalNueva} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva solicitud</Text>
            <TouchableOpacity onPress={() => setModalNueva(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              value={titulo} onChangeText={setTitulo}
              placeholder="Ej: Fuga de agua en baño"
              style={styles.input} placeholderTextColor="#94a3b8"
            />
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              value={desc} onChangeText={setDesc}
              placeholder="Describe el problema…"
              multiline numberOfLines={4}
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity onPress={crear} disabled={saving} style={[styles.submitBtn, saving && { opacity: 0.6 }]}>
              <Text style={styles.submitText}>{saving ? 'Enviando…' : 'Enviar solicitud'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topTitle:    { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  addBtn:      { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText:  { color: 'white', fontWeight: '700', fontSize: 13 },
  card:        { backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  prior:       { fontSize: 11, fontWeight: '700' },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardDesc:    { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  cardDate:    { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  empty:       { alignItems: 'center', paddingVertical: 48 },
  emptyText:   { color: COLORS.textLight, fontSize: 14 },
  modal:       { flex: 1, backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalClose:  { fontSize: 18, color: COLORS.textLight, padding: 4 },
  modalBody:   { padding: 20, gap: 8 },
  inputLabel:  { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input:       { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.text },
  submitBtn:   { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  submitText:  { color: 'white', fontWeight: '700', fontSize: 15 },
})
