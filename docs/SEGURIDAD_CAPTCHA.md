# Documentación de Seguridad (Complementaria)

## Captcha y protección contra fuerza bruta (Recomendación)
Por requerimiento, se documenta la recomendación de implementar captcha y throttling:

### Proveedor sugerido: Cloudflare Turnstile o hCaptcha
Ambos válidos. Si se decide implementar, usar variables de entorno:
- VITE_HCAPTCHA_SITEKEY (solo frontend)
- HCAPTCHA_SECRETKEY (backend/edge function para validar token)

O equivalente para Turnstile.

### Recomendación de validación (edge function)
No validar solo en frontend. Implementar una Edge Function (Supabase) que:
1. Reciba email/password/h-captcha-response
2. Valide token contra API del proveedor
3. Aplique rate-limit por IP (tabla login_attempts o Redis)
4. Bloquee tras X intentos fallidos (ej. 5 en 15 min)

### Implementación mínima en frontend (esquemático)
- Añadir componente HCaptcha al formulario Login/Registro
- Incluir token en petición o validar vía edge function
- Mostrar error si captcha inválido

## Protección de rutas (actual)
- RequireAuth: redirige si no hay sesión
- RequireRole: restringe por rol (admin/vendedor/cliente)

## Comentarios en código
Se han añadido encabezados descriptivos en español a módulos clave (AuthContext, router, lib/*) para facilitar mantenimiento.
