import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, StyleSheet } from 'react-native'

// Colores brand Propify
export const COLORS = {
  primary:   '#2563ae',
  dark:      '#0f2341',
  secondary: '#1e3a5f',
  accent:    '#94b4d4',
  bg:        '#f8fafc',
  text:      '#0f172a',
  textLight: '#64748b',
  border:    '#e2e8f0',
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.dark} />
      <Stack
        screenOptions={{
          headerStyle:      { backgroundColor: COLORS.dark },
          headerTintColor:  'white',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle:     { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login"  options={{ title: 'Iniciar sesión', headerShown: false }} />
      </Stack>
    </>
  )
}
