import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Notification from "@backend/models/Notification";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("actorId", "username displayName avatarUrl")
      .populate("artworkId", "title imageUrl")
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
