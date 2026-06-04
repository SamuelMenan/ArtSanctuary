# Resolución de Errores: Vercel Blob CORS y React-Konva Transformer

**Fecha:** 4 de Junio de 2026
**Ubicación:** `src/frontend/features/tools/boards/` y `src/app/dashboard/workspaces/`

Este documento relata cronológicamente la cacería de un bug extraordinariamente esquivo que combinaba problemas de seguridad del navegador y ciclos de reconciliación en React 19, bloqueando por completo la redimensión de imágenes en los tableros anidados de Workspaces.

---

## 1. El Planteamiento del Problema y los Síntomas Originales

El usuario reportó tres comportamientos anómalos:
1. Las subidas de imagen a Vercel Blob fallaban en entorno local devolviendo un error `500 Access denied`.
2. Habiendo unificado el comportamiento del Sidebar entre los entornos globales (Tools) y anidados (Workspaces), el cuadro azul para redimensionar (Konva `Transformer`) dejó de funcionar en los boards de los **Workspaces**, aunque seguía operando perfectamente en **Tools**.
3. Al hacer clic sobre las imágenes en Workspaces, éstas parecían seleccionarse (los inspectores y paneles secundarios se activaban) pero los bordes interactivos de Konva jamás se renderizaban.

## 2. Cronología de la Investigación (Intentos Fallidos)

### Intento 1: Sospecha sobre el Bounding Box de Objetos Microscópicos
* **Hipótesis:** Como las Vistas de Workspace inyectan una escala `scale: 0.4494` y operan en coordenadas milimétricas enormes, se sospechó que los objetos se creaban con un ancho o alto igual a `NaN` o tan pequeño que el calculador `boundBoxFunc` del Transformer fallaba y abortaba la renderización del cuadro azul.
* **Acción:** Retiramos la validación customizada `boundBoxFunc` del Transformer para ver si dejaba de truncarse.
* **Resultado:** **Fracaso.** Los objetos seguían seleccionándose sin mostrar los controladores. La medida del objeto resultaba normal.

### Intento 2: Inyección del Debug Overlay y el Falso Testigo `trNodes: 0`
* **Hipótesis:** Se introdujo un panel de depuración visual directo al lienzo para monitorizar las variables de React sin usar el `console.log`. Esto reveló un estado crítico: la variable que cuenta cuántos nodos tiene adjuntados el Transformer (`trNodes`) dictaminaba `0`.
* **Acción:** Modificamos el hook `useTransformerSync` inyectando un `console.log` para seguir el comportamiento del arreglo y ver si el nodo de imagen llegaba a ser filtrado o excluido.
* **Resultado:** **Fracaso/Retraso.** Descubrimos que la caché súper-agresiva del compilador *Turbopack* (Next.js 16) impedía que el usuario viera los `console.log` en el navegador local, ralentizando las pruebas. Tuvimos que forzar reconstrucciones manuales. Al obtener confirmación, vimos que el `console.log` jamás se disparaba. El hook `useTransformerSync` en su conjunto estaba siendo bloqueado silenciosamente.

### Intento 3: Sospecha de Z-Index y Capas HTML Bloqueando (Event Interception)
* **Hipótesis:** Ya que el problema se daba *únicamente* en los Workspaces, tal vez el layout de la UI `CarnavalOverlays` o `CarnavalInspector` estaba dibujando un `<div>` transparente sobre el lienzo, interceptando los punteros del ratón.
* **Acción:** Revisamos los `z-index` y las clases Tailwind. Se detectó que las alertas usaban `pointer-events-none`. Todo el DOM era correcto.
* **Resultado:** **Fracaso.** La imagen sí era capaz de emitir eventos `onClick` hacia el lienzo subyacente. Los punteros no estaban siendo interceptados.

