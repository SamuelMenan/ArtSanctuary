import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Artwork from "@/models/Artwork";
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
    const filter: Record<string, unknown> = { isPublic: true };
    if (category && category !== "todas") {
      filter.category = category;
    }

    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username displayName avatarUrl")
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
    const { title, imageUrl, description, technique, dimensions, year, tags, category } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "title e imageUrl son obligatorios" },
        { status: 400 }
      );
    }

    await connectDB();

    const artwork = await Artwork.create({
      title,
      imageUrl,
      description: description ?? "",
      technique: technique ?? "",
      dimensions: dimensions ?? "",
      year,
      tags: tags ?? [],
      category: category ?? "otro",
      author: session.user.id,
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
