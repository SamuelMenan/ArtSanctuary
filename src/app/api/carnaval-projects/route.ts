import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import {
  countUserProjects,
  createCarnivalProject,
  getUserProjects,
  MAX_FREE_PROJECTS,
} from "@backend/services/workspaces/carnaval/carnaval-projects.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/carnaval-projects — lista los proyectos del usuario. */
export const GET = withErrorHandler("GET /api/carnaval-projects", async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

  const projects = await getUserProjects(session.user.id);
  return NextResponse.json({ projects });
});

/** POST /api/carnaval-projects — crea un proyecto y sus planos. */
export const POST = withErrorHandler("POST /api/carnaval-projects", async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

  const body = await req.json().catch(() => ({}));
  const { name, modality, year } = body;

  const count = await countUserProjects(session.user.id);
  if (count >= MAX_FREE_PROJECTS) {
    return NextResponse.json(
      { error: `Has alcanzado el límite de ${MAX_FREE_PROJECTS} proyectos. Actualiza tu plan para crear más.` },
      { status: 403 },
    );
  }

  const project = await createCarnivalProject(session.user.id, { name, modality, year });
  if (!project) return apiError("VALIDATION_ERROR", "Modalidad inválida");
  return NextResponse.json({ project }, { status: 201 });
});
