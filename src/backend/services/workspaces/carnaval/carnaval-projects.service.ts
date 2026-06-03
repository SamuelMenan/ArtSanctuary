/**
 * Carnaval Projects Service (Fase 3)
 * Dominio de los Proyectos de Acreditación. Un proyecto agrupa varios Boards
 * (planos), uno por vista. Solo DB (POJOs vía `.lean()`); sin HTTP ni React.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Board from "@backend/models/Board";
import CarnivalProject from "@backend/models/workspaces/carnaval/CarnivalProject";
import {
  getCarnavalRule,
  isCarnavalModality,
  planoLabel,
  planosForModality,
  type CarnavalModality,
  type CarnavalPlano,
} from "@shared/lib/workspaces/carnaval";

/** Límite de proyectos para el plan Free. */
export const MAX_FREE_PROJECTS = 3;

/** Metadatos de los proyectos del usuario, recientes primero. */
export async function getUserProjects(userId: string) {
  await connectDB();
  const projects = await CarnivalProject.find({ owner: userId })
    .sort({ updatedAt: -1 })
    .lean();
  return projects;
}

/** Cuántos proyectos tiene el usuario (límite del plan Free). */
export async function countUserProjects(userId: string) {
  await connectDB();
  return CarnivalProject.countDocuments({ owner: userId });
}

/**
 * Crea un proyecto y sus planos (un Board por vista) en la modalidad dada.
 * Devuelve `null` si la modalidad es inválida.
 */
export async function createCarnivalProject(
  userId: string,
  data: { name?: string; modality: string; year?: number },
) {
  if (!isCarnavalModality(data.modality)) return null;
  await connectDB();

  const modality: CarnavalModality = data.modality;
  const rule = getCarnavalRule(modality);

  const project = await CarnivalProject.create({
    kind: "carnaval",
    name: data.name?.trim() || `${rule.label} ${data.year ?? 2027}`,
    modality,
    year: data.year ?? 2027,
    owner: userId,
  });

  // Un Board por plano (vistas + especiales según modalidad), configurado con
  // su escala/cuadrícula y plano.
  await Board.insertMany(
    planosForModality(modality).map((view) => ({
      name: planoLabel(view),
      owner: userId,
      projectId: project._id,
      workspace: { kind: "carnaval", modality, view },
      background: { type: "grid", squareCm: rule.gridSquareCm },
    })),
  );

  return project;
}

/** Proyecto + sus planos (metadatos de board, ordenados por vista). POJO o `null`. */
export async function getProjectById(id: string) {
  await connectDB();
  const project = await CarnivalProject.findById(id).lean();
  if (!project) return null;

  const boards = await Board.find({ projectId: id })
    .select("name thumbnailUrl updatedAt workspace")
    .lean();

  // Orden estable por plano reglamentario de la modalidad.
  const planos = planosForModality(project.modality as CarnavalModality);
  const order = new Map<CarnavalPlano, number>(planos.map((v, i) => [v, i]));
  boards.sort(
    (a, b) =>
      (order.get((a.workspace?.view as CarnavalPlano) ?? "frontal") ?? 99) -
      (order.get((b.workspace?.view as CarnavalPlano) ?? "frontal") ?? 99),
  );

  return { ...project, boards } as Record<string, unknown> & { owner: string };
}

/** Aplica un parche al proyecto si el usuario es propietario. POJO o `null`. */
export async function updateProject(
  id: string,
  ownerId: string,
  update: Record<string, unknown>,
) {
  await connectDB();
  const project = await CarnivalProject.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: update },
    { returnDocument: "after" },
  ).lean();
  return project ? project : null;
}

/** Borra el proyecto y sus planos (cascada) si el usuario es propietario. */
export async function deleteProject(id: string, ownerId: string) {
  await connectDB();
  const project = await CarnivalProject.findOneAndDelete({ _id: id, owner: ownerId });
  if (!project) return false;
  await Board.deleteMany({ projectId: id, owner: ownerId });
  return true;
}
