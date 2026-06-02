/**
 * Auth Service
 * Registro de cuentas (hash de contraseña, control de duplicados).
 * Solo DB. Sin HTTP.
 */
import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@backend/db/mongoose";
import User from "@backend/models/User";

export type RegisterResult =
  | { status: "conflict"; field: "email" | "username" }
  | { status: "ok"; user: { id: string; username: string; email: string; plan: unknown } };

/** Crea un usuario si email/username no existen. Hashea la contraseña. */
export async function registerUser(input: { username: string; email: string; password: string }): Promise<RegisterResult> {
  await connectDB();
  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const field = existingUser.email === email ? "email" : "username";
    return { status: "conflict", field };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    username: username.trim(),
    email: email.trim(),
    passwordHash,
    displayName: input.username,
  });

  return {
    status: "ok",
    user: { id: user._id.toString(), username: user.username, email: user.email, plan: user.plan },
  };
}
