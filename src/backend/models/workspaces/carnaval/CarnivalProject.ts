import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Proyecto de Workspace. Modelo general de proyectos de ArtSanctuary
 * (Fase 3 + refactor Workspace): agrupa varios Boards bajo un `kind`.
 * - kind 'carnaval': proyecto de acreditación Corpocarnaval (modality/year).
 * - kind 'libre': proyecto estándar (boards libres). [stub, próximamente]
 *
 * Nota: la colección se mantiene como "carnivalprojects" para conservar datos
 * y rutas existentes; el modelo es conceptualmente "Project".
 */
export type AccreditationStatus = "draft" | "review" | "ready";
export type ProjectKind = "libre" | "carnaval";

export interface ICarnivalProject extends Document {
  _id: Types.ObjectId;
  kind: ProjectKind;
  name: string;
  /** Solo proyectos carnaval. */
  modality?: "disfraz" | "comparsa" | "carroAlegorico" | "carroza";
  year: number;
  accreditationStatus: AccreditationStatus;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CarnivalProjectSchema = new Schema<ICarnivalProject>(
  {
    kind: {
      type: String,
      enum: ["libre", "carnaval"],
      default: "carnaval",
    },
    name: {
      type: String,
      required: [true, "El nombre del proyecto es obligatorio"],
      trim: true,
      maxlength: [80, "Máximo 80 caracteres"],
      default: "Proyecto sin título",
    },
    modality: {
      type: String,
      enum: ["disfraz", "comparsa", "carroAlegorico", "carroza"],
    },
    year: { type: Number, default: 2027 },
    accreditationStatus: {
      type: String,
      enum: ["draft", "review", "ready"],
      default: "draft",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El propietario es obligatorio"],
    },
  },
  { timestamps: true }
);

CarnivalProjectSchema.index({ owner: 1, updatedAt: -1 });

const CarnivalProject: Model<ICarnivalProject> =
  mongoose.models.CarnivalProject ??
  mongoose.model<ICarnivalProject>("CarnivalProject", CarnivalProjectSchema);

export default CarnivalProject;
