import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Artwork from "@/models/Artwork";
import User from "@/models/User"; // Asumiendo que existe el modelo User

export async function GET() {
  try {
    await connectDB();

    // 1. Obtener tags trending (simulado extraídos de la base de datos)
    // En producción se podría usar un aggregation pipeline sobre Artwork.tags
    const trendingTags = [
      "abstracto", "retrato", "paisaje", "surrealismo", 
      "óleo", "monocromático", "arquitectura", "naturaleza"
    ];

    // 2. Obtener categorías con contadores (simulado o mediante aggregation)
    const categoryCounts = await Artwork.aggregate([
      { $match: { visibility: "public" } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    
    const categories = categoryCounts.map(c => ({
      name: c._id || "otras",
      count: c.count
    }));

    // 3. Obtener obras recientes (para el carrusel de novedades)
    const recentArtworks = await Artwork.find({ visibility: "public" })
      .sort({ uploadDate: -1 })
      .limit(6)
      .populate("artistId", "username displayName avatarUrl")
      .lean();

    // 4. Obtener artistas destacados (simulado)
    const featuredArtists = await User.find({})
      .limit(4)
      .select("username displayName avatarUrl")
      .lean();

    return NextResponse.json({
      trendingTags,
      categories,
      recentArtworks,
      featuredArtists
    });
  } catch (error) {
    console.error("[GET /api/explore/trending]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
