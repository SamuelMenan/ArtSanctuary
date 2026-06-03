import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathArray = resolvedParams.path;
    
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Prevenir path traversal (ej. ../../)
    const safePath = path.normalize(pathArray.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");
    
    // Construir la ruta absoluta apuntando a storage/uploads/...
    const abs = path.join(UPLOADS_DIR, safePath);

    if (!fs.existsSync(abs)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const file = await readFile(abs);
    
    // Determinar el Content-Type basado en la extensión
    const ext = path.extname(abs).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".svg") contentType = "image/svg+xml";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[GET /uploads]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
