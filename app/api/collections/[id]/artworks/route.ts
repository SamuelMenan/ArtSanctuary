import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Collection from "@backend/models/Collection";
import Artwork from "@backend/models/Artwork";
import { auth } from "@/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    const { artworkId } = await req.json();
    await connectDB();
    
    const collection = await Collection.findOneAndUpdate(
      { _id: resolvedParams.id, owner: session.user.id },
      { $addToSet: { artworks: artworkId } },
      { new: true }
    );
    if (!collection) return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });
    
    // Also add to savedBy in Artwork for quick reference
    await Artwork.findByIdAndUpdate(artworkId, { $addToSet: { savedBy: session.user.id } });
    
    return NextResponse.json({ success: true, collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    const url = new URL(req.url);
    const artworkId = url.searchParams.get('artworkId');
    if (!artworkId) return NextResponse.json({ error: "Falta artworkId" }, { status: 400 });
    
    await connectDB();
    
    const collection = await Collection.findOneAndUpdate(
      { _id: resolvedParams.id, owner: session.user.id },
      { $pull: { artworks: artworkId } },
      { new: true }
    );
    if (!collection) return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });
    
    // Check if it's in any other collection
    const otherCollections = await Collection.findOne({ owner: session.user.id, artworks: artworkId });
    if (!otherCollections) {
      await Artwork.findByIdAndUpdate(artworkId, { $pull: { savedBy: session.user.id } });
    }
    
    return NextResponse.json({ success: true, collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
