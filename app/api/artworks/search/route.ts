import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Artwork from "@/models/Artwork";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const medium = searchParams.get("medium");
    const technique = searchParams.get("technique");
    const tags = searchParams.get("tags");
    
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const filter: any = { visibility: "public" };

    // Búsqueda de texto (título, descripción, tags, etc.)
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { medium: { $regex: q, $options: "i" } },
        { technique: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    if (category && category !== "todas") {
      filter.category = category;
    }
    
    if (medium) {
      filter.medium = { $regex: medium, $options: "i" };
    }
    
    if (technique) {
      filter.technique = { $regex: technique, $options: "i" };
    }
    
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagsArray.map(t => new RegExp(t, 'i')) };
    }

    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .sort({ uploadDate: -1 }) // o { _id: -1 } para reciente
        .skip(skip)
        .limit(limit)
        .populate("artistId", "username displayName avatarUrl")
        .lean(),
      Artwork.countDocuments(filter),
    ]);

    return NextResponse.json({
      artworks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/artworks/search]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
