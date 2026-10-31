import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
      required: true,
      index: true,
    },

    recipientEmail: {
      type: String,
      required: true,
      index: true,
    },

    // Double Ratchet encrypted payload ke liye
    ciphertext: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    iv: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Double Ratchet ka unencrypted header (Ratchet pub key, N, PN)
    header: {
      type: Object,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["queued", "delivered", "read"],
      default: "queued",
    },
  },
  {
    timestamps: true,
  }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
