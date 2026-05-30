import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@backend/db/mongoose";
import User from "@backend/models/User";

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

    await connectDB();

    // Verificar duplicados
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "email" : "username";
      return NextResponse.json(
        { error: `Ya existe una cuenta con ese ${field}` },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: username,
    });

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          plan: user.plan,
        },
      },
      { status: 201 }
    );
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
