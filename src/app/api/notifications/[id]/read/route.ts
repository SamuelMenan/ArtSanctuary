import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { markNotificationRead } from "@backend/services/notifications.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const notification = await markNotificationRead(id, session.user.id);
    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]/read]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
