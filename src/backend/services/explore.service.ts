/**
 * Explore Service
 * Datos de la pantalla de exploración (tendencias, categorías, novedades).
 * Solo DB (POJOs). Sin HTTP.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import User from "@backend/models/User";
import { ARTWORKS_TAG } from "./artworks.service";

/**
 * Tags/categorías en tendencia + obras recientes + artistas destacados.
 * Cacheado (tag `artworks`, revalida 60s y al mutar obras).
 */
export const getExploreTrending = unstable_cache(
  async () => {
    await connectDB();

    // Tags trending (simulado; en producción: aggregation sobre Artwork.tags).
    const trendingTags = [
      "explore.tags.abstract", "explore.tags.portrait", "explore.tags.landscape", "explore.tags.surrealism",
      "explore.tags.oil", "explore.tags.monochromatic", "explore.tags.architecture", "explore.tags.nature",
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

    return {
      trendingTags,
      categories,
      recentArtworks: JSON.parse(JSON.stringify(recentArtworks)),
      featuredArtists: JSON.parse(JSON.stringify(featuredArtists)),
    };
  },
  ["explore-trending"],
  { tags: [ARTWORKS_TAG], revalidate: 60 },
);
