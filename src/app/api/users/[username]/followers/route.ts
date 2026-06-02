import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getFollowConnections } from "@backend/services/users.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: id } = await params;

    const data = await getFollowConnections(id, "followers");
    if (!data) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const session = await auth();
    const isOwner = session?.user?.id === id;
    if (!data.allowFollow && !isOwner) {
      return NextResponse.json({ error: "Lista privada" }, { status: 403 });
    }

    return NextResponse.json({ users: data.users });
  } catch (error) {
    console.error("[GET /api/users/:id/followers]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
