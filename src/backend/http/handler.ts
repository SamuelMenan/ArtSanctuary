import { NextRequest, NextResponse } from "next/server";
import { apiError } from "./errors";

export type AppRouteHandler<C = any> = (
  req: NextRequest,
  ctx: C
) => Promise<Response> | Response;

/**
 * Envuelve un handler: cualquier excepción → log + 500 con el shape heredado.
 * Atrapa excepciones inesperadas (500), mientras los handlers devuelven explícitamente 401/403/etc.
 */
export function withErrorHandler<C = any>(
  tag: string,
  fn: AppRouteHandler<C>
): AppRouteHandler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      console.error(`[${tag}]`, error);
      return apiError("INTERNAL_ERROR", "Error interno del servidor");
    }
  };
}
