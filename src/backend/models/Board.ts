import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Interfaces TypeScript ── */

/** Fondo del lienzo. 'grid' = papel milimetrado. */
export interface IBoardBackground {
  type: "grid" | "dots" | "plain";
  squareCm: number;
  color: string;
  opacity: number;
}

/**
 * Objeto del lienzo. Campos comunes + campos específicos por `type`.
 * Se guarda como Mixed para permitir formas heterogéneas sin migraciones.
 */
export interface IBoardObject {
  id: string; // uuid generado en cliente
  type: "image" | "text" | "sticky" | "rect" | "ellipse" | "line" | "arrow" | "freehand";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  // específicos (opcionales según type)
  src?: string;
  text?: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  gridVisible?: boolean;
}

export interface IBoardViewport {
  x: number;
  y: number;
  zoom: number;
}

/** Workspace del board: Board Libre o modalidad Carnaval (Corpocarnaval). */
export interface IBoardWorkspace {
  kind: "free" | "carnaval";
  modality?: "disfraz" | "comparsa" | "carroAlegorico" | "carroza";
  view?:
    | "frontal"
    | "posterior"
    | "lateralIzq"
    | "lateralDer"
    | "superior"
    | "bastidores"
    | "jugadores";
}

export interface IBoard extends Document {
  _id: Types.ObjectId;
  name: string;
  isPrivate: boolean;
  lateralMirrorEnabled: boolean;
  background: IBoardBackground;
  objects: IBoardObject[];
  viewport: IBoardViewport;
  workspace: IBoardWorkspace;
  projectId?: Types.ObjectId;
  thumbnailUrl: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Sub-schemas ── */
const BackgroundSchema = new Schema<IBoardBackground>(
  {
    type: { type: String, enum: ["grid", "dots", "plain"], default: "grid" },
    squareCm: { type: Number, default: 2 },
    color: { type: String, default: "#ffffff" },
    opacity: { type: Number, default: 30 },
  },
  { _id: false }
);

const ViewportSchema = new Schema<IBoardViewport>(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema<IBoardWorkspace>(
  {
    kind: { type: String, enum: ["free", "carnaval"], default: "free" },
    modality: {
      type: String,
      enum: ["disfraz", "comparsa", "carroAlegorico", "carroza"],
    },
    view: {
      type: String,
      enum: [
        "frontal",
        "posterior",
        "lateralIzq",
        "lateralDer",
        "superior",
        "bastidores",
        "jugadores",
      ],
    },
  },
  { _id: false }
);

/**
 * Objeto del lienzo. `strict: false` permite campos específicos por tipo
 * (src, text, fill…) sin declararlos todos ni migrar al añadir tipos nuevos.
 */
const BoardObjectSchema = new Schema<IBoardObject>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 0 },
    h: { type: Number, default: 0 },
    rotation: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  { _id: false, strict: false }
);

/* ── Schema principal ── */
const BoardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: [true, "El nombre del board es obligatorio"],
      trim: true,
      maxlength: [80, "Máximo 80 caracteres"],
      default: "Board sin título",
    },

    // Privado = solo visible para el propietario
    isPrivate: { type: Boolean, default: false },
    // Espejo automático entre laterales (solo aplica a planos lateralIzq/lateralDer).
    lateralMirrorEnabled: { type: Boolean, default: false },

    background: { type: BackgroundSchema, default: () => ({}) },

    // Objetos del lienzo. Sub-schema flexible (strict:false).
    objects: { type: [BoardObjectSchema], default: [] },

    viewport: { type: ViewportSchema, default: () => ({}) },

    workspace: { type: WorkspaceSchema, default: () => ({ kind: "free" }) },

    // Proyecto Carnaval (Fase 3): este board es un plano del proyecto.
    projectId: { type: Schema.Types.ObjectId, ref: "CarnivalProject", index: true },

    thumbnailUrl: { type: String, default: "" },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El propietario es obligatorio"],
    },
  },
  { timestamps: true }
);

// Índice para listar los boards de un usuario
BoardSchema.index({ owner: 1, updatedAt: -1 });

/* ── Exportar ── */
const Board: Model<IBoard> =
  mongoose.models.Board ?? mongoose.model<IBoard>("Board", BoardSchema);

export default Board;
