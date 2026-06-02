import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { getFollowConnections } from "@backend/services/users.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/users/[username]/followers", async (_req: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
  const { username: id } = await params;

    const data = await getFollowConnections(id, "followers");
    if (!data) {
      return apiError("NOT_FOUND", "Usuario no encontrado");
    }

    const session = await auth();
    const isOwner = session?.user?.id === id;
    if (!data.allowFollow && !isOwner) {
      return apiError("FORBIDDEN", "Lista privada");
    }

    return NextResponse.json({ users: data.users });
});
