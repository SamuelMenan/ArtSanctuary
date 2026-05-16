import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Interfaz TypeScript ── */
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  location: string;
  plan: "free" | "pro";
  following: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema ── */
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "Mínimo 3 caracteres"],
      maxlength: [30, "Máximo 30 caracteres"],
      match: [/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guiones bajos"],
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Nunca se devuelve en queries por defecto
    },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 300 },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "Pasto, Nariño" },

    // Modelo freemium "Alma Creativa"
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    // Artistas que este usuario sigue
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

/* ── Exportar (con protección contra re-compilación en hot-reload) ── */
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
