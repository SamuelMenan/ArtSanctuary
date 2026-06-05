import "server-only";
import { put, del } from "@vercel/blob";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

/**
 * Almacenamiento híbrido de imágenes:
 *  - Producción (Vercel): si hay BLOB_READ_WRITE_TOKEN → Vercel Blob (CDN, persistente).
 *  - Desarrollo local: sin token → escribe en `public/uploads` (FS local escribible).
 *
 * El FS serverless de Vercel es de solo lectura salvo /tmp, por eso en prod
 * SIEMPRE debe existir el token. En local evita tener que configurar Blob.
 */
const hasBlob = () => process.env.NODE_ENV === 'production' && !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Guarda un buffer y devuelve su URL pública.
 * @param key  ruta lógica, p.ej. "uploads/avatars/123.png"
 */
export async function saveImage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (hasBlob()) {
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  }

  // En producción NUNCA debe usarse el fallback local: el FS serverless es de
  // solo lectura (salvo /tmp, que no se sirve), así que escribir devolvería una
  // URL relativa muerta que se persiste en DB y luego da 404. Fallar claro aquí
  // evita corromper datos y señala que falta BLOB_READ_WRITE_TOKEN en Vercel.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Almacenamiento de imágenes no configurado: falta BLOB_READ_WRITE_TOKEN en el entorno de producción.",
    );
  }

  // Fallback local (solo desarrollo): public/<key>
  const abs = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return `/${key}`;
}

/**
 * Borra una imagen previamente guardada por su URL.
 * Tolera URLs externas/inexistentes.
 */
export async function deleteImage(url: string): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("http")) {
      // URL de Blob (o externa): solo Blob sabe borrarla.
      if (hasBlob()) {
        await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      return;
    }
    // Ruta local /uploads/...
    const abs = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await unlink(abs);
  } catch {
    // ya no existe o no se puede borrar — ignorar
  }
}
