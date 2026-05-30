import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Notification from "@backend/models/Notification";
import { auth } from "@/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: resolvedParams.id, recipientId: session.user.id },
      { read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]/read]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
