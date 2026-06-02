import { auth } from '@backend/auth';
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { saveImage } from '@backend/upload/storage';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const POST = withErrorHandler("POST /api/upload", async (request: NextRequest) => {
  const session = await auth();

    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", 'No autenticado');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError("VALIDATION_ERROR", 'No se proporcionó archivo');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("VALIDATION_ERROR", 'Tipo de archivo no soportado');
    }

    if (file.size > MAX_SIZE) {
      return apiError("VALIDATION_ERROR", 'Archivo demasiado grande (máx 10MB)');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = EXT_BY_MIME[file.type] || 'bin';
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const key = `uploads/${session.user.id}-${Date.now()}-${hash}.${ext}`;

    const imageUrl = await saveImage(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
});
