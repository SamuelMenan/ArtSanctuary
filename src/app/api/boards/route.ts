import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { countUserBoards, createBoard, getUserBoards, MAX_FREE_BOARDS } from "@backend/services/boards.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/boards
 * Lista los boards del usuario autenticado (sin objetos, solo metadatos).
 */
export const GET = withErrorHandler("GET /api/boards", async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("UNAUTHORIZED", "No autenticado");
  }

  const boards = await getUserBoards(session.user.id);
  return NextResponse.json({ boards });
});

/**
 * POST /api/boards
 * Crea un board vacío. Usuarios Free: máximo 5 boards.
 */
export const POST = withErrorHandler("POST /api/boards", async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("UNAUTHORIZED", "No autenticado");
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
});

