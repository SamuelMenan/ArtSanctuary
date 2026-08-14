# `.plans/` — material que no describe el código actual

Todo lo que hay aquí **estuvo en `docs/`** hasta el 2026-08-14. Se movió, no se
abandonó: sigue versionado en git y sigue siendo consultable.

## Por qué está fuera de `docs/`

`docs/` tiene una sola regla: **describe el estado actual y verificable del
código**. Un agente IA (o una persona nueva) debe poder leerlo entero y confiar
en cada línea.

Este material no cumple esa regla, y mezclarlo tenía un coste medible: `docs/`
pesaba ~219k tokens, más que la ventana de contexto de muchos modelos. Solo
esta carpeta era el 55%.

Cada subcarpeta falla la regla por un motivo distinto:

| Carpeta | Qué es | Por qué no es `docs/` |
|---|---|---|
| `pr/` | Planes de implementación | Describen **intenciones**, no lo que hay. Un agente que busca "cómo funciona X" y encuentra un plan puede documentar algo que nunca se construyó. |
| `historical/` | Planes ya ejecutados y auditorías point-in-time | Describen el **pasado**. Correctos en su fecha, engañosos hoy. |
| `helps/` | Prompts de generación de las láminas de Canon | No es documentación técnica: es material de producción de assets. |
| `business/` | Visión de producto y comunicados de Corpocarnaval | Explica el **porqué** del proyecto, no el cómo del código. Incluye PNGs escaneados pesados. |

## Cuándo mirar aquí

- **`pr/`** — antes de empezar un trabajo grande, para ver si ya hay un plan.
  Ojo: un plan no es prueba de que algo esté implementado. Verificar contra el
  código.
- **`historical/`** — para entender *por qué* algo se hizo así. Para saber
  cómo es hoy, `docs/`.
- Para arqueología real, `git log` sobre el archivo en cuestión.

## Regla al mover cosas de vuelta

Si un plan de `pr/` se implementa, **no se mueve a `docs/`**: se escribe (o se
actualiza) el doc de referencia correspondiente en `docs/`, y el plan pasa a
`historical/`. Son dos artefactos distintos, no el mismo en dos estados.
