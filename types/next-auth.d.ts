import { DefaultSession } from "next-auth";

/**
 * Extensión de tipos de NextAuth para incluir el `id` del usuario
 * en la session y en el JWT token.
 */
declare module "next-auth" {
  interface User {
    role: "user" | "admin";
  }

  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
  }
}
