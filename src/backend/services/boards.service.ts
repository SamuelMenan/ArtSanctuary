/**
 * Boards Service
 * Lógica de dominio de los Tableros Infinitos. Solo DB (POJOs vía `.lean()`).
 * Sin HTTP (`NextRequest`/`NextResponse`/`cookies`) ni React.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Board from "@backend/models/Board";
import {
  getCarnavalRule,
  carnavalGridSquareCm,
  isCarnavalModality,
  lateralMirrorTarget,
  mirrorBoardObjectsForLateral,
  type CarnavalModality,
} from "@shared/lib/workspaces/carnaval";
import type { BoardObject } from "@shared/lib/boards/types";

export type BoardWorkspaceInput = {
  kind?: "free" | "carnaval";
  modality?: string;
};

/** Límite de boards para el plan Free. */
export const MAX_FREE_BOARDS = 5;

/**
 * Metadatos de los boards SUELTOS del usuario (sin objetos), recientes primero.
 * Excluye los planos que pertenecen a un proyecto Workspace (tienen projectId);
 * esos se gestionan dentro de su proyecto, no en la lista general de boards.
 */
export async function getUserBoards(userId: string) {
  await connectDB();
  const boards = await Board.find({ owner: userId, projectId: { $exists: false } })
    .select("name isPrivate thumbnailUrl updatedAt createdAt")
    .sort({ updatedAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(boards));
}

/** Cuántos boards tiene el usuario (para el límite del plan Free). */
export async function countUserBoards(userId: string) {
  await connectDB();
  return Board.countDocuments({ owner: userId });
}

/** Crea un board vacío para el usuario. Workspace Carnaval ajusta cuadrícula. */
export async function createBoard(
  userId: string,
  data: { name?: string; isPrivate?: boolean; workspace?: BoardWorkspaceInput },
) {
  await connectDB();

  // Resuelve workspace válido (defensivo ante input del cliente).
  let workspace: { kind: "free" | "carnaval"; modality?: CarnavalModality } = {
    kind: "free",
  };
  let background: Record<string, unknown> | undefined;
  if (
    data.workspace?.kind === "carnaval" &&
    isCarnavalModality(data.workspace.modality)
  ) {
    const modality = data.workspace.modality;
    workspace = { kind: "carnaval", modality };
    // Cuadrícula sugerida por la modalidad (cm/cuadro sobre el boceto).
    background = { type: "grid", squareCm: carnavalGridSquareCm(getCarnavalRule(modality)) };
  }

  const board = await Board.create({
    name: data.name?.trim() || "Board sin título",
    isPrivate: data.isPrivate ?? false,
    owner: userId,
    workspace,
    ...(background ? { background } : {}),
  });
  return JSON.parse(JSON.stringify(board));
}

/** Board completo (con objetos) por id, o `null`. POJO. */
export async function getBoardById(id: string) {
  await connectDB();
  const board = await Board.findById(id).lean();
  return board
    ? (JSON.parse(JSON.stringify(board)) as Record<string, unknown> & { owner: string; isPrivate?: boolean })
    : null;
}

/** Aplica un parche al board si el usuario es el propietario. POJO o `null`. */
export async function updateBoard(
  id: string,
  ownerId: string,
  update: Record<string, unknown>,
) {
  await connectDB();
  const board = await Board.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: update },
    { returnDocument: 'after' },
  ).lean();
  return board ? JSON.parse(JSON.stringify(board)) : null;
}

type MirrorSourceBoard = {
  _id: string;
  projectId?: string;
  workspace?: { kind?: string; view?: string };
  objects: BoardObject[];
};

/**
 * Si el board pertenece a un proyecto Carnaval, es lateral derecho y el espejo
 * está activo, actualiza automáticamente el plano lateral izquierdo con las
 * imágenes seleccionadas en espejo.
 */
export async function syncCarnavalLateralMirror(ownerId: string, sourceBoard: MirrorSourceBoard) {
  if (!sourceBoard.projectId) return;
  if (sourceBoard.workspace?.kind !== 'carnaval') return;
  if (sourceBoard.workspace?.view !== 'lateralDer') return;

  const targetView = lateralMirrorTarget(sourceBoard.workspace.view);
  if (!targetView) return;

  await connectDB();

  // Find the target board (e.g., 'lateralIzq')
  const targetBoard = await Board.findOne({
    projectId: sourceBoard.projectId,
    owner: ownerId,
    'workspace.kind': 'carnaval',
    'workspace.view': targetView,
  }).lean();

  if (!targetBoard) return;

  // Generate new mirrored objects from the source board's selection
  const objectsToMirror = sourceBoard.objects.filter((o) => o.lateralMirror);
  const newMirroredObjects = mirrorBoardObjectsForLateral(objectsToMirror);

  // Get existing objects from the target board, excluding any that were previously mirrored
  const existingObjects = (targetBoard.objects as BoardObject[]) || [];
  const nonMirroredObjects = existingObjects.filter((obj) => !obj.mirroredFrom);

  // Combine the non-mirrored objects with the newly generated mirrored ones
  const finalObjects = [...nonMirroredObjects, ...newMirroredObjects];

  // Update the target board with the merged set of objects
  await Board.findByIdAndUpdate(targetBoard._id, { $set: { objects: finalObjects } }).lean();
}

/** Borra el board si el usuario es el propietario. `true` si se borró. */
export async function deleteBoard(id: string, ownerId: string) {
  await connectDB();
  const board = await Board.findOneAndDelete({ _id: id, owner: ownerId });
  return !!board;
}
