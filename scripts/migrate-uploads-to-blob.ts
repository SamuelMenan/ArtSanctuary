/**
 * Migración: public/uploads (FS local, gitignored) → Vercel Blob.
 *
 * Por qué: en prod el FS serverless es efímero/solo-lectura. Las imágenes
 * subidas antes de configurar Blob quedaron como URLs `/uploads/<file>.png`
 * persistidas en DB pero sin archivo servible → 404 (ej. boards Carnaval con
 * objetos `image`). Los bytes siguen en `public/uploads` de la máquina local.
 *
 * Qué hace:
 *   1. Sube cada archivo de public/uploads a Vercel Blob (key `uploads/<file>`).
 *   2. Recorre TODAS las colecciones y reemplaza cualquier string que sea
 *      `/uploads/<file>` por la URL pública de Blob (walk recursivo: solo toca
 *      hojas string, preserva ObjectId/Date/Number → no corrompe documentos).
 *
 * Uso:
 *   1. Crear Blob store en Vercel y poner BLOB_READ_WRITE_TOKEN en .env.local
 *      (o `vercel env pull .env.local`).
 *   2. npx tsx scripts/migrate-uploads-to-blob.ts          (dry-run, no escribe)
 *      npx tsx scripts/migrate-uploads-to-blob.ts --apply  (sube + escribe DB)
 *
 * Requiere: MONGODB_URI y BLOB_READ_WRITE_TOKEN en el entorno.
 * Idempotente: archivos ya subidos se re-suben (allowOverwrite) y las URLs ya
 * migradas (http…) no se tocan.
 */
import mongoose from "mongoose";
import { put } from "@vercel/blob";
import { readFile } from "fs/promises";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const APPLY = process.argv.includes("--apply");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function log(...a: unknown[]) {
  console.log(...a);
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) throw new Error("Falta MONGODB_URI en el entorno.");
  if (APPLY && !token) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN. Crea un Blob store en Vercel " +
        "(dashboard → Storage → Blob → conectar a art-sanctuary), luego " +
        "`vercel env pull .env.local` o pega el token en .env.local.",
    );
  }

  log(APPLY ? "▶ MODO APPLY (escribe a Blob y DB)\n" : "▶ DRY-RUN (no escribe nada)\n");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  // walk recursivo: aplica `fn` a cada hoja string; devuelve nº de hits.
  // `fn` puede devolver string (reemplazo) o undefined (sin cambio).
  function walk(node: unknown, fn: (s: string) => string | undefined): number {
    let hits = 0;
    if (Array.isArray(node)) {
      for (const v of node) hits += walk(v, fn);
    } else if (
      node &&
      typeof node === "object" &&
      !(node instanceof mongoose.Types.ObjectId) &&
      !(node instanceof Date)
    ) {
      const obj = node as Record<string, unknown>;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === "string") {
          const r = fn(v);
          if (r !== undefined) {
            obj[k] = r;
            hits++;
          }
        } else {
          hits += walk(v, fn);
        }
      }
    }
    return hits;
  }

  /* ── 1. Escaneo: recolectar URLs `/uploads/<file>` referenciadas en DB ── */
  const referenced = new Set<string>();
  for (const { name } of collections) {
    const cursor = db.collection(name).find({});
    for await (const doc of cursor) {
      walk(doc, (s) => {
        if (s.startsWith("/uploads/")) referenced.add(s);
        return undefined; // solo recolecta, no muta
      });
    }
  }
  log(`URLs /uploads referenciadas en DB: ${referenced.size}`);

  /* ── 2. Subir SOLO las referenciadas (que existan localmente) ── */
  const urlMap = new Map<string, string>(); // "/uploads/<file>" → blobUrl
  const missing: string[] = [];
  for (const localUrl of referenced) {
    const file = localUrl.replace(/^\/uploads\//, "");
    const ext = path.extname(file).toLowerCase();
    if (!CONTENT_TYPE[ext]) continue;
    const abs = path.join(UPLOADS_DIR, file);
    let buffer: Buffer;
    try {
      buffer = await readFile(abs);
    } catch {
      missing.push(localUrl); // referenciada pero el archivo local ya no está
      continue;
    }
    if (!APPLY) {
      urlMap.set(localUrl, `«blob»/uploads/${file}`);
      continue;
    }
    const blob = await put(`uploads/${file}`, buffer, {
      access: "public",
      contentType: CONTENT_TYPE[ext],
      token,
      allowOverwrite: true,
    });
    urlMap.set(localUrl, blob.url);
    log(`  ↑ ${file}`);
  }
  if (missing.length) {
    log(`\n⚠ ${missing.length} URL(s) referenciadas SIN archivo local (irrecuperables):`);
    for (const m of missing) log(`    ${m}`);
  }

  /* ── 3. Reescribir URLs en DB ── */
  let totalDocs = 0;
  let totalRefs = 0;
  for (const { name } of collections) {
    const col = db.collection(name);
    const cursor = col.find({});
    let colDocs = 0;
    let colRefs = 0;
    for await (const doc of cursor) {
      const refs = walk(doc, (s) => urlMap.get(s));
      if (refs > 0) {
        colDocs++;
        colRefs += refs;
        if (APPLY) await col.replaceOne({ _id: doc._id }, doc);
      }
    }
    if (colRefs > 0) {
      log(`  ${name}: ${colRefs} URL(s) en ${colDocs} doc(s)`);
      totalDocs += colDocs;
      totalRefs += colRefs;
    }
  }

  log(
    `\n${APPLY ? "✔ Aplicado" : "✔ Dry-run"}: ${totalRefs} referencia(s) en ${totalDocs} documento(s).`,
  );
  if (!APPLY && totalRefs > 0) log("Re-corre con --apply para escribir.");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("✖", e.message || e);
  process.exit(1);
});
