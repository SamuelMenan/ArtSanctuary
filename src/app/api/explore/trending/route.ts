import { NextResponse } from "next/server";
import { getExploreTrending } from "@backend/services/explore.service";

export async function GET() {
  try {
    const data = await getExploreTrending();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/explore/trending]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
