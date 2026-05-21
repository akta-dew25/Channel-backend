import express from "express";
import {
  createMessageController,
  getMessagesController,
} from "../../controller/v1/messages.js";

const MessageRouter = express.Router();

MessageRouter.post(
  "/",
  // authMiddleware,
  // validatePayload({ rule: chatGroupPayloadValidator }),
  createMessageController,
);

MessageRouter.get(
  "/:groupId",
  // validatePayload({ rule: chatGroupPayloadValidator }),
  getMessagesController,
);

export default MessageRouter;
