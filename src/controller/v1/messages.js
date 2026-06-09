import {
  createMessagesUtils,
  getMessagesUtils,
  markMessagesAsReadUtils,
  getUnreadCountUtils,
} from "../../utils/v1/messages.js";

export const createMessageController = async (req, res) => {
  try {
    const attachments =
      req.files?.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/messages/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      })) || [];
    const { statusCode, ...response } = await createMessagesUtils({
      ...req.body,
      attachments,
      orgId: req.user.orgId,
      senderId: req.user.userId,
      accessToken: req.headers.authorization,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message.replaceAll('"')],
    });
  }
};

export const getMessagesController = async (req, res) => {
  try {
    const { statusCode, ...response } = await getMessagesUtils({
      ...req.query,
      orgId: req.user.orgId,
      groupId: req.params.groupId,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message.replaceAll('"')],
    });
  }
};

export const markMessagesAsReadController = async (req, res) => {
  try {
    const { statusCode, ...response } = await markMessagesAsReadUtils({
      groupId: req.params.groupId,
      userId: req.user.userId,
      orgId: req.user.orgId,
      lastMessageId: req.body.lastMessageId,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message.replaceAll('"')],
    });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const { statusCode, ...response } = await getUnreadCountUtils({
      groupId: req.params.groupId,
      userId: req.user.userId,
      orgId: req.user.orgId,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message.replaceAll('"')],
    });
  }
};
