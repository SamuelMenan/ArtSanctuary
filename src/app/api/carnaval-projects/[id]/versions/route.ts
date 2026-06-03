import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { createVersion, listVersions } from "@backend/services/workspaces/carnaval/carnaval-versions.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/carnaval-projects/[id]/versions — lista de versiones (metadatos). */
export const GET = withErrorHandler(
  "GET /api/carnaval-projects/[id]/versions",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const versions = await listVersions(id, session.user.id);
    if (versions === null) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ versions });
  },
);

/** POST /api/carnaval-projects/[id]/versions — crea un snapshot del proyecto. */
export const POST = withErrorHandler(
  "POST /api/carnaval-projects/[id]/versions",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const body = await req.json().catch(() => ({}));
    const version = await createVersion(id, session.user.id, body.label);
    if (!version) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ version }, { status: 201 });
  },
);
