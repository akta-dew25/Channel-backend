import express from "express";
import chatGrpRouter from "./chatGrp.js";
import { authorizeUser } from "../../middleware/auth.js";
// import chatGrpMemberRouter from "./chatGrpMember";

const router = express.Router();

// routerV1.use("/organization", orgRouter);
router.use("/chat-group", authorizeUser, chatGrpRouter);
// routerV1.use("/members", chatGrpMemberRouter);

export default router;
