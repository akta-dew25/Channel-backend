import {
  createMessagesUtils,
  getMessagesUtils,
} from "../../utils/v1/messages.js";

export const createMessageController = async (req, res) => {
  try {
    const { statusCode, ...response } = await createMessagesUtils({
      ...req.body,
      orgId: req.user.orgId,
      senderId: req.user.userId,
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
      ...req.body,
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
