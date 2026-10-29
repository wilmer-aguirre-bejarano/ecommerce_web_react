# Seguridad - Recomendaciones

## Protección contra fuerza bruta
Actualmente NO existe un sistema de captcha ni rate-limit implementado en el frontend.

Recomendaciones a implementar:
- hCaptcha/Turnstile (Cloudflare) en Login/Registro
- Rate-limit por IP en edge functions (Supabase) para /auth/v1/token
- Bloqueo temporal tras N intentos fallidos (tabla login_attempts)
- reCAPTCHA v3 o v2 invisible

## Protección de rutas
Guards existentes:
- RequireAuth: redirige a /login si sin sesión
- RequireRole: redirige según rol si no autorizado

Mejoras recomendadas:
- Verificar permisos también a nivel de datos (RLS estricto)
- No confiar solo en ocultar UI (navegación)
- Añadir comprobación de "user activo" si aplica

## Validación de entrada
- Zod en todos los formularios
- Sanitizar textos largos
- Validar tipos en queries

## Variables sensibles
- Usar .env (no commitear)
- Usar VITE_* solo para anon key
- Rotar claves si necesario
