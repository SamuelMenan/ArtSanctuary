import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Collection from "@backend/models/Collection";
import { auth } from "@/auth";

/**
 * GET /api/collections/[id]
 * Devuelve la colección con sus artworks poblados (incluye imageUrl/thumbnails)
 * y sus referencias. Respeta privacidad: una colección privada solo la ve su dueño.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();

    await connectDB();
    const collection = await Collection.findById(resolvedParams.id)
      .populate("artworks", "title imageUrl thumbnails")
      .lean();

    if (!collection) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const isOwner = session?.user?.id === collection.owner.toString();
    if (collection.isPrivate && !isOwner) {
      return NextResponse.json({ error: "Colección privada" }, { status: 403 });
    }

    return NextResponse.json({ collection: JSON.parse(JSON.stringify(collection)) });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    await connectDB();
    const collection = await Collection.findOneAndDelete({ _id: resolvedParams.id, owner: session.user.id });
    if (!collection) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    const { name } = await req.json();
    await connectDB();
    const collection = await Collection.findOneAndUpdate(
      { _id: resolvedParams.id, owner: session.user.id },
      { name },
      { new: true }
    );
    if (!collection) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
