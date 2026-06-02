import { withErrorHandler } from "@backend/http/handler";
import { getExploreTrending } from "@backend/services/explore.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/explore/trending", async () => {
  const data = await getExploreTrending();
    return NextResponse.json(data);
});
