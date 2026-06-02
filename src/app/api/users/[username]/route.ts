import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { getPublicProfile } from "@backend/services/users.service";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export const GET = withErrorHandler("GET /api/users/[username]", async (req: NextRequest, { params }: RouteParams) => {
  const { username } = await params;

    const profile = await getPublicProfile(username);
    if (!profile) {
      return apiError("NOT_FOUND", "Artista no encontrado");
    }

    return NextResponse.json(profile);
});
