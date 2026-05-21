import ChatGroup from "../../models/chat-grp.model.js";
import Message from "../../models/messages.model.js";

export const createMessagesUtils = async ({
  orgId,
  senderId,

  groupId,

  message,

  messageType = "text",

  attachments = [],

  replyMessageId = null,
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

    await ChatGroup.findByIdAndUpdate(groupId, {
      lastMessageId: createdMessage._id,

      updatedAt: new Date(),
    });

    return {
      statusCode: 201,

      success: true,

      message: "Message sent successfully",

      data: createdMessage,
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

export const getMessagesUtils = async ({ orgId, groupId }) => {
  try {
    const messages = await Message.find({
      orgId,

      groupId,

      deletedAt: null,
    })
      .sort({
        createdAt: 1,
      })
      .lean();

    return {
      statusCode: 200,

      success: true,

      message: "Messages fetched successfully",

      data: messages,
    };
  } catch (error) {
    return {
      statusCode: 500,

      success: false,

      message: error.message,
    };
  }
};
