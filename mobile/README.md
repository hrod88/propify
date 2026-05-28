# Propify Mobile — Fase 35

App móvil nativa para Propify, construida con **Expo Router** + **React Native** + **Supabase**.

## Stack

| Tecnología         | Versión  |
|--------------------|----------|
| Expo               | ~52.0.0  |
| Expo Router        | ~4.0.0   |
| React Native       | 0.76.5   |
| @supabase/supabase-js | ^2.106.2 |
| TypeScript         | ^5.3.3   |

## Estructura

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout + colores brand
│   ├── login.tsx            # Pantalla de login
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator (5 tabs)
│       ├── index.tsx        # Dashboard con KPIs
│       ├── gastos.tsx       # Gastos comunes del mes
│       ├── solicitudes.tsx  # Solicitudes de mantención
│       ├── comunicaciones.tsx # Circulares del edificio
│       └── perfil.tsx       # Mi perfil + cerrar sesión
├── lib/
│   ├── supabase.ts          # Cliente Supabase con AsyncStorage
│   └── format.ts            # formatCLP + utilidades
├── app.json                 # Config Expo
├── package.json
├── tsconfig.json
└── .env.example             # Variables de entorno
```

## Setup inicial

```bash
cd mobile

# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales Supabase

# 2. Instalar dependencias
npm install
# o
npx expo install

# 3. Iniciar en modo desarrollo
npx expo start

# 4. Escanear QR con Expo Go (iOS/Android)
```

## Variables de entorno

Crea un archivo `.env` en la raíz de `mobile/`:

```
EXPO_PUBLIC_SUPABASE_URL=https://qmrsywpgjttfvrcbgpez.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## Pantallas implementadas

| Pantalla       | Descripción                              |
|----------------|------------------------------------------|
| Login          | Auth con Supabase (email + password)     |
| Dashboard      | KPIs: ocupación, morosos, solicitudes    |
| Gastos         | Lista de gastos del mes con estado       |
| Solicitudes    | Ver + crear solicitudes de mantención    |
| Comunicaciones | Circulares y avisos del edificio         |
| Perfil         | Datos del usuario + cerrar sesión        |

## Próximas pantallas (extensión sugerida)

- Reservas de espacios comunes
- Paquetes / delivery
- Notificaciones push (Expo Push Notifications)
- Portal de pagos móvil

## Comparte misma base de datos

Usa exactamente las mismas tablas Supabase que la app web en `propify/`.
No se requieren migraciones adicionales.
