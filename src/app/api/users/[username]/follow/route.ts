import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { followUser, unfollowUser } from "@backend/services/users.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler("POST /api/users/[username]/follow", async (req: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
  const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    if (followerId === followingId) {
      return apiError("VALIDATION_ERROR", "No puedes seguirte a ti mismo");
    }

    const result = await followUser(followerId, followingId);
    if (!result) return apiError("NOT_FOUND", "Usuario no encontrado");

    return NextResponse.json({ success: true, followersCount: result.followersCount });
});

export const DELETE = withErrorHandler("DELETE /api/users/[username]/follow", async (req: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
  const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    const result = await unfollowUser(followerId, followingId);
    if (!result) return apiError("NOT_FOUND", "Usuario no encontrado");

    return NextResponse.json({ success: true, followersCount: result.followersCount });
});
