# Capa de Servicios Puros (Clean Architecture)

Reglas para esta carpeta:

1. **NUNCA** importar `NextRequest`, `NextResponse` ni nada de `next/server`.
2. **NUNCA** importar hooks de React ni componentes de UI.
3. Toda consulta a DB que retorne objetos debe terminar en `.lean()` (devuelve POJOs).
4. Los errores lanzados aquí los atrapa la capa superior (API route o React Server Component).

Cada servicio se importa de forma directa (`@backend/services/artworks.service`), no hay barrel.
