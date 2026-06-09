import express from "express";
import {
  createMessageController,
  getMessagesController,
  markMessagesAsReadController,
  getUnreadCountController,
} from "../../controller/v1/messages.js";
import { upload } from "../../middleware/upload.js";

const MessageRouter = express.Router();

MessageRouter.post(
  "/",
  // authMiddleware,
  // validatePayload({ rule: chatGroupPayloadValidator }),
  upload.array("attachments", 10),

  createMessageController,
);

MessageRouter.get(
  "/:groupId",
  // validatePayload({ rule: chatGroupPayloadValidator }),
  getMessagesController,
);

MessageRouter.post(
  "/:groupId/mark-read",
  // authMiddleware,
  markMessagesAsReadController,
);

MessageRouter.get(
  "/:groupId/unread-count",
  // authMiddleware,
  getUnreadCountController,
);

export default MessageRouter;
