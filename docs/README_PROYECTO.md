# Documentación del Proyecto - ecommerce_web

## 1. Objetivo General
Sistema de e-commerce multi-vendedor desarrollado con React + TypeScript + Vite, integrando Supabase para autenticación, base de datos y almacenamiento.

## 2. Stack Tecnológico
- React 19 (Vite)
- TypeScript
- Tailwind CSS + Bootstrap 5
- React Router DOM v7
- Supabase JS v2
- React Hook Form + Zod
- Sonner (notificaciones)
- date-fns
- qrcode.react

## 3. Estructura de Carpetas
- src/components: Componentes reutilizables (layouts, StatusBadge)
- src/context: AuthContext (gestión de sesión/roles)
- src/hooks: Hooks personalizados
- src/lib: Utilidades (cart, images, orders, roles, supabase)
- src/pages: Vistas organizadas por rol (auth, cliente, vendedor, admin, tienda, carrito, checkout, home)
- src/router: Configuración de rutas + guards
- src/types: Tipos de base de datos
- supabase_schema.sql: Script SQL completo

## 4. Roles y Permisos
- admin | vendedor | cliente
- Guards: RequireAuth y RequireRole en router/index.tsx
- Los admin pueden registrar vendedores desde panel admin

## 5. Configuración (.env)
Requiere:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_UPLOADS_BASE_URL (opcional)

## 6. Flujo de Compra
- Carrito agrupado por vendedor
- Checkout crea orden por vendedor
- Genera order_number (ORD-YYYYMMDD-NNNN)
- Muestra QR por vendedor (qr_payload)

## 7. Comandos
- npm run dev
- npm run build (tsc --noEmit + vite build)
- npm run typecheck

## 8. Notas de Seguridad
- RLS habilitado en Supabase (políticas definidas en SQL)
- Validación con Zod en formularios
- Contraseñas gestionadas por Supabase Auth
