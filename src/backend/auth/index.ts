import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@backend/db/mongoose";
import User from "@backend/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+passwordHash"
        );

        if (!user) {
          throw new Error("Invalid email or password");
        }
        if (user.status === "deleted") {
          throw new Error("Account deleted");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Email o contraseña incorrectos");
        }

        // Reactivar al iniciar sesión si estaba desactivada.
        if (user.status === "deactivated") {
          user.status = "active";
        }
        user.lastLoginAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: user.displayName || user.username,
          email: user.email,
          image: user.avatarUrl || null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/login", error: "/login" },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        await connectDB();
        const u = await User.findById(user.id).select("tokenVersion");
        token.tv = u?.tokenVersion ?? 0;
      } else if (token.id && trigger !== "update") {
        // Validación perezosa: si rotó tokenVersion (cambio pwd/email,
        // logout-all, desactivación, borrado), invalidamos la sesión.
        await connectDB();
        const u = await User.findById(token.id).select("tokenVersion status");
        if (!u || u.status === "deleted" || u.tokenVersion !== token.tv) {
          return null as never;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
