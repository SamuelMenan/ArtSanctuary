import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import { auth } from "@/auth";

/**
 * GET /api/artworks
 * Lista obras públicas con paginación.
 * Query params: page (default 1), limit (default 20, max 50), category (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    // Filtro base: solo obras públicas
    const filter: Record<string, unknown> = { visibility: "public" };
    if (category && category !== "todas") {
      filter.category = category;
    }

    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("artistId", "username displayName avatarUrl")
        .lean(),
      Artwork.countDocuments(filter),
    ]);

    return NextResponse.json({
      artworks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/artworks]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/artworks
 * Crea una nueva obra. Requiere sesión activa.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      imageUrl, 
      description, 
      category,
      creationDate,
      artistProvidedDateText,
      medium,
      technique,
      materials,
      dimensions,
      edition,
      signature,
      signatureLocation,
      provenance,
      visibility,
      altText,
      licenseRights,
      tags
    } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "title e imageUrl son obligatorios" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generar fileMeta (simulado para el servidor)
    const fileMeta = {
      filename: `artwork_${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      sizeBytes: Math.floor(Math.random() * 2000000) + 100000, // Simulación
    };

    // Thumbnails simulados
    const thumbnails = {
      small: imageUrl,
      medium: imageUrl,
      large: imageUrl,
    };

    console.log("[POST /api/artworks] Creating artwork with:", {
      title,
      artistId: session.user.id,
      visibility: visibility ?? "public",
      category: category ?? "otro",
    });

    const artwork = await Artwork.create({
      title,
      imageUrl,
      artistId: session.user.id,
      uploadDate: new Date(),
      creationDate,
      artistProvidedDateText,
      description: description ?? "",
      category: category ?? "otro",
      medium,
      technique,
      materials: materials ?? [],
      dimensions,
      edition,
      signature,
      signatureLocation,
      provenance,
      visibility: visibility ?? "public",
      altText,
      licenseRights,
      tags: tags ?? [],
      fileMeta,
      thumbnails
    });

    return NextResponse.json({ artwork }, { status: 201 });
    console.log("[POST /api/artworks] Created artwork:", {
      _id: artwork._id,
      title: artwork.title,
      visibility: artwork.visibility,
      artistId: artwork.artistId,
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/artworks]", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error al crear la obra" },
      { status: 500 }
    );
  }
}
