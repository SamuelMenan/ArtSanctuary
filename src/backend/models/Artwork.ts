import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Interfaz TypeScript ── */
export interface IArtwork extends Document {
  _id: Types.ObjectId;
  title: string;
  artistId: Types.ObjectId; // Referencia al autor
  uploadDate: Date; // Generado por el servidor
  
  creationDate?: {
    type: "exact" | "year" | "monthyear" | "range" | "approx";
    value: string;
    certainty?: "confirmed" | "estimated" | "desconocida";
  };
  artistProvidedDateText?: string;

  description?: string;
  category: "pintura" | "escultura" | "ilustracion" | "fotografia" | "otro";
  
  medium?: string;
  technique?: string;
  materials?: string[];
  
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit?: "cm" | "in" | "px" | "mm";
  };
  
  edition?: {
    type: "unique" | "limited" | "series";
    number?: number;
    total?: number;
  };
  signature?: boolean;
  signatureLocation?: string;
  provenance?: string;
  
  visibility: "public" | "unlisted" | "private";
  altText?: string;
  licenseRights?: {
    copyrightHolder?: string;
    licenseType?: "all-rights-reserved" | "cc-by" | "cc-by-nc";
    licenseUrl?: string;
  };
  
  tags: string[];
  
  // Medios y archivos
  imageUrl: string;
  fileMeta?: {
    filename?: string;
    mimeType?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
  };
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };

  // Funciones Sociales
  likes?: number;
  likedBy?: Types.ObjectId[];
  views?: number;
  viewedBy?: Types.ObjectId[];
  savedBy?: Types.ObjectId[];
  comments?: unknown[]; // Podría ser una subcolección, pero usamos array simple por ahora

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
      maxlength: [150, "Máximo 150 caracteres"],
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El autor es obligatorio"],
    },
    uploadDate: { type: Date, default: Date.now },

    creationDate: {
      type: { type: String, enum: ["exact", "year", "monthyear", "range", "approx"] },
      value: { type: String },
      certainty: { type: String, enum: ["confirmed", "estimated", "desconocida"] },
    },
    artistProvidedDateText: { type: String },

    description: { type: String, default: "", maxlength: 2000 },
    category: {
      type: String,
      enum: ["pintura", "escultura", "ilustracion", "fotografia", "otro"],
      default: "otro",
    },

    medium: { type: String },
    technique: { type: String },
    materials: [{ type: String }],

    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
      unit: { type: String, enum: ["cm", "in", "px", "mm"] },
    },

    edition: {
      type: { type: String, enum: ["unique", "limited", "series"] },
      number: { type: Number },
      total: { type: Number },
    },
    signature: { type: Boolean, default: false },
    signatureLocation: { type: String },
    provenance: { type: String },

    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
    },
    altText: { type: String },
    licenseRights: {
      copyrightHolder: { type: String },
      licenseType: { type: String, enum: ["all-rights-reserved", "cc-by", "cc-by-nc"] },
      licenseUrl: { type: String },
    },

    tags: [{ type: String, lowercase: true, trim: true }],

    // Medios
    imageUrl: { type: String, required: true },
    fileMeta: {
      filename: { type: String },
      mimeType: { type: String },
      sizeBytes: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    thumbnails: {
      small: { type: String },
      medium: { type: String },
      large: { type: String },
    },

    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      userName: { type: String },
      userAvatar: { type: String },
      text: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

// Índices
ArtworkSchema.index({ artistId: 1, visibility: 1 });
ArtworkSchema.index({ uploadDate: -1 });

/* ── Exportar ── */
const Artwork: Model<IArtwork> =
  mongoose.models.Artwork ?? mongoose.model<IArtwork>("Artwork", ArtworkSchema);

export default Artwork;
