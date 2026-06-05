import ChatGroup from "../../models/chat-grp.model.js";
import Message from "../../models/messages.model.js";
import { getCache, setCache, deleteCache, delCachePattern } from "./cache.js";
import { redisKeys } from "./cache.js";
import { io } from "../../../server.js";
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
