import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { deleteBoard, getBoardById, syncCarnavalLateralMirror, updateBoard } from "@backend/services/boards.service";
import type { BoardObject } from "@shared/lib/boards/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isBoardObjectArray(value: unknown): value is BoardObject[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Partial<BoardObject>;
      return (
        typeof obj.id === "string" &&
        typeof obj.type === "string" &&
        typeof obj.x === "number" &&
        typeof obj.y === "number" &&
        typeof obj.w === "number" &&
        typeof obj.h === "number" &&
        typeof obj.rotation === "number" &&
        typeof obj.z === "number"
      );
    })
  );
}

/**
 * GET /api/boards/[id]
 * Devuelve el board completo (objetos incluidos). Respeta privacidad.
 */
export const GET = withErrorHandler("GET /api/boards/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, board] = await Promise.all([auth(), getBoardById(id)]);
  if (!board) return apiError("NOT_FOUND", "No encontrado");

  const isOwner = session?.user?.id === board.owner.toString();
  if (board.isPrivate && !isOwner) {
    return apiError("FORBIDDEN", "Board privado");
  }

  return NextResponse.json({ board, isOwner });
});

/**
 * PATCH /api/boards/[id]
 * Autosave: actualiza objetos, viewport, fondo, nombre o thumbnail.
 * Solo el propietario. Acepta cualquier subconjunto de campos editables.
 */
export const PATCH = withErrorHandler("PATCH /api/boards/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) {
    return apiError("UNAUTHORIZED", "No autenticado");
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (Array.isArray(body.objects)) update.objects = body.objects;
  if (body.viewport && typeof body.viewport === "object") update.viewport = body.viewport;
  if (body.background && typeof body.background === "object") update.background = body.background;
  if (body.workspace && typeof body.workspace === "object") update.workspace = body.workspace;
  if (typeof body.name === "string") update.name = body.name.trim().slice(0, 80) || "Board sin título";
  if (typeof body.isPrivate === "boolean") update.isPrivate = body.isPrivate;
  if (typeof body.lateralMirrorEnabled === "boolean") update.lateralMirrorEnabled = body.lateralMirrorEnabled;
  if (typeof body.thumbnailUrl === "string") update.thumbnailUrl = body.thumbnailUrl;

  if (Object.keys(update).length === 0) {
    return apiError("VALIDATION_ERROR", "Nada que actualizar");
  }

  const board = await updateBoard(id, session.user.id, update);
  if (!board) return apiError("NOT_FOUND", "No encontrado");

  if (isBoardObjectArray(update.objects)) {
    await syncCarnavalLateralMirror(session.user.id, board, update.objects);
  }

  return NextResponse.json({ board });
});

/**
 * DELETE /api/boards/[id]
 * Borra el board. Solo el propietario.
 */
export const DELETE = withErrorHandler("DELETE /api/boards/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) {
    return apiError("UNAUTHORIZED", "No autenticado");
  }

  const ok = await deleteBoard(id, session.user.id);
  if (!ok) return apiError("NOT_FOUND", "No encontrado");
  return NextResponse.json({ success: true });
});
