# ArtSanctuary - AI Context (Resumen Ejecutivo)

> ⚠️ **ATENCIÓN AGENTES IA:** Este es el contexto maestro de ArtSanctuary. NO leas toda la carpeta `docs`. Después de leer esto, dirígete a `docs/INDEX.md` para encontrar lo que necesites.

## Proyecto
ArtSanctuary es una aplicación orientada al aprendizaje, estructuración y generación de estudios de dibujo (tableros, referencias de anatomía, recorte, cuadrículas y más). 

## Stack Tecnológico Principal
- **Frontend:** Next.js 16.2 (App Router), React 19, Tailwind CSS v4, Motion (Animaciones).
- **Herramientas de Dibujo / Canvas:** Konva y React-Konva.
- **Backend/DB:** Mongoose (MongoDB).
- **Autenticación:** Next-Auth v5.
- **Almacenamiento:** Vercel Blob.

## Reglas Inquebrantables de Arquitectura
1. **Tipado Estricto (TypeScript):** Está terminantemente prohibido usar `any`. Toda entidad debe tener su interfaz — hoy viven colocadas junto a su dominio (ej. `src/shared/lib/boards/types.ts`), no en un directorio central de tipos. `types/` en la raíz es solo para augmentation de librerías externas (`next-auth.d.ts`).
2. **Separación de Lógica:** No inyectar lógica de negocio compleja ni fetchers directamente en los componentes de UI. Usa hooks (`useBoard`, `useTool`) o los servicios de `src/backend/services/` invocados desde Server Components — el proyecto no usa Server Actions (`"use server"`), usa el patrón Controlador-Servicio (ver `architecture/estructura-optimizada.md`).
3. **Konva & React-Konva:** Para cualquier elemento dibujable en el canvas, usa primitivas de React-Konva y controla la gestión de memoria evitando instanciar imágenes en ciclos infinitos.
4. **Diseño Visual:** Todo diseño debe usar las variables de color del `design-system.md` (ej. `var(--color-primary)`) y seguir el esquema de Dark Mode.

## Enrutamiento Siguiente
👉 **Para cualquier tarea, ve inmediatamente a `docs/INDEX.md` y busca la ruta exacta del dominio a modificar.**
