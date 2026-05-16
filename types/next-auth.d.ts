import { DefaultSession } from "next-auth";

/**
 * Extensión de tipos de NextAuth para incluir el `id` del usuario
 * en la session y en el JWT token.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
