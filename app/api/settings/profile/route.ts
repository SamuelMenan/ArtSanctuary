import { NextRequest } from "next/server";
import User from "@backend/models/User";
import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@/lib/api/errors";
import { validateProfile } from "@/lib/validation/settings";

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const result = validateProfile(body);
  if (!result.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", result.fields);

  const v = result.value;

  if (v.username && v.username !== r.user.username) {
    const exists = await User.findOne({ username: v.username, _id: { $ne: r.user._id } });
    if (exists) {
      return apiError("CONFLICT", "Ese nombre de usuario ya está en uso", {
        username: "Nombre no disponible",
      });
    }
  }

  if (v.displayName !== undefined) r.user.displayName = v.displayName;
  if (v.username !== undefined) r.user.username = v.username;
  if (v.bio !== undefined) r.user.bio = v.bio;
  if (v.location !== undefined) r.user.location = v.location;
  if (v.website !== undefined) r.user.website = v.website;
  if (v.socials !== undefined) {
    r.user.socials = { ...r.user.socials, ...v.socials };
  }

  await r.user.save();

  return apiOk({
    profile: {
      displayName: r.user.displayName,
      username: r.user.username,
      bio: r.user.bio,
      location: r.user.location,
      website: r.user.website,
      socials: r.user.socials,
    },
  });
}
