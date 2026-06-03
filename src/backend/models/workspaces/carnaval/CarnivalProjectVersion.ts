import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Versión de un Proyecto Carnaval (Fase 8). Snapshot inmutable del estado de
 * todos los planos (objetos + fondo) en un instante, para restaurar, comparar
 * o marcar la versión final.
 */
export interface IVersionPlano {
  view: string; // plano (frontal, jugadores, …)
  name: string;
  background: unknown;
  objects: unknown[];
  objectCount?: number;
}

export interface ICarnivalProjectVersion extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  owner: Types.ObjectId;
  label: string;
  isFinal: boolean;
  planos: IVersionPlano[];
  createdAt: Date;
  updatedAt: Date;
}

const VersionPlanoSchema = new Schema<IVersionPlano>(
  {
    view: { type: String, required: true },
    name: { type: String, default: "" },
    background: { type: Schema.Types.Mixed },
    objects: { type: [Schema.Types.Mixed], default: [] },
    objectCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const CarnivalProjectVersionSchema = new Schema<ICarnivalProjectVersion>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "CarnivalProject",
      required: true,
      index: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, trim: true, maxlength: 80, default: "Versión" },
    isFinal: { type: Boolean, default: false },
    planos: { type: [VersionPlanoSchema], default: [] },
  },
  { timestamps: true }
);

CarnivalProjectVersionSchema.index({ projectId: 1, createdAt: -1 });

const CarnivalProjectVersion: Model<ICarnivalProjectVersion> =
  mongoose.models.CarnivalProjectVersion ??
  mongoose.model<ICarnivalProjectVersion>(
    "CarnivalProjectVersion",
    CarnivalProjectVersionSchema
  );

export default CarnivalProjectVersion;
