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

    // Política de contraseña reforzada (debe coincidir con la validación del cliente
    // en src/frontend/features/auth/components/validation.ts).
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return apiError(
        "VALIDATION_ERROR",
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
      );
    }

    const result = await registerUser({ username, email, password });
    if (result.status === "conflict") {
      // El cliente traduce estas claves i18n y resalta el campo correspondiente.
      const fieldKey =
        result.field === "email" ? "auth.emailAlreadyUsed" : "auth.usernameAlreadyUsed";
      return apiError(
        "CONFLICT",
        `Ya existe una cuenta con ese ${result.field}`,
        { [result.field]: fieldKey }
      );
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
});
