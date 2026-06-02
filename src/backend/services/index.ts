/**
 * Capa de Servicios Puros (Clean Architecture)
 * 
 * REGLAS PARA ESTA CARPETA:
 * 1. NUNCA importar `NextRequest`, `NextResponse` ni nada de `next/server`.
 * 2. NUNCA importar Hooks de React ni componentes de UI.
 * 3. Todas las consultas a DB que retornen objetos deben terminar en `.lean()`
 *    para devolver POJOs (Plain Old Javascript Objects).
 * 4. Los errores lanzados aquí deben ser atrapados por la capa superior (API o RSC).
 */

export const REGLAS_SERVICIOS = true;
