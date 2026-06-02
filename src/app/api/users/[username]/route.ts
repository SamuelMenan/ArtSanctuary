import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@backend/services/users.service";

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]
 * Perfil público de un usuario + sus obras públicas.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;

    const profile = await getPublicProfile(username);
    if (!profile) {
      return NextResponse.json({ error: "Artista no encontrado" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[GET /api/users/:username]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
