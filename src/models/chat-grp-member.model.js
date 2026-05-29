// models/chatGroupMember.model.js
import mongoose from "mongoose";

const chatGroupMemberSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      // index: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: true,
      // index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // index: true,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: null,
    },

    // member state
    status: {
      type: String,
      enum: ["active", "left", "removed"],
      default: "active",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    // ⚡ unread tracking
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastReadAt: {
      type: Date,
      default: null,
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    // user preferences
    isMuted: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    pinnedAt: {
      type: Date,
      default: null,
    },

    notificationPreference: {
      type: String,
      enum: ["all", "mentions", "none"],
      default: "all",
    },

    // typing indicator
    isTyping: {
      type: Boolean,
      default: false,
    },

    lastTypingAt: {
      type: Date,
      default: null,
    },

    // personalization
    nickname: {
      type: String,
      trim: true,
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

// prevent duplicate membership
chatGroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// fetch user groups
chatGroupMemberSchema.index({ userId: 1 });

// fetch group members
chatGroupMemberSchema.index({ groupId: 1 });

// unread queries
chatGroupMemberSchema.index({
  userId: 1,
  unreadCount: -1,
});

// pinned chats
chatGroupMemberSchema.index({
  userId: 1,
  isPinned: 1,
});

const ChatGroupMember = mongoose.model(
  "ChatGroupMember",
  chatGroupMemberSchema,
);

export default ChatGroupMember;
