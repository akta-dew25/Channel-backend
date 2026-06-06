import {
  createChatGroupUtils,
  addMembersInGroupUtils,
  updateChatGroupUtils,
  removeMembersFromGroupUtils,
  getChatGroupsUtils,
  getChatGroupByIdUtils,
} from "../../utils/v1/chatGrp.js";

/**
 * CREATE CHAT GROUP
 */

export const createChatGroup = async (req, res) => {
  try {
    const { statusCode, ...response } = await createChatGroupUtils({
      ...req.body,
      orgId: req.user.orgId,
      userId: req.user.userId,
      authUserName: req.user.userName,
      role: req.user.role,
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

/**
 * ADD MEMBERS
 */

export const addMembersInGroup = async (req, res) => {
  try {
    const { statusCode, ...response } = await addMembersInGroupUtils({
      ...req.body,

      groupId: req.params.groupId,
      role: req.user.role,
      orgId: req.user.orgId,
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

export const updateChatGroup = async (req, res) => {
  try {
    const { statusCode, ...response } = await updateChatGroupUtils({
      ...req.body,
      role: req.user.role,
      groupId: req.params.groupId,

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

export const removeMembersFromGroup = async (req, res) => {
  try {
    const { statusCode, ...response } = await removeMembersFromGroupUtils({
      ...req.body,
      groupId: req.params.groupId,
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

export const getChatGroups = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const { statusCode, ...response } = await getChatGroupsUtils({
      orgId: req.user.orgId,
      userId: req.user.userId,
      groupType: req.query.groupType,
      page,
      limit,
      accessToken: req.headers.authorization,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log({ error });

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message],
    });
  }
};

export const getChatGroupByIdController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { statusCode, ...response } = await getChatGroupByIdUtils({
      orgId: req.user.orgId,
      userId: req.user.userId,
      groupId: req.params.groupId,
      accessToken: req.headers.authorization,

      page,
      limit,
    });

    res.status(statusCode).json(response);
  } catch (error) {
    console.log({ error });

    res.status(500).json({
      message: "Internal Server Error",
      error: [error.message],
    });
  }
};
