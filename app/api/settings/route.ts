import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";

export async function GET() {
  const r = await requireUser();
  if (!r.ok) return r.response;
  const u = r.user;
  return NextResponse.json({
    user: {
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      emailPendingChange: u.emailPendingChange ?? null,
      displayName: u.displayName,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      location: u.location,
      website: u.website,
      socials: u.socials,
      theme: u.theme,
      locale: u.locale,
      notificationSettings: u.notificationSettings,
      privacySettings: u.privacySettings,
      plan: u.plan,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
    },
  });
}
