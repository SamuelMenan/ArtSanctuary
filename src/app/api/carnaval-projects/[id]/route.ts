import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import {
  deleteProject,
  getProjectById,
  updateProject,
} from "@backend/services/workspaces/carnaval/carnaval-projects.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/carnaval-projects/[id] — proyecto + sus planos. */
export const GET = withErrorHandler(
  "GET /api/carnaval-projects/[id]",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const [session, project] = await Promise.all([auth(), getProjectById(id)]);
    if (!project) return apiError("NOT_FOUND", "No encontrado");

    const isOwner = session?.user?.id === project.owner.toString();
    if (!isOwner) return apiError("FORBIDDEN", "Proyecto privado");

    return NextResponse.json({ project, isOwner });
  },
);

/** PATCH /api/carnaval-projects/[id] — nombre, año o estado. Solo propietario. */
export const PATCH = withErrorHandler(
  "PATCH /api/carnaval-projects/[id]",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") update.name = body.name.trim().slice(0, 80) || "Proyecto sin título";
    if (typeof body.year === "number") update.year = body.year;
    if (["draft", "review", "ready"].includes(body.accreditationStatus))
      update.accreditationStatus = body.accreditationStatus;

    if (Object.keys(update).length === 0) return apiError("VALIDATION_ERROR", "Nada que actualizar");

    const project = await updateProject(id, session.user.id, update);
    if (!project) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ project });
  },
);

/** DELETE /api/carnaval-projects/[id] — borra el proyecto y sus planos. */
export const DELETE = withErrorHandler(
  "DELETE /api/carnaval-projects/[id]",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const ok = await deleteProject(id, session.user.id);
    if (!ok) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true });
  },
);
