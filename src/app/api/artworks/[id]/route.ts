import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { deleteArtwork, getArtworkForView, updateArtwork } from "@backend/services/artworks.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, auth()]);
    const viewCookieName = `viewed_${id}`;

    const { artwork, setAnonCookie } = await getArtworkForView(id, {
      userId: session?.user?.id,
      alreadyViewedCookie: req.cookies.has(viewCookieName),
    });

    if (!artwork) {
      return apiError("NOT_FOUND", "Obra no encontrada");
    }

    const response = NextResponse.json(artwork);
    if (setAnonCookie) {
      response.cookies.set(viewCookieName, "true", {
        maxAge: 60 * 60 * 24, // 24 horas
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return response;
});

/**
 * Campos de metadata editables por el propio autor. Deliberadamente excluye
 * artistId, imageUrl, uploadDate, fileMeta, thumbnails y los campos sociales
 * (likes, likedBy, views, viewedBy, savedBy, comments) — antes el body
 * completo llegaba sin filtrar a updateArtwork(), que solo bloqueaba _id/
 * artistId/uploadDate/views/likes y dejaba likedBy/savedBy/viewedBy/comments
 * abiertos a sobreescritura por el propio usuario vía PUT.
 */
function pickEditableArtworkFields(body: Record<string, unknown>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.category === "string") update.category = body.category;
  if (typeof body.medium === "string") update.medium = body.medium;
  if (typeof body.technique === "string") update.technique = body.technique;
  if (Array.isArray(body.materials)) update.materials = body.materials;
  if (body.dimensions && typeof body.dimensions === "object") update.dimensions = body.dimensions;
  if (body.edition && typeof body.edition === "object") update.edition = body.edition;
  if (typeof body.signature === "boolean") update.signature = body.signature;
  if (typeof body.signatureLocation === "string") update.signatureLocation = body.signatureLocation;
  if (typeof body.provenance === "string") update.provenance = body.provenance;
  if (typeof body.visibility === "string") update.visibility = body.visibility;
  if (typeof body.altText === "string") update.altText = body.altText;
  if (body.licenseRights && typeof body.licenseRights === "object") update.licenseRights = body.licenseRights;
  if (Array.isArray(body.tags)) update.tags = body.tags;
  if (body.creationDate && typeof body.creationDate === "object") update.creationDate = body.creationDate;
  if (typeof body.artistProvidedDateText === "string") update.artistProvidedDateText = body.artistProvidedDateText;
  return update;
}

export const PUT = withErrorHandler("PUT /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const body = await req.json();
    const update = pickEditableArtworkFields(body);
    if (Object.keys(update).length === 0) {
      return apiError("VALIDATION_ERROR", "Nada que actualizar");
    }

    const result = await updateArtwork(id, session.user.id, update);
    if (result.status === "notfound") return apiError("NOT_FOUND", "Obra no encontrada");
    if (result.status === "forbidden") return apiError("FORBIDDEN", "No autorizado");
    return NextResponse.json(result.data);
});

export const DELETE = withErrorHandler("DELETE /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const result = await deleteArtwork(id, session.user.id);
    if (result.status === "notfound") return apiError("NOT_FOUND", "Obra no encontrada");
    if (result.status === "forbidden") return apiError("FORBIDDEN", "No autorizado");
    return NextResponse.json({ success: true });
});
