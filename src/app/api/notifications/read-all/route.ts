import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Notification from "@backend/models/Notification";
import { auth } from "@backend/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();

    await Notification.updateMany(
      { recipientId: session.user.id, read: false },
      { read: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/notifications/read-all]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
