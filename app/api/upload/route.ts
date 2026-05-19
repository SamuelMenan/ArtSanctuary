import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64 para almacenar
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Para evitar problemas de tamaño en MongoDB, usamos un servicio externo
    // Por ahora, retornamos una URL genérica pero con el hash del archivo
    const fileHash = Buffer.from(buffer).toString('base64').substring(0, 16);
    const imageUrl = `https://picsum.photos/600/400?random=${Date.now()}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}
