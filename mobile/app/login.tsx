/**
 * Login — Propify Mobile
 * Autenticación con Supabase Auth (email + password).
 */
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { COLORS } from './_layout'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function iniciarSesion() {
    if (!email || !password) { Alert.alert('Error', 'Completa todos los campos'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      Alert.alert('Error de autenticación', error.message)
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>🏢</Text>
        </View>
        <Text style={styles.title}>Propify</Text>
        <Text style={styles.subtitle}>Administración de edificios</Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Correo electrónico</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity
          onPress={iniciarSesion}
          disabled={loading}
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.loginBtnText}>Iniciar sesión</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Propify Mobile v1.0</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.dark, justifyContent: 'center', padding: 24 },
  header:       { alignItems: 'center', marginBottom: 40 },
  logo:         { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText:     { fontSize: 32 },
  title:        { color: 'white', fontSize: 32, fontWeight: 'bold' },
  subtitle:     { color: COLORS.accent, fontSize: 14, marginTop: 4 },
  form:         { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, gap: 16 },
  inputGroup:   { gap: 6 },
  inputLabel:   { color: COLORS.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:        { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, fontSize: 15, color: 'white' },
  loginBtn:     { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  footer:       { textAlign: 'center', color: 'rgba(148,180,212,0.5)', fontSize: 11, marginTop: 32 },
})
