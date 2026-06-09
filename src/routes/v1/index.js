import express from "express";
import chatGrpRouter from "./chatGrp.js";
import MessageRouter from "./messages.js";
import { authorizeUser } from "../../middleware/auth.js";
// import chatGrpMemberRouter from "./chatGrpMember";

const router = express.Router();

// routerV1.use("/organization", orgRouter);
router.use("/chat-group", authorizeUser, chatGrpRouter);
router.use("/messages", authorizeUser, MessageRouter);

// routerV1.use("/members", chatGrpMemberRouter);

export default router;
