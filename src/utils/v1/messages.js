import ChatGroup from "../../models/chat-grp.model.js";
import Message from "../../models/messages.model.js";
import ChatGroupMember from "../../models/chat-grp-member.model.js";
import { getCache, setCache, deleteCache, delCachePattern } from "./cache.js";
import { redisKeys } from "./cache.js";
import { io } from "../../../server.js";
import { onlineUsers } from "../../../src/socket/socket.js";
import axios from "axios";

export const createMessagesUtils = async ({
  orgId,
  senderId,

  groupId,

  message,

  messageType = "text",

  attachments = [],

  replyMessageId = null,
  accessToken = null,
}) => {
  try {
    const createdMessage = await Message.create({
      orgId,

      groupId,

      senderId,

      message,

      messageType,

      attachments,

      replyMessageId,
    });
    // attach sender userName before emitting so clients don't need to refetch
    let payload = createdMessage;
    try {
      const headers = {};
      if (accessToken) headers.Authorization = accessToken;
      const resp = await axios.post(
        `http://localhost:3000/api/v1/users/userdetails`,
        { userIds: [String(senderId)] },
        { headers },
      );
      const user = resp.data.users && resp.data.users[0];
      payload = createdMessage.toObject
        ? createdMessage.toObject()
        : { ...createdMessage };
      if (user) payload.senderName = user.name || null;
    } catch (err) {
      payload = createdMessage.toObject
        ? createdMessage.toObject()
        : { ...createdMessage };
    }

    io.to(groupId.toString()).emit("receive-message", payload);

    // increment unread count for all group members except sender
    try {
      await ChatGroupMember.updateMany(
        { groupId, userId: { $ne: senderId }, status: "active" },
        { $inc: { unreadCount: 1 } },
      );

      // emit unread count update to all members in room
      const updatedMembers = await ChatGroupMember.find({
        groupId,
        status: "active",
      }).select("userId unreadCount");

      updatedMembers.forEach((member) => {
        io.to(groupId.toString()).emit("unread-count-updated", {
          groupId,
          userId: member.userId,
          unreadCount: member.unreadCount,
        });
      });
    } catch (err) {
      console.log("error updating unread counts:", err?.message || err);
    }

    await delCachePattern(`chat:messages:${groupId}:*`);

    await deleteCache(redisKeys.chatGroupById(groupId));

    await ChatGroup.findByIdAndUpdate(groupId, {
      lastMessageId: createdMessage._id,

      updatedAt: new Date(),
    });

    return {
      statusCode: 201,
      success: true,
      message: "Message sent successfully",
      data: payload,
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,

      success: false,

      message: error.message,
    };
  }
};

export const getMessagesUtils = async ({
  orgId,
  groupId,
  page = 1,
  limit = 20,
}) => {
  try {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;

    const cacheKey = redisKeys.messages(groupId, safePage, safeLimit);

    /**
     * CHECK CACHE
     */
    const cachedMessages = await getCache(cacheKey);
    console.log({ cacheKey });
    if (cachedMessages) {
      console.log({ cachedMessages });
      return {
        statusCode: 200,
        success: true,
        message: "Messages fetched from cache",
        data: cachedMessages.data,
        meta: cachedMessages.meta,
      };
    }

    const skip = (safePage - 1) * safeLimit;
    const totalMessages = await Message.countDocuments({
      orgId,
      groupId,
      deletedAt: null,
    });

    const messages = await Message.find({
      orgId,
      groupId,
      deletedAt: null,
    })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const response = {
      data: messages.reverse(), // oldest first in UI for the selected page
      meta: {
        page: safePage,
        limit: safeLimit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / safeLimit),
        hasMore: safePage * safeLimit < totalMessages,
      },
    };
    await setCache(cacheKey, response, 300);

    return {
      statusCode: 200,

      success: true,

      message: "Messages fetched successfully",

      ...response,
    };
  } catch (error) {
    return {
      statusCode: 500,

      success: false,

      message: error.message,
    };
  }
};

export const markMessagesAsReadUtils = async ({
  groupId,
  userId,
  orgId,
  lastMessageId,
}) => {
  try {
    if (!groupId || !userId || !lastMessageId) {
      return {
        statusCode: 400,
        success: false,
        message: "Missing required fields: groupId, userId, lastMessageId",
      };
    }

    // update user's last read message and clear unread count
    const updated = await ChatGroupMember.findOneAndUpdate(
      { groupId, userId, orgId },
      {
        $set: {
          lastReadMessageId: lastMessageId,
          lastReadAt: new Date(),
          unreadCount: 0,
        },
      },
      { new: true },
    );

    if (!updated) {
      return {
        statusCode: 404,
        success: false,
        message: "User is not a member of this group",
      };
    }

    // emit read receipt across the group room
    io.to(groupId.toString()).emit("message-read", {
      groupId,
      userId,
      messageId: lastMessageId,
      readAt: new Date(),
    });

    return {
      statusCode: 200,
      success: true,
      message: "Messages marked as read",
      data: {
        unreadCount: 0,
        lastReadAt: updated.lastReadAt,
      },
    };
  } catch (error) {
    console.log("markMessagesAsReadUtils error:", error);
    return {
      statusCode: 500,
      success: false,
      message: error.message,
    };
  }
};

export const getUnreadCountUtils = async ({ groupId, userId, orgId }) => {
  try {
    if (!groupId || !userId) {
      return {
        statusCode: 400,
        success: false,
        message: "Missing required fields: groupId, userId",
      };
    }

    const member = await ChatGroupMember.findOne(
      { groupId, userId, orgId },
      { unreadCount: 1 },
    );

    if (!member) {
      return {
        statusCode: 404,
        success: false,
        message: "User is not a member of this group",
      };
    }

    return {
      statusCode: 200,
      success: true,
      message: "Unread count retrieved",
      data: {
        groupId,
        userId,
        unreadCount: member.unreadCount || 0,
      },
    };
  } catch (error) {
    console.log("getUnreadCountUtils error:", error);
    return {
      statusCode: 500,
      success: false,
      message: error.message,
    };
  }
};
