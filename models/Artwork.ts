import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Interfaz TypeScript ── */
export interface IArtwork extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  technique: string;
  dimensions: string;
  year?: number;
  tags: string[];
  category: "pintura" | "escultura" | "ilustracion" | "fotografia" | "otro";
  isPublic: boolean;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema ── */
const ArtworkSchema = new Schema<IArtwork>(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      maxlength: [120, "Máximo 120 caracteres"],
    },
    description: { type: String, default: "", maxlength: 1000 },

    // URL pública de la imagen (almacenada en servicio externo, ej. Cloudinary)
    imageUrl: {
      type: String,
      required: [true, "La URL de la imagen es obligatoria"],
    },
    thumbnailUrl: { type: String, default: "" },

    // Metadatos técnicos de la obra
    technique: { type: String, default: "" }, // Ej: "Óleo sobre lienzo"
    dimensions: { type: String, default: "" }, // Ej: "60 x 80 cm"
    year: { type: Number },

    // Categorías para filtrado en la galería
    tags: [{ type: String, lowercase: true, trim: true }],
    category: {
      type: String,
      enum: ["pintura", "escultura", "ilustracion", "fotografia", "otro"],
      default: "otro",
    },

    // Visibilidad
    isPublic: { type: Boolean, default: true },

    // Referencia al artista autor
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El autor es obligatorio"],
    },
  },
  { timestamps: true }
);

// Índice compuesto para búsquedas rápidas por autor + visibilidad
ArtworkSchema.index({ author: 1, isPublic: 1 });
// Índice para ordenar por fecha de creación (galería)
ArtworkSchema.index({ createdAt: -1 });

/* ── Exportar ── */
const Artwork: Model<IArtwork> =
  mongoose.models.Artwork ?? mongoose.model<IArtwork>("Artwork", ArtworkSchema);

export default Artwork;
