import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { addArtworkToCollection, removeArtworkFromCollection } from "@backend/services/collections.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { artworkId } = await req.json();
    const collection = await addArtworkToCollection(resolvedParams.id, session.user.id, artworkId);
    if (!collection) return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });

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

    const collection = await removeArtworkFromCollection(resolvedParams.id, session.user.id, artworkId);
    if (!collection) return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });

    return NextResponse.json({ success: true, collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
