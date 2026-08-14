---
title: Local setup
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Local setup

Onboarding objetivo: **dev nuevo corriendo la app en menos de 30 min**.

## Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 20.x LTS | Necesario por `next@16` y `mongoose@9` |
| npm | 10.x | Viene con Node 20 |
| MongoDB | 6.x | Local (`mongod`) **o** Atlas free tier |
| Git | cualquiera reciente | |

## Pasos

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd ArtSanctuary
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```bash
# Local
MONGODB_URI=mongodb://localhost:27017/artsanctuary

# o Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/artsanctuary

# Genera con:  npx auth secret
AUTH_SECRET=<random-32+ chars>
```

Variables opcionales (no requeridas para correr la app en local):

- `AUTH_URL` — solo en producción.
- `BLOB_READ_WRITE_TOKEN` — necesaria para que la subida de imágenes (avatar,
  obras) funcione contra Vercel Blob. Sin ella, sube en local con el fallback
  a filesystem. Ver [`../ops/env.md`](../ops/env.md).

### 3. Datos de prueba (opcional, recomendado)

```bash
npm run seed
```

Pobla la DB con usuarios + obras + colecciones de demo.

> Si modificas `src/backend/models/User.ts` y el seed no refleja los cambios,
> abrir `scripts/seed.ts` y sincronizar. El seed define su propio schema
> simplificado (no importa el de `src/backend/models/`).

### 4. Arrancar dev server

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 5. Login con usuario seed

Credenciales por defecto (ver `scripts/seed.ts`):

| Email | Password |
|---|---|
| `demo@artsanctuary.dev` | `demo1234` |

## Scripts disponibles

```bash
npm run dev      # Next dev server (hot reload)
npm run build    # Build producción
npm run start    # Servir build
npm run lint     # ESLint
npm run seed     # Poblar DB demo
```

## MCP server (opcional)

```bash
cd mcp
npm install
npm start                       # stdio transport
```

Ver [`../../mcp/README.md`](../../mcp/README.md).

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `MongooseError: bufferCommands timed out` | `MONGODB_URI` no resuelve | Verificar URL + red |
| `[next-auth] AUTH_SECRET missing` | `.env.local` no leído o vacío | Confirmar archivo + `npx auth secret` |
| `Module not found: '@/...'` | Path alias roto | Verificar `tsconfig.json paths` + reiniciar dev |
| Cambios en `src/backend/models/` no aplican | Mongoose cache de modelos | Reiniciar dev (`delete mongoose.models.X` ya está en cada schema) |
| Avatar upload 413 | Archivo > 3MB | Reducir tamaño |
| Subida de imágenes falla en local | Falta `BLOB_READ_WRITE_TOKEN` | Ver [`../ops/env.md`](../ops/env.md) |

## Estructura del repo

Ver [`../architecture/estructura-optimizada.md`](../architecture/estructura-optimizada.md)
para el detalle completo y las reglas por carpeta.

```
.
├── src/
│   ├── app/              # Next App Router (pages + api)
│   ├── backend/          # auth, db, http, models, services, upload
│   ├── frontend/         # features/ (UI por dominio) + shared/ (ui, i18n, lib)
│   └── shared/            # i18n, lib isomórficos
├── docs/                 # Esta documentación
├── mcp/                  # Servidor MCP
├── public/               # Assets estáticos
├── scripts/seed.ts       # Seeder DB
└── tsconfig.json         # Alias @backend/* @frontend/* @shared/*
```

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
