import express from "express";

import {
  createChatGroup,
  addMembersInGroup,
  removeMembersFromGroup,
  updateChatGroup,
  getChatGroups,
  getChatGroupByIdController,
} from "../../controller/v1/chatGrp.js";
import { validatePayload } from "../../middleware/validator.js";
import { chatGroupPayloadValidator } from "../../utils/v1/chatGrpValidator.json.js";

// import authMiddleware from "../middleware/auth.js";

const chatGrpRouter = express.Router();

chatGrpRouter.post(
  "/",
  // authMiddleware,
  validatePayload({ rule: chatGroupPayloadValidator }),

  createChatGroup,
);
chatGrpRouter.get(
  "/",
  // authMiddleware,
  getChatGroups,
);

chatGrpRouter.get("/:groupId", getChatGroupByIdController);

chatGrpRouter.patch(
  "/:groupId/add-members",
  // authMiddleware,
  addMembersInGroup,
);

chatGrpRouter.patch(
  "/:groupId",
  // authMiddleware,
  updateChatGroup,
);

chatGrpRouter.patch(
  "/:groupId/remove-members",
  // authMiddleware,
  removeMembersFromGroup,
);

export default chatGrpRouter;
