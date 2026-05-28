/**
 * Mi Perfil — Propify Mobile
 * Datos del usuario + acciones de sesión.
 */
import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '../_layout'

const ROL_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  super_admin:   'Super Admin',
  conserje:      'Conserje',
  propietario:   'Propietario',
  arrendatario:  'Arrendatario',
}
const ROL_EMOJI: Record<string, string> = {
  administrador: '🏢',
  super_admin:   '⭐',
  conserje:      '🔑',
  propietario:   '🏠',
  arrendatario:  '👤',
}

export default function PerfilScreen() {
  const [user,    setUser]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        supabase
          .from('usuarios')
          .select('*')
          .eq('email', data.session.user.email)
          .single()
          .then(({ data: u }) => { setUser(u); setLoading(false) })
      } else {
        setLoading(false)
      }
    })
  }, [])

  function cerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />

  const iniciales = user ? `${user.nombre?.charAt(0) ?? ''}${user.apellido?.charAt(0) ?? ''}`.toUpperCase() : 'PR'
  const nombre    = user ? `${user.nombre} ${user.apellido}` : 'Usuario'

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Avatar header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        {user?.rol && (
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>{ROL_EMOJI[user.rol] ?? '👤'} {ROL_LABEL[user.rol] ?? user.rol}</Text>
          </View>
        )}
      </View>

      {/* Datos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        {[
          { label: 'Teléfono', value: user?.telefono ?? 'No registrado' },
          { label: 'Edificio', value: user?.edificioId ?? '—' },
          { label: 'Estado',   value: user?.activo ? 'Activo' : 'Inactivo' },
        ].map(row => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <TouchableOpacity onPress={cerrarSesion} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Propify v1.0 · Administración de edificios</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header:       { backgroundColor: COLORS.dark, alignItems: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 20 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:   { color: 'white', fontSize: 28, fontWeight: 'bold' },
  nombre:       { color: 'white', fontSize: 20, fontWeight: 'bold' },
  email:        { color: COLORS.accent, fontSize: 13, marginTop: 4 },
  rolBadge:     { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' },
  rolText:      { color: 'white', fontSize: 13, fontWeight: '600' },
  section:      { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel:     { fontSize: 14, color: COLORS.textLight },
  rowValue:     { fontSize: 14, fontWeight: '600', color: COLORS.text },
  signOutBtn:   { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  signOutText:  { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  footer:       { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 24 },
})
