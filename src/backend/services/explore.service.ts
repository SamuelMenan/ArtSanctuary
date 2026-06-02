/**
 * Explore Service
 * Datos de la pantalla de exploración (tendencias, categorías, novedades).
 * Solo DB (POJOs). Sin HTTP.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import User from "@backend/models/User";

/** Tags/categorías en tendencia + obras recientes + artistas destacados. */
export async function getExploreTrending() {
  await connectDB();

  // Tags trending (simulado; en producción: aggregation sobre Artwork.tags).
  const trendingTags = [
    "abstracto", "retrato", "paisaje", "surrealismo",
    "óleo", "monocromático", "arquitectura", "naturaleza",
  ];

  const categoryCounts = await Artwork.aggregate([
    { $match: { visibility: "public" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const categories = categoryCounts.map((c) => ({ name: c._id || "otras", count: c.count }));

  const recentArtworks = await Artwork.find({ visibility: "public" })
    .sort({ uploadDate: -1 })
    .limit(6)
    .populate("artistId", "username displayName avatarUrl")
    .lean();

  const featuredArtists = await User.find({})
    .limit(4)
    .select("username displayName avatarUrl")
    .lean();

  return { trendingTags, categories, recentArtworks, featuredArtists };
}
