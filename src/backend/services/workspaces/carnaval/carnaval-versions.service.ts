/**
 * Carnaval Versions Service (Fase 8)
 * Snapshots de un proyecto: crear, listar, restaurar, marcar final, borrar.
 * Solo DB (POJOs); sin HTTP ni React.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Board from "@backend/models/Board";
import CarnivalProject from "@backend/models/workspaces/carnaval/CarnivalProject";
import CarnivalProjectVersion from "@backend/models/workspaces/carnaval/CarnivalProjectVersion";

/** ¿El usuario es dueño del proyecto? */
async function ownsProject(projectId: string, userId: string) {
  const project = await CarnivalProject.findOne({ _id: projectId, owner: userId })
    .select("_id")
    .lean();
  return !!project;
}

/**
 * Crea una versión: snapshot de objetos + fondo de todos los planos del
 * proyecto. Devuelve la versión (sin objetos) o `null` si no es propietario.
 */
export async function createVersion(projectId: string, userId: string, label?: string) {
  await connectDB();
  if (!(await ownsProject(projectId, userId))) return null;

  const boards = await Board.find({ projectId, owner: userId })
    .select("name workspace background objects")
    .lean();

  const planos = boards.map((b) => ({
    view: b.workspace?.view ?? "frontal",
    name: b.name,
    background: b.background,
    objects: b.objects ?? [],
    objectCount: (b.objects ?? []).length,
  }));

  const version = await CarnivalProjectVersion.create({
    projectId,
    owner: userId,
    label: label?.trim() || `Versión ${new Date().toLocaleDateString("es")}`,
    planos,
  });

  return versionMeta(version.toObject() as unknown as Record<string, unknown>);
}

/** Metadatos de una versión (sin los objetos pesados): conteos por plano. */
function versionMeta(v: Record<string, unknown>) {
  const planos = (v.planos as { view: string; name: string; objects?: unknown[], objectCount?: number }[]) ?? [];
  return {
    _id: v._id,
    label: v.label,
    isFinal: v.isFinal ?? false,
    createdAt: v.createdAt,
    planos: planos.map((p) => ({ 
      view: p.view, 
      name: p.name, 
      objectCount: p.objectCount ?? (p.objects ? p.objects.length : 0) 
    })),
  };
}

/** Lista de versiones del proyecto (metadatos), recientes primero. */
export async function listVersions(projectId: string, userId: string) {
  await connectDB();
  if (!(await ownsProject(projectId, userId))) return null;
  const versions = await CarnivalProjectVersion.find({ projectId, owner: userId })
    .select("-planos.objects -planos.background")
    .sort({ createdAt: -1 })
    .lean();
  return versions.map((v) => versionMeta(v as unknown as Record<string, unknown>));
}

/**
 * Restaura una versión: reescribe objetos + fondo de cada plano del proyecto
 * con el snapshot. Planos sin board correspondiente se omiten.
 */
export async function restoreVersion(versionId: string, userId: string) {
  await connectDB();
  const version = await CarnivalProjectVersion.findOne({ _id: versionId, owner: userId }).lean();
  if (!version) return false;

  // Mapear vista→board del proyecto y reescribir por _id (evita filtros dotted).
  const boards = await Board.find({ projectId: version.projectId, owner: userId })
    .select("_id workspace")
    .lean();
  const byView = new Map<string, (typeof boards)[number]["_id"]>(
    boards.map((b) => [b.workspace?.view ?? "", b._id]),
  );

  await Promise.all(
    version.planos.map((p) => {
      const boardId = byView.get(p.view);
      if (!boardId) return Promise.resolve();
      return Board.updateOne(
        { _id: boardId },
        { $set: { objects: p.objects, background: p.background } },
      );
    }),
  );
  return true;
}

/** Marca una versión como final (y desmarca las demás del proyecto). */
export async function markFinal(versionId: string, userId: string) {
  await connectDB();
  const version = await CarnivalProjectVersion.findOne({ _id: versionId, owner: userId })
    .select("projectId")
    .lean();
  if (!version) return false;

  await CarnivalProjectVersion.updateMany(
    { projectId: version.projectId, owner: userId },
    { $set: { isFinal: false } },
  );
  await CarnivalProjectVersion.updateOne({ _id: versionId, owner: userId }, { $set: { isFinal: true } });
  return true;
}

/** Borra una versión. */
export async function deleteVersion(versionId: string, userId: string) {
  await connectDB();
  const res = await CarnivalProjectVersion.findOneAndDelete({ _id: versionId, owner: userId });
  return !!res;
}
