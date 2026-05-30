import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  actorId: Types.ObjectId;
  artworkId?: Types.ObjectId;
  type: "like" | "comment" | "follow" | "save";
  read: boolean;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artworkId: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "save"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
