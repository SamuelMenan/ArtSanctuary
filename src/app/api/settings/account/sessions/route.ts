import { requireUser } from "@backend/auth/requireUser";
import { apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";

// Estrategia JWT: rotamos tokenVersion. El callback de NextAuth debe rechazar
// tokens cuyo `tv` no coincida con el actual del usuario.
export const DELETE = withErrorHandler("DELETE /api/settings/account/sessions", async () => {
  const r = await requireUser();
  if (!r.ok) return r.response;

  r.user.tokenVersion += 1;
  await r.user.save();

  return apiOk({ tokenVersion: r.user.tokenVersion });
});
