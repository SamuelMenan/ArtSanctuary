import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { followUser, unfollowUser } from "@backend/services/users.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    if (followerId === followingId) {
      return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    const result = await followUser(followerId, followingId);
    if (!result) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({ success: true, followersCount: result.followersCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    const result = await unfollowUser(followerId, followingId);
    if (!result) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({ success: true, followersCount: result.followersCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
