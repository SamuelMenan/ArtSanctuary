import { withErrorHandler } from "@backend/http/handler";
import { searchArtworks } from "@backend/services/artworks.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/artworks/search", async (req: NextRequest) => {
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
});
