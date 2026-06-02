import { NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getUserNotifications } from "@backend/services/notifications.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getUserNotifications(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
