# Guía de Desarrollo

## Convenciones
- Componentes funcionales con TypeScript
- Validación Zod + react-hook-form
- Comentarios en español cuando aclaran lógica compleja
- Mantener lógica intacta al refactorizar estilos

## Rutas protegidas
- /admin -> solo admin
- /vendedor -> solo vendedor
- /cliente -> solo cliente
- /carrito y /checkout -> requiere autenticación

## Carrito
- Persistente en localStorage
- Agrupado por seller_id
- Controla stock disponible vs carrito

## Órdenes
- order_number: ORD-YYYYMMDD-NNNN (generado por helper)
- Estado: pendiente|pagado|enviado|completado|cancelado
- Stock decrementado por trigger en BD al cambiar a pagado/enviado/completado (según SQL)

## Quejas
- Estados: enviada|en revisión|resuelta
