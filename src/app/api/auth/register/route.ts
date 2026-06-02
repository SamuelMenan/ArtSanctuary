import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@backend/services/auth.service";

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con username, email y password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // Validación básica
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "username, email y password son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const result = await registerUser({ username, email, password });
    if (result.status === "conflict") {
      return NextResponse.json(
        { error: `Ya existe una cuenta con ese ${result.field}` },
        { status: 409 }
      );
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);

    // Errores de validación de Mongoose
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
