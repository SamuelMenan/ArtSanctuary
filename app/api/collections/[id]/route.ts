import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import { auth } from "@/auth";

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
