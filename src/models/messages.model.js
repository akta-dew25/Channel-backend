import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,

      required: true,

      index: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "ChatGroup",

      required: true,

      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,

      required: true,

      // index: true,
    },

    /**
     * TEXT MESSAGE
     */

    message: {
      type: String,

      trim: true,

      default: null,
    },

    /**
     * MESSAGE TYPE
     */

    messageType: {
      type: String,

      enum: ["text", "image", "video", "audio", "file", "system"],

      default: "text",
    },

    /**
     * FILES
     */

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String,
      },
    ],

    /**
     * REPLY / THREAD
     */

    replyMessageId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Message",

      default: null,
    },

    /**
     * EDIT
     */

    isEdited: {
      type: Boolean,

      default: false,
    },

    editedAt: {
      type: Date,

      default: null,
    },

    /**
     * DELETE
     */

    deletedAt: {
      type: Date,

      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * INDEXES
 */

messageSchema.index({
  groupId: 1,

  createdAt: -1,
});

messageSchema.index({
  senderId: 1,
});

// messageSchema.index({
//   replyMessageId: 1,
// });
const Message = mongoose.model("Message", messageSchema);

export default Message;
