# Alertas de cortes — Lima

Proyecto personal de fin de semana: reportes de vecinos en vivo sobre cortes de agua, luz e internet en Lima, agregados por zona.

## Problema y diferencial

Las fuentes oficiales (Sedapal, Luz del Sur) y los agregadores existentes (ej. cortedeagua.net.pe) solo cubren **cortes programados** — los anunciados con anticipación. La mayor parte del malestar real viene de **cortes imprevistos** (roturas, fallas de subestación) que no aparecen en ningún comunicado porque las empresas no los publican, y a veces ni los reconocen.

El diferencial de este proyecto: una capa de **reportes en vivo hechos por vecinos**, no un espejo de lo que las empresas ya publican.

## Cobertura

Agua, luz e internet en un mismo sistema. Como la fuente es el reporte del vecino (no un scraper por proveedor), agregar un servicio más es solo un campo adicional — no una integración nueva.

## Modelo de datos

### Reporte

| Campo | Detalle |
|---|---|
| Tipo de servicio | Multi-select: agua / luz / internet (puede fallar más de uno junto) |
| Ubicación | Geolocalización del navegador → snap a celda H3 al vuelo. El lat/lng exacto **se descarta** apenas se calcula la celda; nunca se guarda ni se pide dirección escrita |
| Nombre | Campo de texto libre, opcional, sin verificación. Solo para mostrar "reportado por X" si la persona quiere |
| ID de dispositivo | UUID generado en el navegador (localStorage), nunca visible ni solicitado. Única forma de identificar "mismo dispositivo" sin pedir teléfono/login |
| Estado | "Corte" o "Ya volvió" — el reporte de resolución es tan importante como el de inicio |

No se recolecta ningún dato personal identificable (sin teléfono, sin email, sin dirección exacta, sin login).

### Agregación geoespacial (H3)

Grilla hexagonal (librería H3 de Uber — `h3-js` / `h3-py`) en vez de grilla cuadrada: los 6 vecinos de cualquier celda están a la misma distancia, sin el sesgo diagonal de una grilla cuadrada. Resolución 8-9 (escala de barrio).

Los reportes se agregan por **celda + tipo de servicio + ventana de tiempo**.

## Antispam (sin datos personales)

| Mecanismo | Función |
|---|---|
| Rate limit por device ID | Ej. 3 reportes/hora por dispositivo — frena spam automatizado |
| Validación de plausibilidad geográfica | Rechaza coordenadas fuera de Lima Metropolitana o saltos imposibles del mismo device |
| Confirmación por consenso | Un corte se muestra como "confirmado" solo con 3+ dispositivos distintos reportando la misma celda+tipo en la ventana de tiempo. Un solo reporte nunca dispara nada |
| Baneo silencioso | Un device que dispara los filtros sigue pudiendo reportar, pero sus reportes dejan de contar para el consenso — no se le avisa, para que no aprenda a evadir el filtro |

Nota: `localStorage` es fácil de borrar. Para un MVP de fin de semana el rate limit por device alcanza; si hay abuso real más adelante, sumar fingerprint de navegador como capa adicional (no reemplazo).

## Expiración de reportes

Un corte confirmado sin reportes nuevos ni marca de "ya volvió" **expira automáticamente** después de 4-6 horas, para no mostrar información vieja como si fuera vigente.

## Distribución

- **Mapa de calor hexagonal** (deck.gl `H3HexagonLayer`) — vista pública, filtrable por tipo de servicio.
- **Alerta automática** (canal de Telegram o WhatsApp broadcast) cuando una celda supera el umbral de confirmación.
- **Puente físico**: aviso imprimible de una hoja generado automáticamente por zona, distribuido a través de dirigentes vecinales y bodegas piloto, para llegar a quienes no tienen celular.

## Disclaimer

El sitio debe dejar claro en todo momento que es **información generada por la comunidad, no un canal oficial** de Sedapal, Luz del Sur/Pluz Energía u otro proveedor.

## Stack

- **Frontend**: Astro. Sitio estático con dos islands interactivas: el mapa y el formulario de reporte. El resto de la página no necesita JS.
- **Backend**: NestJS. API en vivo (no un cron) porque los reportes llegan en cualquier momento, a diferencia del modelo original de leer comunicados.
- **Base de datos**: Neon (Postgres serverless), con Prisma para el schema y las migraciones.
- **Geoindexado**: H3 (`h3-js`), calculado en el servidor a partir del lat/lng que manda el cliente — el lat/lng crudo nunca se guarda.
- **Mapa**: deck.gl con `H3HexagonLayer`.
- **Distribución**: canal de Telegram o WhatsApp broadcast.
- **CI/CD**: GitHub Actions — lint/test en cada PR; al mergear a `main`, build y deploy de Astro (Cloudflare Pages/Vercel), build y deploy de NestJS (Railway/Fly.io), y `prisma migrate deploy` contra Neon.

### Modelo de datos (Prisma)

```prisma
model Report {
  id          String       @id @default(uuid())
  serviceType ServiceType
  h3Cell      String
  deviceId    String
  name        String?
  status      ReportStatus
  createdAt   DateTime     @default(now())

  @@index([h3Cell, serviceType, createdAt])
  @@index([deviceId, createdAt])
}

enum ServiceType {
  AGUA
  LUZ
  INTERNET
}

enum ReportStatus {
  CORTE
  RESTABLECIDO
}
```

Sin tabla de "celdas confirmadas" separada — el estado de cada celda se calcula al vuelo (conteo de `deviceId` distintos por `h3Cell` + `serviceType` dentro de la ventana de tiempo). A escala de piloto (2-3 zonas) es más simple que mantener una vista materializada.

### Estructura de módulos (NestJS)

```
src/
  reports/
    reports.controller.ts   → POST /reports, GET /cells
    reports.service.ts      → crea el reporte, calcula el H3 en servidor, evalúa consenso
    dto/create-report.dto.ts
  alerts/
    alerts.service.ts       → cliente del bot de Telegram/WhatsApp
  common/
    guards/rate-limit.guard.ts
  prisma/
    prisma.service.ts
```

La alerta se dispara dentro del mismo request de `POST /reports`, no con un job periódico: si el insert hace que una celda cruce el umbral de consenso, `reports.service.ts` llama directo a `alerts.service.ts`.

## Alcance del MVP (fin de semana)

- Formulario de reporte (tipo, ubicación, nombre opcional, estado)
- Antispam básico (rate limit + plausibilidad + consenso)
- Mapa con filtro por tipo de servicio
- Canal de alertas automáticas
- Aviso imprimible por zona
- Piloto en 2-3 zonas específicas, no toda Lima desde el día uno (arranque en frío)

## Fuera de alcance (v2)

- Fingerprint de navegador como capa antispam adicional
- Cobertura de más distritos/zonas
- Cuentas de usuario o login
- Integración con fuentes oficiales de cortes programados (Sedapal/Luz del Sur) como capa complementaria
