import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISocialLinks {
  twitter?: string;
  instagram?: string;
  behance?: string;
  artstation?: string;
  tiktok?: string;
}

export interface INotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  saves: boolean;
  weeklyDigest: boolean;
}

export interface IPrivacySettings {
  profilePublic: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  allowFollow: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  emailPendingChange?: string | null;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  location: string;
  website: string;
  socials: ISocialLinks;
  plan: "free" | "pro";
  theme: "dark" | "light" | "system";
  locale: "es" | "en";
  notificationSettings: INotificationSettings;
  privacySettings: IPrivacySettings;
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  tokenVersion: number;
  status: "active" | "deactivated" | "deleted";
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SocialsSchema = new Schema<ISocialLinks>(
  {
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    behance: { type: String, default: "" },
    artstation: { type: String, default: "" },
    tiktok: { type: String, default: "" },
  },
  { _id: false }
);

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    saves: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
  },
  { _id: false }
);

const PrivacySettingsSchema = new Schema<IPrivacySettings>(
  {
    profilePublic: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    allowMessages: { type: Boolean, default: true },
    allowFollow: { type: Boolean, default: true },
  },
  { _id: false }
);

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
    emailPendingChange: { type: String, default: null, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, default: "", maxlength: 60 },
    bio: { type: String, default: "", maxlength: 300 },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "Pasto, Nariño", maxlength: 80 },
    website: { type: String, default: "", maxlength: 200 },
    socials: { type: SocialsSchema, default: () => ({}) },

    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
    locale: { type: String, enum: ["es", "en"], default: "es" },

    notificationSettings: { type: NotificationSettingsSchema, default: () => ({}) },
    privacySettings: { type: PrivacySettingsSchema, default: () => ({}) },

    plan: { type: String, enum: ["free", "pro"], default: "free" },

    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    tokenVersion: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "deactivated", "deleted"], default: "active" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

delete mongoose.models.User;
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
