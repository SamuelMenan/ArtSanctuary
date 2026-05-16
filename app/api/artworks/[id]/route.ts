import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Artwork from "@/models/Artwork";
import { auth } from "@/auth";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/artworks/[id]
 * Detalle de una obra por ID.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await connectDB();

    const artwork = await Artwork.findById(id)
      .populate("author", "username displayName avatarUrl location plan")
      .lean();

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("[GET /api/artworks/:id]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * PUT /api/artworks/[id]
 * Edita una obra existente. Solo el autor puede editar.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await connectDB();

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    if (artwork.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      "title", "description", "imageUrl", "thumbnailUrl",
      "technique", "dimensions", "year", "tags", "category", "isPublic",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (artwork as Record<string, unknown>)[field] = body[field];
      }
    }

    await artwork.save();

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("[PUT /api/artworks/:id]", error);
    return NextResponse.json({ error: "Error al editar la obra" }, { status: 500 });
  }
}

/**
 * DELETE /api/artworks/[id]
 * Elimina una obra. Solo el autor puede eliminar.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await connectDB();

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    if (artwork.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await artwork.deleteOne();

    return NextResponse.json({ message: "Obra eliminada" });
  } catch (error) {
    console.error("[DELETE /api/artworks/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la obra" }, { status: 500 });
  }
}
