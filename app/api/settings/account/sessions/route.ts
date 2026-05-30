import { requireUser } from "@backend/auth/requireUser";
import { apiOk } from "@backend/http/errors";

// Estrategia JWT: rotamos tokenVersion. El callback de NextAuth debe rechazar
// tokens cuyo `tv` no coincida con el actual del usuario.
export async function DELETE() {
  const r = await requireUser();
  if (!r.ok) return r.response;

  r.user.tokenVersion += 1;
  await r.user.save();

  return apiOk({ tokenVersion: r.user.tokenVersion });
}
