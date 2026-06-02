import { NextRequest, NextResponse } from "next/server";
import { searchArtworks } from "@backend/services/artworks.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const { artworks, total } = await searchArtworks({
      page,
      limit,
      q: searchParams.get("q") || "",
      category: searchParams.get("category"),
      medium: searchParams.get("medium"),
      technique: searchParams.get("technique"),
      tags: searchParams.get("tags"),
    });

    return NextResponse.json({
      artworks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/artworks/search]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
