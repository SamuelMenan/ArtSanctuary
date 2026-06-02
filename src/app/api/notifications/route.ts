import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { getUserNotifications } from "@backend/services/notifications.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/notifications", async () => {
  const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const data = await getUserNotifications(session.user.id);
    return NextResponse.json(data);
});
