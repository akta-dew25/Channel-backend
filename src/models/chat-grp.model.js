// models/chatGroup.model.js

import mongoose from "mongoose";

const chatGroupSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      // index: true,
    },

    name: {
      type: String,
      trim: true,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    groupType: {
      type: String,
      enum: ["channel", "group", "personal"],
      required: true,
    },

    // channelName: {
    //   type: String,
    //   trim: true,
    //   default: null,
    // },

    // isAutoName: {
    //   type: Boolean,
    //   default: false,
    // },

    privacyType: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },

    // ⚡ performance fields
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // lastMessageText: {
    //   type: String,
    //   trim: true,
    //   default: null,
    // },

    // lastMessageSenderId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   default: null,
    // },

    // lastMessageAt: {
    //   type: Date,
    //   default: null,
    // },

    memberCount: {
      type: Number,
      default: 0,
    },

    // settings
    isArchived: {
      type: Boolean,
      default: false,
    },

    isMutedDefault: {
      type: Boolean,
      default: false,
    },

    // thread support
    threadCount: {
      type: Number,
      default: 0,
    },

    // optional topic
    topic: {
      type: String,
      trim: true,
      default: null,
    },

    deletedAt: {
      type: Date,
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

// org-wise filtering
chatGroupSchema.index({ orgId: 1 });

// sorting recent chats
chatGroupSchema.index({ lastMessageAt: -1 });

// filter by type
chatGroupSchema.index({ groupType: 1 });

// filter archived groups
chatGroupSchema.index({ isArchived: 1 });

// text search
chatGroupSchema.index({
  name: "text",
  description: "text",
  topic: "text",
});

const ChatGroup = mongoose.model("ChatGroup", chatGroupSchema);

export default ChatGroup;
