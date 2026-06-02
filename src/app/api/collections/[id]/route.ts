import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getCollectionById, deleteCollection, renameCollection } from "@backend/services/collections.service";

/**
 * GET /api/collections/[id]
 * Devuelve la colección con sus artworks poblados (incluye imageUrl/thumbnails)
 * y sus referencias. Respeta privacidad: una colección privada solo la ve su dueño.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();

    const collection = await getCollectionById(resolvedParams.id);
    if (!collection) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const isOwner = session?.user?.id === collection.owner.toString();
    if (collection.isPrivate && !isOwner) {
      return NextResponse.json({ error: "Colección privada" }, { status: 403 });
    }

    return NextResponse.json({ collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const ok = await deleteCollection(resolvedParams.id, session.user.id);
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
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
    const collection = await renameCollection(resolvedParams.id, session.user.id, name);
    if (!collection) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, collection });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
