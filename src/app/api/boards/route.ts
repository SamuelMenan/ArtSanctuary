import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getUserBoards, countUserBoards, createBoard, MAX_FREE_BOARDS } from "@backend/services/boards.service";

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

    const boards = await getUserBoards(session.user.id);
    return NextResponse.json({ boards });
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

    // TODO: verificar plan del usuario para ajustar límite
    const count = await countUserBoards(session.user.id);
    if (count >= MAX_FREE_BOARDS) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_FREE_BOARDS} boards. Actualiza a Alma Creativa para crear más.`,
        },
        { status: 403 }
      );
    }

    const board = await createBoard(session.user.id, { name, isPrivate });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/boards]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
