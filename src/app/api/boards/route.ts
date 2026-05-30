import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Board from "@backend/models/Board";
import { auth } from "@backend/auth";

export const runtime = "nodejs";

/**
 * GET /api/boards
 * Lista los boards del usuario autenticado (sin objetos, solo metadatos).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();

    const boards = await Board.find({ owner: session.user.id })
      .select("name isPrivate thumbnailUrl updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ boards: JSON.parse(JSON.stringify(boards)) });
  } catch (error) {
    console.error("[GET /api/boards]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/boards
 * Crea un board vacío. Usuarios Free: máximo 5 boards.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, isPrivate } = body;

    await connectDB();

    // Límite de boards para plan Free
    const count = await Board.countDocuments({ owner: session.user.id });
    // TODO: verificar plan del usuario para ajustar límite
    const MAX_FREE_BOARDS = 5;
    if (count >= MAX_FREE_BOARDS) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_FREE_BOARDS} boards. Actualiza a Alma Creativa para crear más.`,
        },
        { status: 403 }
      );
    }

    const board = await Board.create({
      name: name?.trim() || "Board sin título",
      isPrivate: isPrivate ?? false,
      owner: session.user.id,
    });

    return NextResponse.json({ board: JSON.parse(JSON.stringify(board)) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/boards]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