### Intento 4: Supresión completa de las Guías del Carnaval (Konva Layers)
* **Hipótesis:** La extensión del Workspace inyectaba la capa `CarnavalGuideLayer` con `listening={false}` en el Virtual DOM de Konva. ¿Podría ser que colocar una capa pasiva antes de la capa de objetos estropease las rutinas de búsqueda (`stage.findOne`) o los índices internos del motor Canvas?
* **Acción:** Comentamos y deshabilitamos violentamente el componente `<BoardExtLayers />` para purgar cualquier impacto visual proveniente del Workspace y dejar un clon exacto de lo que era la vista de "Tools".
* **Resultado:** **Fracaso.** Las guías reglamentarias desaparecieron como se esperaba, pero el cuadro de redimensión azul seguía sin aparecer en la imagen. El bug no radicaba en lo visual.

---

## 3. El Momento "Eureka" y las Causas Raíz Reales

Tras forzar la inyección de múltiples variables adicionales al cuadro de Debug Verde (`nFound`, `trVisible`, `trIsNull`), los datos revelaron dos defectos masivos, completamente independientes pero concurrentes:

### Causa Raíz A: El Sistema de Auto-Guardado y el Tainted Canvas (CORS)
* **El descubrimiento:** El debug reveló que `trVisible` arrojaba repetitivamente `false`. 
* **La mecánica rota:** ArtSanctuary auto-guarda una miniatura del lienzo cada 800ms (`useBoardData.ts`). Para ocultar temporalmente la herramienta de redimensión al fotografiar, el sistema llamaba a `tr?.visible(false)`, ejecutaba `stage.toDataURL()` y luego restauraba `tr?.visible(true)`. 
* **La trampa:** Debido al error original reportado por el usuario (`Vercel Blob Access Denied`), las imágenes se inyectaban en local a través de URL no seguras y el motor del Canvas de HTML5 quedaba manchado (*Tainted* por violar directivas de seguridad CORS). Al invocar `stage.toDataURL()`, el motor lanzaba un `DOMException` letal. Esto provocaba que la ejecución saltara abruptamente al bloque `catch` externo, evadiendo para siempre la línea donde el Transformer debía volverse visible de nuevo. ¡El cuadro azul sí "existía" y seleccionaba la imagen, pero estaba estancado como invisible!
* **Solución Aplicada:** Refactorizamos el hook de guardado para incorporar un bloque `try / finally` blindado. Ahora, la restauración de la visibilidad del Transformer ocurre incondicionalmente, incluso si el proceso de miniatura hace estallar el hilo con errores de seguridad.

### Causa Raíz B: El Bug de React 19 Ref Detachment (Desconexión de Punteros)
* **El descubrimiento:** Al consultar la variable `trIsNull`, el usuario reportó que el resultado era `yes`. El puntero virtual `trRef.current` que conectaba el gancho del programador con el Transformer real... estaba totalmente vacío.
* **La mecánica rota:** En la unificación de código, la ruta de Workspaces inyectaba dinámicamente un Proveedor de Contexto (Context Provider) rodeando el Lienzo. Si este proveedor alteraba su identidad, React 19 aplicaba una reconciliación profunda a los hijos. Debido a un comportamiento inestable conocido entre React 19 y las clases internas de `react-konva`, durante estos ciclos de montura/remontura dinámicos, el `ref` de las entidades de dibujo no se asignaba de vuelta a su variable contenedora, dejando el puntero en `null`. En `tools/boards`, al no existir este proveedor extra rodeando al componente, el flujo era estático y el puntero jamás se perdía.
* **Solución Aplicada:** Abandonamos la asignación de ref declarativa y la sustituimos por una asignación agresiva usando un **Callback Ref** imperativo directamente sobre el componente `<Transformer>`. Forzamos al nodo virtual a amarrarse activamente a nuestro puntero interno `trRef.current = node` en el milisegundo exacto de su creación.

## 4. Conclusión

Estas dos soluciones conjuntas restablecieron el comportamiento íntegro de la aplicación. Logramos:
1. Aislar por completo los fallos de red del sistema Blob sin que éstos corrompan la integridad del editor de diseño.
2. Unificar de manera exitosa los layouts y las sidebars garantizando que el Canvas sobrevive las arquitecturas complejas de Contexto en React 19.
