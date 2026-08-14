---
title: "Errores Comunes: Tailwind v4 y Variables CSS"
audience: frontend, dev, ai-agent
status: stable
updated: 2026-06-01
---

# Errores Comunes de Tailwind v4

Este documento registra los problemas y colisiones más frecuentes encontrados durante el uso de Tailwind CSS v4, para prevenir que las IAs o desarrolladores los vuelvan a introducir.

## 1. El Error de los Botones Negros (Colisión de Utilidad `text-[]`)

### Síntoma
Los botones primarios o componentes con texto que deberían tener un color contrastante (ej. blanco sobre negro) aparecen repentinamente con texto negro o heredado, rompiendo el contraste y haciéndolos ilegibles.

### Causa (El comportamiento ambiguo de JIT)
En el código base se solía usar la sintaxis arbitraria para forzar tamaños de fuente definidos en nuestras variables:
```html
❌ INCORRECTO:
<button class="bg-primary text-on-primary text-[var(--text-label-sm)]">Mi Botón</button>
```

**¿Por qué falla?**
En Tailwind, la utilidad `text-[]` es ambigua: sirve tanto para colores (ej. `text-[#fff]`) como para tamaños (ej. `text-[12px]`). 
Cuando Tailwind lee `text-[var(--text-label-sm)]`, el compilador JIT asume por defecto que es un color, y genera la siguiente regla CSS en el navegador:
```css
/* Lo que Tailwind genera: */
color: var(--text-label-sm); /* ESTO ES INVÁLIDO, porque la variable vale 12px */
```
Como es CSS inválido para un color, el navegador ignora esta regla, **sobrescribiendo y destruyendo** la clase anterior `text-on-primary`. El texto cae en su valor por defecto (negro).

### La Solución Correcta
Dado que en Tailwind v4 hemos definido `--text-label-sm` dentro de la directiva `@theme` en `globals.css`, Tailwind **ya genera automáticamente** la clase utilitaria correcta con su prefijo.

```html
✅ CORRECTO:
<button class="bg-primary text-on-primary text-label-sm">Mi Botón</button>
```

### Regla para IAs y Desarrolladores
**NUNCA** utilices la sintaxis de corchetes `text-[var(  --text-  )]` para aplicar tamaños de fuente del tema. Utiliza siempre la clase estática generada por Tailwind:
- Usa `text-label-sm` en lugar de la versión con corchetes.
- Usa `text-body-md` en lugar de la versión con corchetes.
- Usa `text-headline-md` en lugar de la versión con corchetes.
