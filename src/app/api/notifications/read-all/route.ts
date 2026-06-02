import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { markAllNotificationsRead } from "@backend/services/notifications.service";
import { NextResponse } from "next/server";

export const PATCH = withErrorHandler("PATCH /api/notifications/read-all", async () => {
  const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ success: true });
});
