> ✅ **Implementado.** `BoardObject` (`src/shared/lib/boards/types.ts`) tiene
> `name`/`visible`/`opacity`/`locked` ("// layer props") y `LayersPanel.tsx`
> existe y está en uso en `BoardEditor.tsx`. Verificado y movido a
> `docs/historical/` el 2026-08-13.

# Plan de Implementación: Sistema de Capas tipo Photoshop

Este plan detalla los pasos para construir un sistema de capas profesional en el **Board principal**, dándote un control total sobre cada elemento (imágenes, textos, figuras) como si estuvieras usando Photoshop.

## Fase 1: Actualización de la Estructura de Datos (Modelo)
Actualmente, los objetos (`BoardObject`) tienen coordenadas, tamaño, rotación, bloqueo y un índice `z` para el orden. Para soportar capas avanzadas, agregaremos las siguientes propiedades a todos los objetos:

1. **`name?: string`**: Nombre personalizable de la capa (ej. "Fondo Principal", "Corte flor"). Si no tiene, se autogenera uno (ej. "Capa 1").
2. **`visible?: boolean`**: Para ocultar o mostrar capas sin tener que borrarlas.
3. **`opacity?: number`**: Un nivel de transparencia del 0 al 100.
4. **`blendMode?: string`**: (Opcional a futuro) Modos de fusión como *Multiplicar*, *Pantalla* o *Superponer*.

## Fase 2: Panel de Capas (Isla Flotante e Interfaz Contextual)
Construiremos una "isla" o panel flotante en la esquina inferior derecha de la pantalla, dejando libre el resto del lienzo. Este panel no será una barra lateral rígida, sino un elemento moderno que flota sobre el fondo.

**Comportamiento Contextual (Funciones Desbloqueables):**
- Cuando no tengas nada seleccionado, el panel funcionará puramente como un administrador global de **Capas**.
- Cuando hagas **clic en una capa (o en un objeto del lienzo)**, la isla se expandirá o cambiará para "desbloquear" y mostrar herramientas específicas de ese objeto: controles de opacidad, colores, y bloqueos.

**Dentro del módulo de Capas:**
- Se mostrarán ordenadas de arriba (frente) hacia abajo (fondo), igual que en Photoshop.
- Cada fila (capa) contendrá:
  - **Ojo (Visibilidad):** Un botón para ocultar/mostrar.
  - **Miniatura/Ícono:** Un ícono rápido según el tipo (🖼️ para imagen, 📝 para texto, ⏹️ para figuras).
  - **Nombre:** Clicable para editar el nombre de la capa.
  - **Candado (Bloqueo):** Reutilizando el sistema de bloqueo que ya creamos, pero visible individualmente por capa.

## Fase 3: Integración en el Lienzo (Konva)
Se debe actualizar el renderizado del lienzo (`BoardEditor.tsx`) para que obedezca las nuevas reglas:
- **Opacidad:** Aplicar `opacity={obj.opacity / 100}` a los grupos de cada objeto.
- **Visibilidad:** Si `visible` es `false`, el componente de Konva recibe `visible={false}`, lo que lo hace invisible e in-seleccionable.
- **Fusión:** Aplicar `globalCompositeOperation` para los modos de fusión especiales.

## Fase 4: Reordenamiento Avanzado (Drag & Drop)
En lugar de solo usar los botones "Traer al frente" o "Enviar al fondo", implementaremos **Arrastrar y Soltar (Drag & Drop)** dentro del Panel de Capas.
- Podrás arrastrar una fila de la lista de capas y soltarla entre otras dos.
- Al soltar, el sistema recalculará matemáticamente el índice `z` de todos los objetos para reflejar el nuevo orden visual exacto.

## Fase 5: Agrupación y Carpetas (Fase futura)
Una vez que las capas base funcionen, el siguiente paso sería:
- Permitir seleccionar múltiples capas (con Shift).
- Presionar `Ctrl+G` para "Agrupar", creando una "Carpeta" en el Panel de Capas.
- Las carpetas podrán colapsarse, ocultarse por completo, y moverán a todos sus hijos en conjunto en el lienzo.

---

### ¿Cómo proceder?
Si este plan te parece bien, el primer paso sería ejecutar la **Fase 1 y Fase 2** (Modificar el modelo de datos y construir el diseño visual del Panel de Capas con el control de opacidad). ¿Quieres que comience a programar la primera fase?
