import { NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { markAllNotificationsRead } from "@backend/services/notifications.service";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/notifications/read-all]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
