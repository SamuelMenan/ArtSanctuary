---
title: "Contexto y modelo de negocio"
audience: non-technical
status: stable
updated: 2026-08-14
owner: TBD
---

# Contexto y Negocio — ArtSanctuary

> **Audiencia de este documento:** Desarrolladores nuevos en el proyecto, colaboradores y stakeholders técnicos que necesitan entender *por qué* existe ArtSanctuary antes de tocar el código.

---

## El Problema

La comunidad artística de Pasto, Nariño — integrada por artistas plásticos, escultores e ilustradores — carece de un espacio digital diseñado específicamente para sus necesidades profesionales.

Las plataformas generalistas existentes presentan tres fricciones principales:

| Fricción | Descripción |
|----------|-------------|
| **Ruido visual** | Feeds algorítmicos mezclados con contenido no artístico que interrumpen el proceso creativo. |
| **Referencias dispersas** | Las imágenes de referencia se fragmentan entre Pinterest, Instagram, Behance y carpetas locales sin organización unificada. |
| **Falta de comunidad local** | No existe un espacio pensado para la escena artística regional donde artistas puedan colaborar, dar retroalimentación y visibilizar su obra dentro de su propio contexto cultural. |

---

## La Solución: ArtSanctuary

ArtSanctuary propone un **santuario digital**: un entorno limpio, enfocado y libre de distracciones donde el arte es el protagonista.

### Pilares de la plataforma

1. **Biblioteca de referencias visuales curada**  
   Un repositorio organizado de imágenes de referencia (anatomía, composición, escultura, ilustración) que el artista puede explorar, guardar y clasificar por colecciones propias.

2. **Perfil de artista sin algoritmos de engagement**  
   Cada artista tiene un portfolio limpio y presentable sin métricas de popularidad que distorsionen la percepción del trabajo.

3. **Herramientas colaborativas básicas**  
   Posibilidad de compartir proyectos en progreso, solicitar críticas y recibir retroalimentación de otros miembros de la comunidad.

4. **Enfoque regional**  
   Diseñado desde y para Pasto, Nariño. El proyecto reconoce la identidad cultural local (Carnaval de Negros y Blancos, maestros artesanos) como contexto legítimo de la creación artística.

5. **Acreditación Técnica y Formal (Corpocarnaval)**
   Alojamiento del ecosistema oficial para que los artesanos presenten sus proyectos de carrozas y disfraces. El sistema valida automáticamente medidas, planos y normativas exigidas por la corporación.

---

## Modelo de Negocio: "Alma Creativa" (Freemium)

El modelo de monetización se basa en un sistema freemium con dos niveles de acceso:

### Tier Free — *"Observador"*

Acceso sin costo para cualquier usuario registrado. Incluye:

- Explorar la biblioteca pública de referencias.
- Crear un perfil básico con hasta **10 obras** publicadas.
- Seguir a otros artistas y ver su portfolio.
- Guardar hasta **3 colecciones** de referencia.

### Tier Pro — *"Alma Creativa"*

Suscripción mensual o anual para artistas activos. Incluye todo lo del tier Free, más:

- Portfolio ilimitado de obras.
- Colecciones de referencia **ilimitadas** y **privadas**.
- Acceso a la sección de **retroalimentación comunitaria** (críticas detalladas).
- Insignia verificada de artista profesional en el perfil.
- Subida de imágenes en alta resolución (hasta 20 MB por obra).

```
Plan Free      → $0 / mes      → Explorar y comenzar
Plan Pro       → $X / mes      → Herramientas completas para el artista activo
               → $Y / año      → Descuento del 20% en plan anual
```

> **Nota para la demo:** En el prototipo actual (v0.1.0), la distinción de tiers está simulada. La lógica de pagos y suscripciones **no está implementada**. El campo `plan` en el modelo `User` es el marcador de posición para esta funcionalidad futura.

---

## Principios de Diseño de la Interfaz

El diseño de ArtSanctuary responde directamente al problema del "ruido visual". Los principios que guían cada decisión de UI son:

- **Minimalismo funcional:** Solo los elementos necesarios en pantalla. Sin barras de notificaciones agresivas ni pop-ups de engagement.
- **El arte al centro:** Las obras e imágenes de referencia ocupan el mayor espacio visual de cada vista. El UI es el marco, no el cuadro.
- **Paleta neutra:** Fondos oscuros o claros con alta neutralidad para no competir visualmente con el contenido artístico.
- **Tipografía legible:** Fuentes serif o sans-serif elegantes para títulos; monospace para metadatos técnicos (dimensiones, fecha, técnica).

---

## Alcance de la Demo (v0.1.0)

Esta primera iteración es un prototipo funcional con las siguientes características implementadas:

- [x] Página de inicio con galería de referencias.
- [x] Registro e inicio de sesión de usuario.
- [x] Perfil de artista con subida básica de obras.
- [x] Visualización de colecciones.
- [x] Workspaces (Libre y Carnaval) con motor reglamentario y planimetría.
- [x] Motor Gráfico (Boards) con extensiones para validación en tiempo real.
- [ ] Sistema de retroalimentación comunitaria *(pendiente)*.
- [ ] Integración de pasarela de pagos *(pendiente)*.
- [ ] Panel de administración *(pendiente)*.

---

## Relación con la Documentación Técnica

Para entender cómo estos conceptos de negocio se traducen en código:

- **[Data Model](../../docs/architecture/data-model.md)** — Cómo se modelan las entidades `User`, `Artwork`, `Board` y `CarnivalProject` en MongoDB.
- **[App Router](../../docs/architecture/routing.md)** — Cómo se estructura la navegación web y la API.
- **[Workspace Carnaval](../../docs/features/workspaces/carnaval.md)** — Detalles técnicos del motor de validación.

---

*ArtSanctuary Demo v0.1.0 — Pasto, Nariño, Colombia.*
