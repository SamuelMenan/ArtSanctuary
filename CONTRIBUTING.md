# Guía de Contribución — ArtSanctuary

Gracias por querer contribuir al proyecto. Este documento define las reglas mínimas para mantener el código ordenado y coherente.

---

## Requisitos Previos

Antes de tu primer commit, asegúrate de tener configurado el entorno local correctamente. Sigue los pasos del [README](./docs/README.md).

---

## Flujo de Trabajo con Git

### Ramas

Usamos un modelo de ramas simple:

| Rama        | Propósito                                                  |
|-------------|------------------------------------------------------------|
| `main`      | Código estable. Solo recibe merges desde `dev`.            |
| `dev`       | Rama de integración. Aquí se prueban los cambios antes de subir a `main`. |
| `feat/...`  | Nueva funcionalidad. Ej: `feat/artwork-upload`             |
| `fix/...`   | Corrección de bug. Ej: `fix/login-redirect`                |
| `docs/...`  | Cambios de documentación únicamente. Ej: `docs/update-readme` |

**Flujo estándar:**

```bash
# 1. Crear tu rama desde dev
git checkout dev
git pull origin dev
git checkout -b feat/nombre-de-tu-feature

# 2. Trabajar y commitear (ver convención de commits abajo)
git add .
git commit -m "feat: agrega formulario de subida de obra"

# 3. Subir la rama y abrir un Pull Request hacia dev
git push origin feat/nombre-de-tu-feature
```

> ⚠️ **Nunca hagas push directo a `main`.** Todo cambio entra por Pull Request.

---

## Convención de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) de forma simplificada:

```
<tipo>: <descripción corta en minúsculas>
```

| Tipo       | Cuándo usarlo                                          |
|------------|--------------------------------------------------------|
| `feat`     | Nueva funcionalidad                                    |
| `fix`      | Corrección de un bug                                   |
| `docs`     | Solo cambios en documentación                          |
| `style`    | Cambios de formato (espacios, comas) sin afectar lógica|
| `refactor` | Refactorización de código sin nueva funcionalidad      |
| `chore`    | Tareas de mantenimiento (deps, config)                 |

**Ejemplos válidos:**

```
feat: agrega componente ReferenceCard con hover reveal
fix: corrige redirección al login cuando la sesión expira
docs: actualiza instrucciones de instalación en README
chore: actualiza next.js a v14.2
```

**Ejemplos inválidos:**

```
arregle cosas          ❌  (sin tipo, vago)
FEAT: Nueva pagina     ❌  (mayúsculas)
fix: .                 ❌  (sin descripción)
```

---

## Estándares de Código

### JavaScript / JSX

- **Formato:** usa [Prettier](https://prettier.io/) con la config del proyecto (`.prettierrc`).
- **Linting:** corre `npm run lint` antes de abrir un PR. No se aceptan PRs con errores de ESLint.
- **Componentes:** un componente por archivo. El nombre del archivo debe coincidir con el del componente.

```jsx
// ✅ Correcto
// archivo: components/ui/Button.jsx
export default function Button({ children, ...props }) { ... }

// ❌ Incorrecto
// archivo: components/boton.jsx
export default function Btn({ children }) { ... }
```

### Tailwind CSS

- Usa **solo** los colores del tema `sanctuary` definidos en `tailwind.config.js`.
- No uses estilos inline ni clases arbitrarias sin justificación.
- Consulta la tabla de patrones en [`docs/frontend_react_tailwind.md`](./docs/frontend_react_tailwind.md).

### Estructura de archivos

- Componentes nuevos van en la subcarpeta de su dominio dentro de `components/`.
- Nuevos modelos de MongoDB van en `models/`.
- Nuevos endpoints van en `pages/api/` siguiendo la estructura REST existente.

---

## Abriendo un Pull Request

Al abrir un PR hacia `dev`, incluye en la descripción:

1. **¿Qué hace este cambio?** — Una o dos líneas explicando el objetivo.
2. **¿Cómo se prueba?** — Pasos para verificar que funciona correctamente.
3. **Capturas de pantalla** — Si el cambio afecta la UI, adjunta antes/después.

---

## Reportar un Bug

Abre un Issue en el repositorio con:

- **Título:** breve descripción del problema.
- **Pasos para reproducirlo:** numerados, lo más específico posible.
- **Comportamiento esperado vs comportamiento actual.**
- **Entorno:** sistema operativo, versión de Node.js, navegador.

---

*ArtSanctuary Demo v0.1.0 — Pasto, Nariño.*
