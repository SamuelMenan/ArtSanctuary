---
title: "Feature: Auth UI (login/registro)"
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Feature: Auth UI

> **Ubicación:** `src/frontend/features/auth/`. Distinto de
> [`../architecture/auth.md`](../architecture/auth.md), que cubre sesión/JWT
> del lado servidor — este doc es la UI de login y registro.

## Anatomy

`AuthFlow.tsx` es el contenedor unificado de `/login` y `/register` —
**una sola página con dos modos**, no dos rutas independientes:

```
LoginScreen  → <AuthFlow initialMode="login" />
RegisterScreen → <AuthFlow initialMode="register" />

AuthFlow
  ├── AuthAside          (panel decorativo, solo desktop, compartido)
  └── LoginForm | RegisterForm   (transición animada al cambiar de modo)
```

Cambiar de modo (el link "¿No tienes cuenta? Regístrate") **no navega ni
remonta** — `AuthFlow` mantiene el panel lateral fijo y solo anima la
tarjeta del formulario (elemento compartido, `cardSwap` de
`@frontend/shared/motion/tokens`), sincronizando la URL con
`history.replaceState` y respetando back/forward del navegador
(`popstate`). Patrón de referencia citado en `glossary.md` para
transiciones entre vistas que comparten layout.

## Componentes

| Componente | Rol |
|---|---|
| `AuthFlow.tsx` | Estado de modo (`login`\|`register`) + dirección de transición + sync de URL/historial. |
| `AuthAside.tsx` | Panel decorativo lateral, compartido, solo desktop. Nota: usa una imagen de fondo externa (Unsplash) hardcodeada, no un asset local. |
| `LoginForm.tsx` | `signIn('credentials', ...)` de NextAuth. Valida email + password no vacío (`validateLoginPassword` — no aplica la política de fuerza, solo requiere algo escrito). |
| `RegisterForm.tsx` | `POST /api/auth/register`. Valida username, email, password (política completa) y confirmación. |
| `FormField.tsx` | Input genérico con label + error, base de los forms. |
| `PasswordField.tsx` | Input de password con toggle mostrar/ocultar. |
| `PasswordStrength.tsx` | Medidor visual (`weak`/`medium`/`strong`) sobre `evaluatePassword()`. |
| `validation.ts` | Reglas compartidas Login+Registro. Sin dependencias — funciones puras que devuelven clave i18n o `null`. |

## Validación

`validation.ts` es la única fuente de las reglas de cliente — **debe
mantenerse sincronizada a mano** con el validador del servidor en
`src/app/api/auth/register/route.ts` (comentario explícito en ambos
archivos, verificado 2026-08-14 que hoy SÍ coinciden):

- Password: mínimo 8 caracteres + 1 mayúscula + 1 número (`PASSWORD_MIN_LENGTH = 8`).
- Username: mínimo 3 caracteres (`USERNAME_MIN_LENGTH = 3`).
- Email: regex simple `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- Login usa una regla más laxa para password (`validateLoginPassword`): solo
  exige que no esté vacío — no re-valida la política de cuentas antiguas
  creadas antes de reforzarla.

Cada validador devuelve una **clave i18n**, no un string — el componente la
pasa a `t()`. Esto es intencional para no romper el escaneo de
`npm run i18n:scan`.

## Flujo de submit (ambos forms)

1. `setAttempted(true)` — fuerza mostrar errores aunque el campo no se haya tocado (`touched`).
2. Si hay error de validación → foco automático al primer campo inválido (`emailRef`/`passwordRef`), no se envía la request.
3. Si pasa validación cliente → request (`signIn` o `fetch POST`).
4. Error de servidor (`CONFLICT` en registro, credenciales inválidas en login) → `formError`, banner con `shake` (motion token).
5. Éxito → `success` state (breve, antes de redirigir/refrescar router).

## Registro — contrato de servidor

Ver [`../architecture/auth.md`](../architecture/auth.md#registro) para el
detalle del endpoint y `registerUser()` (`src/backend/services/auth.service.ts`).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: `AuthFlow.tsx`, `LoginForm.tsx`, `AuthAside.tsx`,
  `validation.ts`, `LoginScreen.tsx` leídos directamente. Política de
  password confirmada idéntica cliente/servidor comparando `validation.ts`
  contra `src/app/api/auth/register/route.ts`.
