import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Interfaces TypeScript ── */
export interface IReference {
  imageUrl: string;
  caption: string;
  addedAt: Date;
}

export interface ICollection extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  isPrivate: boolean;
  references: IReference[];
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Sub-schema para cada referencia ── */
const ReferenceSchema = new Schema<IReference>(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ── Schema principal ── */
const CollectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, "El nombre de la colección es obligatorio"],
      trim: true,
      maxlength: [80, "Máximo 80 caracteres"],
    },
    description: { type: String, default: "", maxlength: 300 },

    // Privada = solo visible para el propietario (feature de plan Pro)
    isPrivate: { type: Boolean, default: false },

    // Referencias visuales guardadas
    references: [ReferenceSchema],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El propietario es obligatorio"],
    },
  },
  { timestamps: true }
);

// Índice para listar las colecciones de un usuario
CollectionSchema.index({ owner: 1 });

/* ── Exportar ── */
const Collection: Model<ICollection> =
  mongoose.models.Collection ??
  mongoose.model<ICollection>("Collection", CollectionSchema);

export default Collection;
