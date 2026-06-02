import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { registerUser } from "@backend/services/auth.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler("POST /api/auth/register", async (req: NextRequest) => {
  const body = await req.json();
    const { username, email, password } = body;

    // Validación básica
    if (!username || !email || !password) {
      return apiError("VALIDATION_ERROR", "username, email y password son obligatorios");
    }

    if (password.length < 6) {
      return apiError("VALIDATION_ERROR", "La contraseña debe tener al menos 6 caracteres");
    }

    const result = await registerUser({ username, email, password });
    if (result.status === "conflict") {
      return apiError("CONFLICT", `Ya existe una cuenta con ese ${result.field}`);
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
});
