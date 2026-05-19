import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { auth } from "@/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    if (followerId === followingId) {
      return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    await connectDB();

    const userToFollow = await User.findByIdAndUpdate(
      followingId,
      { $addToSet: { followers: followerId } },
      { returnDocument: 'after' }
    );

    if (!userToFollow) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    await User.findByIdAndUpdate(
      followerId,
      { $addToSet: { following: followingId } }
    );

    const existingNotif = await Notification.findOne({ recipientId: followingId, actorId: followerId, type: "follow" });
    if (!existingNotif) {
      await Notification.create({
        recipientId: followingId,
        actorId: followerId,
        type: "follow",
      });
    }

    return NextResponse.json({ success: true, followersCount: userToFollow.followers?.length || 1 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    
    const followerId = session.user.id;
    const followingId = resolvedParams.username;

    await connectDB();

    const userToUnfollow = await User.findByIdAndUpdate(
      followingId,
      { $pull: { followers: followerId } },
      { returnDocument: 'after' }
    );

    if (!userToUnfollow) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    await User.findByIdAndUpdate(
      followerId,
      { $pull: { following: followingId } }
    );

    // Optional: remove the follow notification if they unfollow quickly
    await Notification.findOneAndDelete({ recipientId: followingId, actorId: followerId, type: "follow" });

    return NextResponse.json({ success: true, followersCount: userToUnfollow.followers?.length || 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
