import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import { auth } from "@/auth";

export const runtime = "nodejs";

/**
 * GET /api/boards/[id]
 * Devuelve el board completo (objetos incluidos). Respeta privacidad.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    await connectDB();
    const board = await Board.findById(id).lean();
    if (!board) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const isOwner = session?.user?.id === board.owner.toString();
    if (board.isPrivate && !isOwner) {
      return NextResponse.json({ error: "Board privado" }, { status: 403 });
    }

    return NextResponse.json({ board: JSON.parse(JSON.stringify(board)), isOwner });
  } catch (error) {
    console.error("[GET /api/boards/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * PATCH /api/boards/[id]
 * Autosave: actualiza objetos, viewport, fondo, nombre o thumbnail.
 * Solo el propietario. Acepta cualquier subconjunto de campos editables.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    if (Array.isArray(body.objects)) update.objects = body.objects;
    if (body.viewport && typeof body.viewport === "object") update.viewport = body.viewport;
    if (body.background && typeof body.background === "object") update.background = body.background;
    if (typeof body.name === "string") update.name = body.name.trim().slice(0, 80) || "Board sin título";
    if (typeof body.isPrivate === "boolean") update.isPrivate = body.isPrivate;
    if (typeof body.thumbnailUrl === "string") update.thumbnailUrl = body.thumbnailUrl;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    await connectDB();
    const board = await Board.findOneAndUpdate(
      { _id: id, owner: session.user.id },
      { $set: update },
      { new: true }
    ).lean();

    if (!board) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ board: JSON.parse(JSON.stringify(board)) });
  } catch (error) {
    console.error("[PATCH /api/boards/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/boards/[id]
 * Borra el board. Solo el propietario.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();
    const board = await Board.findOneAndDelete({ _id: id, owner: session.user.id });
    if (!board) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/boards/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
