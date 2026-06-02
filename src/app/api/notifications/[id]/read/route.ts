import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { markNotificationRead } from "@backend/services/notifications.service";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withErrorHandler("PATCH /api/notifications/[id]/read", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const notification = await markNotificationRead(id, session.user.id);
    if (!notification) {
      return apiError("NOT_FOUND", "Notificación no encontrada");
    }

    return NextResponse.json({ success: true, notification });
});
