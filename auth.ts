import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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
          throw new Error("Email y contraseña son obligatorios");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+passwordHash"
        );

        if (!user) {
          throw new Error("Email o contraseña incorrectos");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Email o contraseña incorrectos");
        }

        return {
          id: user._id.toString(),
          name: user.displayName || user.username,
          email: user.email,
          image: user.avatarUrl || null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // En el primer login, user está presente: guardamos el id en el token
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Pasamos el id del token a la session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
