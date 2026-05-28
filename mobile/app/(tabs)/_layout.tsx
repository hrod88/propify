import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { COLORS } from '../_layout'

// Iconos simples con emoji (sin dependencias de icon libraries)
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, marginTop: 2, color: focused ? COLORS.primary : COLORS.textLight, fontWeight: focused ? '600' : '400' }}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor:  COLORS.border,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
        headerStyle:      { backgroundColor: COLORS.dark },
        headerTintColor:  'white',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Inicio"     focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: 'Gastos Comunes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Gastos"     focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="solicitudes"
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" label="Solicitudes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="comunicaciones"
        options={{
          title: 'Comunicaciones',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📢" label="Noticias"    focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Perfil"      focused={focused} />,
        }}
      />
    </Tabs>
  )
}
