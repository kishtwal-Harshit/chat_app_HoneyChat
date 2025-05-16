import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      //required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    file: {
      url: { type: String },          // Link to the stored file
      originalName: { type: String }, // Original file name (e.g. "notes.pdf")
      mimeType: { type: String },     // MIME type (e.g. "application/pdf")
      size: { type: Number },         // Size in bytes (optional)
    },
    senderName: {
      type: String,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;