import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import User from "@backend/models/User";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: id } = await params;
    await connectDB();

    const target = await User.findById(id)
      .select("following privacySettings")
      .lean();
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const session = await auth();
    const isOwner = session?.user?.id === id;
    const allowFollow = target.privacySettings?.allowFollow ?? true;
    if (!allowFollow && !isOwner) {
      return NextResponse.json({ error: "Lista privada" }, { status: 403 });
    }

    const users = await User.find({ _id: { $in: target.following || [] } })
      .select("username displayName avatarUrl")
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        _id: u._id.toString(),
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      })),
    });
  } catch (error) {
    console.error("[GET /api/users/:id/following]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
