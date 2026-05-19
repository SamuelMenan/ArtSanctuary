import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import { apiError } from "./errors";

export type AuthResult =
  | { ok: true; user: IUser }
  | { ok: false; response: ReturnType<typeof apiError> };

export async function requireUser(opts?: { withPassword?: boolean }): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: apiError("UNAUTHORIZED", "No autenticado") };
  }
  await connectDB();
  const query = User.findById(session.user.id);
  if (opts?.withPassword) query.select("+passwordHash");
  const user = await query;
  if (!user || user.status === "deleted") {
    return { ok: false, response: apiError("UNAUTHORIZED", "Sesión inválida") };
  }
  return { ok: true, user };
}
