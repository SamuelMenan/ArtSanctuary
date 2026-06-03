import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import {
  deleteVersion,
  markFinal,
  restoreVersion,
} from "@backend/services/workspaces/carnaval/carnaval-versions.service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST .../versions/[vid] — restaura el snapshot sobre los planos del proyecto. */
export const POST = withErrorHandler(
  "POST /api/carnaval-projects/[id]/versions/[vid]",
  async (req: NextRequest, { params }: { params: Promise<{ vid: string }> }) => {
    const [{ vid }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const ok = await restoreVersion(vid, session.user.id);
    if (!ok) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true });
  },
);

/** PATCH .../versions/[vid] — marca como versión final. */
export const PATCH = withErrorHandler(
  "PATCH /api/carnaval-projects/[id]/versions/[vid]",
  async (req: NextRequest, { params }: { params: Promise<{ vid: string }> }) => {
    const [{ vid }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const ok = await markFinal(vid, session.user.id);
    if (!ok) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true });
  },
);

/** DELETE .../versions/[vid] — borra la versión. */
export const DELETE = withErrorHandler(
  "DELETE /api/carnaval-projects/[id]/versions/[vid]",
  async (req: NextRequest, { params }: { params: Promise<{ vid: string }> }) => {
    const [{ vid }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const ok = await deleteVersion(vid, session.user.id);
    if (!ok) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true });
  },
);
