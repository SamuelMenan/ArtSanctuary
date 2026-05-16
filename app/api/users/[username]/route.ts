import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Artwork from "@/models/Artwork";

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

    await connectDB();

    const user = await User.findOne({ username: username.toLowerCase() })
      .select("username displayName bio avatarUrl location plan createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Artista no encontrado" },
        { status: 404 }
      );
    }

    // Obras públicas del artista
    const artworks = await Artwork.find({
      author: user._id,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .select("title imageUrl thumbnailUrl category technique year createdAt")
      .lean();

    return NextResponse.json({ user, artworks });
  } catch (error) {
    console.error("[GET /api/users/:username]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
