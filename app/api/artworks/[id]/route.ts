import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await connectDB();
    
    // Buscar obra y popular autor
    const artwork = await Artwork.findById(resolvedParams.id)
      .populate("artistId", "username displayName avatarUrl")
      .lean();

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    const session = await auth();
    let shouldIncrementView = false;
    const cookieStore = req.cookies;
    const viewCookieName = `viewed_${resolvedParams.id}`;

    if (session?.user?.id) {
      const userId = session.user.id;
      // Verificar si el usuario ya vio la obra
      const alreadyViewed = await Artwork.exists({ _id: resolvedParams.id, viewedBy: userId });
      if (!alreadyViewed) {
        shouldIncrementView = true;
        // Se incrementa y se añade al array en background
        Artwork.findByIdAndUpdate(resolvedParams.id, {
          $inc: { views: 1 },
          $addToSet: { viewedBy: userId }
        }).exec();
      }
    } else {
      // Usuario no autenticado: usar cookie
      if (!cookieStore.has(viewCookieName)) {
        shouldIncrementView = true;
        Artwork.findByIdAndUpdate(resolvedParams.id, { $inc: { views: 1 } }).exec();
      }
    }

    const response = NextResponse.json(artwork);

    // Setear cookie si fue una nueva vista anónima
    if (shouldIncrementView && !session?.user?.id) {
      response.cookies.set(viewCookieName, 'true', {
        maxAge: 60 * 60 * 24, // 24 horas
        httpOnly: true,
        sameSite: 'lax'
      });
    }

    return response;
  } catch (error) {
    console.error("[GET /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();
    const artwork = await Artwork.findById(resolvedParams.id);

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    if (artwork.artistId.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    
    // Actualizar campos
    const mutableArtwork = artwork as typeof artwork & Record<string, unknown>;
    Object.keys(body).forEach(key => {
      if (key !== '_id' && key !== 'artistId' && key !== 'uploadDate' && key !== 'views' && key !== 'likes') {
        mutableArtwork[key] = body[key];
      }
    });

    await artwork.save();

    return NextResponse.json(artwork);
  } catch (error) {
    console.error("[PUT /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();
    const artwork = await Artwork.findById(resolvedParams.id);

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    if (artwork.artistId.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await Artwork.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
