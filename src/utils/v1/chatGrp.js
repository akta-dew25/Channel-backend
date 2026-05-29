import mongoose from "mongoose";

import ChatGroup from "../../models/chat-grp.model.js";

import ChatGroupMember from "../../models/chat-grp-member.model.js";
import axios from "axios";
import Message from "../../models/messages.model.js";

//  get users by ids

const getUsersData = async (userIds = [], accessToken = null) => {
  try {
    const headers = {};
    if (accessToken) {
      headers.Authorization = accessToken; // Bearer <token>
    }
    const response = await axios.post(
      `http://localhost:3000/api/v1/users/userdetails`,
      {
        userIds: userIds,
      },
      { headers },
    );
    const users = response.data.users.map((user) => ({
      userId: user.userId,
      userName: user.name,
      email: user.email,
    }));
    return users || [];
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch user details");
  }
};
/**
 * GENERATE GROUP NAME
 */

const generateGroupName = (members = []) => {
  const combinedName = members
    .map((member) => member.userName.replace(/\s+/g, ""))
    .join("");

  return combinedName.length > 25
    ? combinedName.slice(0, 25) + "..."
    : combinedName;
};

/**
 * CHECK EXISTING GROUP
 */

const checkExistingGroup = async ({ orgId, memberIds }) => {
  const groups = await ChatGroup.aggregate([
    {
      $match: {
        orgId: new mongoose.Types.ObjectId(orgId),

        groupType: "group",

        deletedAt: null,

        memberCount: memberIds.length,
      },
    },
    {
      $lookup: {
        from: "chatgroupmembers",

        localField: "_id",

        foreignField: "groupId",

        as: "members",
      },
    },
    {
      $match: {
        "members.userId": {
          $all: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
  ]);

  return groups.length > 0;
};

/**
 * CREATE CHAT GROUP UTILS
 */

export const createChatGroupUtils = async ({
  orgId,
  userId,
  authUserName,
  accessToken,
  name,
  description,
  avatar,

  groupType,
  privacyType = "private",

  membersIds = [],
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    //  fetch users

    const users = await getUsersData(membersIds, accessToken);

    /**
     * REMOVE DUPLICATE MEMBERS
     */

    let uniqueMembers = [];

    users.forEach((member) => {
      const exists = uniqueMembers.find(
        (item) => String(item.userId) === String(member.userId),
      );

      if (!exists) {
        uniqueMembers.push(member);
      }
    });

    /**
     * ADD CREATOR
     */

    const creatorExists = uniqueMembers.find(
      (member) => String(member.userId) === String(userId),
    );

    if (!creatorExists) {
      uniqueMembers.push({
        userId: userId,
        userName: authUserName,
      });
    }

    /**
     * PERSONAL CHAT
     */

    if (groupType === "personal") {
      if (uniqueMembers.length !== 2) {
        return {
          statusCode: 400,
          success: false,
          message: "Personal chat only supports 2 users",
        };
      }

      const existingPersonalChat = await ChatGroup.aggregate([
        {
          $match: {
            orgId: new mongoose.Types.ObjectId(orgId),

            groupType: "personal",

            memberCount: 2,

            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: "chatgroupmembers",

            localField: "_id",

            foreignField: "groupId",

            as: "user",
          },
        },
        {
          $match: {
            "members.userId": {
              $all: uniqueMembers.map(
                (member) => new mongoose.Types.ObjectId(member.userId),
              ),
            },
          },
        },
      ]);

      if (existingPersonalChat.length) {
        return {
          statusCode: 400,
          success: false,
          message: "Personal chat already exists",
        };
      }

      name = uniqueMembers[0].userName || null;
    }

    /**
     * GROUP
     */

    if (groupType === "group") {
      if (uniqueMembers.length < 3) {
        return {
          statusCode: 400,
          success: false,
          message: "Group should contain more than 2 members",
        };
      }

      const existingGroup = await checkExistingGroup({
        orgId,

        memberIds: uniqueMembers.map((member) => member.userId),
      });

      if (existingGroup) {
        return {
          statusCode: 400,
          success: false,
          message: "Group already exists with same members",
        };
      }

      /**
       * AUTO NAME
       */

      if (!name) {
        name = generateGroupName(uniqueMembers);
      }
    }

    /**
     * CHANNEL
     */

    if (groupType === "channel") {
      if (!name) {
        return {
          statusCode: 400,
          success: false,
          message: "Channel name is required",
        };
      }

      const existingChannel = await ChatGroup.findOne({
        orgId,

        groupType: "channel",

        name,

        deletedAt: null,
      });

      if (existingChannel) {
        return {
          statusCode: 400,
          success: false,
          message: "Channel already exists",
        };
      }
    }

    /**
     * CREATE GROUP
     */

    const [chatGroup] = await ChatGroup.create(
      [
        {
          orgId,

          name,

          description,

          avatar,

          groupType,

          privacyType,

          userId,

          memberCount: uniqueMembers.length,
        },
      ],
      { session },
    );

    /**
     * CREATE MEMBERS
     */

    const memberPayload = uniqueMembers.map((member) => ({
      orgId,

      groupId: chatGroup._id,

      userId: member.userId,

      role: String(member.userId) === String(userId) ? "admin" : "user",

      status: "active",

      unreadCount: 0,

      notificationPreference: "all",
    }));

    await ChatGroupMember.insertMany(memberPayload, { session });

    for (const user of users) {
      try {
        await axios.post(
          "http://localhost:9000/api/v1/notifications/join-group",
          {
            to: user.email,
            userName: user.userName,
            groupName: chatGroup.name,
          },
        );
      } catch (emailError) {
        console.log("JOIN GROUP EMAIL ERROR", emailError.message);
      }
    }

    await session.commitTransaction();

    return {
      statusCode: 201,

      success: true,

      message: "Chat group created successfully",

      data: {
        data: {
          groupId: chatGroup._id,
          orgId: chatGroup.orgId,
          name: chatGroup.name,
          description: chatGroup.description,
          avatar: chatGroup.avatar,
          groupType: chatGroup.groupType,
          privacyType: chatGroup.privacyType,
          memberCount: chatGroup.memberCount,
          members: memberPayload,
          createdAt: chatGroup.createdAt,
        },
      },
    };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();

    return {
      statusCode: 500,

      success: false,

      message: error.message,
    };
  } finally {
    session.endSession();
  }
};

/**
 * ADD MEMBERS IN GROUP
 */

export const addMembersInGroupUtils = async ({
  orgId,
  groupId,
  members = [],
  accessToken,
}) => {
  try {
    const group = await ChatGroup.findOne({
      _id: groupId,

      orgId,

      deletedAt: null,
    });

    if (!group) {
      return {
        statusCode: 404,

        success: false,

        message: "Group not found",
      };
    }

    if (group.groupType === "personal") {
      return {
        statusCode: 400,

        success: false,

        message: "Cannot add members in personal chat",
      };
    }

    const existingMembers = await ChatGroupMember.find({
      groupId,

      status: "active",
    });

    const existingMemberIds = existingMembers.map((member) =>
      String(member.userId),
    );

    const newMembers = members.filter(
      (member) => !existingMemberIds.includes(String(member.userId)),
    );

    if (!newMembers.length) {
      return {
        statusCode: 400,

        success: false,

        message: "All users already exist in group",
      };
    }

    const payload = newMembers.map((member) => ({
      orgId,

      groupId,

      userId: member.userId,

      role: "user",

      status: "active",

      unreadCount: 0,

      notificationPreference: "all",
    }));

    await ChatGroupMember.insertMany(payload);
    const userIds = newMembers.map((member) => member.userId);

    const users = await getUsersData(userIds, accessToken);
    for (const user of users) {
      try {
        await axios.post(
          "http://localhost:9000/api/v1/notifications/join-group",
          {
            to: user.email,
            userName: user.userName,
            groupName: group.name,
          },
        );
      } catch (emailError) {
        console.log("JOIN GROUP EMAIL ERROR", emailError.message);
      }
    }

    await ChatGroup.findByIdAndUpdate(groupId, {
      $inc: {
        memberCount: newMembers.length,
      },
    });

    return {
      statusCode: 200,

      success: true,

      message: "Members added successfully",
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

export const updateChatGroupUtils = async ({
  orgId,
  groupId,

  name,
  description,
  avatar,
  topic,
  privacyType,
}) => {
  try {
    const group = await ChatGroup.findOne({
      _id: groupId,
      orgId,
      deletedAt: null,
    });

    if (!group) {
      return {
        statusCode: 404,
        success: false,
        message: "Group not found",
      };
    }

    /**
     * PERSONAL CHAT RESTRICTED
     */

    if (group.groupType === "personal") {
      return {
        statusCode: 400,
        success: false,
        message: "Cannot update personal chat",
      };
    }

    /**
     * CHANNEL NAME CHECK
     */

    if (group.groupType === "channel" && name) {
      const existingChannel = await ChatGroup.findOne({
        orgId,
        groupType: "channel",
        name,
        _id: { $ne: groupId },
        deletedAt: null,
      });

      if (existingChannel) {
        return {
          statusCode: 400,
          success: false,
          message: "Channel name already exists",
        };
      }
    }

    /**
     * UPDATE
     */

    const updatedGroup = await ChatGroup.findByIdAndUpdate(
      groupId,
      {
        $set: {
          ...(name && { name }),

          ...(description && {
            description,
          }),

          ...(avatar && { avatar }),

          ...(topic && { topic }),

          ...(privacyType && {
            privacyType,
          }),
        },
      },
      {
        new: true,
      },
    );

    return {
      statusCode: 200,
      success: true,
      message: "Group updated successfully",
      data: {
        orgId: updatedGroup.orgId,
        name: updatedGroup.name,
        description: updatedGroup.description,
        picture: updatedGroup.avatar,
        type: updatedGroup.groupType,
      },
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

export const removeMembersFromGroupUtils = async ({
  orgId,
  groupId,
  memberIds = [],
}) => {
  try {
    const group = await ChatGroup.findOne({
      _id: groupId,
      orgId,
      deletedAt: null,
    });

    if (!group) {
      return {
        statusCode: 404,
        success: false,
        message: "Group not found",
      };
    }

    /**
     * PERSONAL CHAT RESTRICTED
     */

    if (group.groupType === "personal") {
      return {
        statusCode: 400,
        success: false,
        message: "Cannot remove members from personal chat",
      };
    }

    /**
     * REMOVE MEMBERS
     */

    await ChatGroupMember.updateMany(
      {
        groupId,
        userId: { $in: memberIds },
      },
      {
        $set: {
          status: "removed",
          leftAt: new Date(),
        },
      },
    );

    /**
     * UPDATE MEMBER COUNT
     */

    const activeMembers = await ChatGroupMember.countDocuments({
      groupId,
      status: "active",
    });

    await ChatGroup.findByIdAndUpdate(groupId, {
      memberCount: activeMembers,
    });

    return {
      statusCode: 200,
      success: true,
      message: "Members removed successfully",
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

export const getChatGroupsUtils = async ({
  orgId,
  userId,
  groupType,
  page = 1,
  limit = 5,
}) => {
  try {
    /**
     * GET USER GROUP IDS
     */

    const memberGroups = await ChatGroupMember.find({
      orgId,
      userId,
      status: "active",
    }).select("groupId");

    const groupIds = memberGroups.map((item) => item.groupId);

    /**
     * FILTER
     */

    let filter = {
      _id: { $in: groupIds },
      orgId,
      deletedAt: null,
    };

    /**
     * FILTER BY TYPE
     */

    if (groupType) {
      filter.groupType = groupType;
    }

    /**
     * GET GROUPS
     */
    const groups = await ChatGroup.find(filter)
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      })
      .lean();

    /**
     * ATTACH MEMBERS
     */
    const finalGroups = await Promise.all(
      groups.map(async (group) => {
        const members = await ChatGroupMember.find({
          groupId: group._id,
          status: "active",
        }).select("userId role unreadCount isPinned");

        const latestMessage = group.lastMessageId
          ? await Message.findById(group.lastMessageId).lean()
          : null;

        return {
          ...group,
          members: members,
          latestMessage,
        };
      }),
    );

    const finalGroupsMap = finalGroups
      .map((group) => ({
        name: group.name,
        groupId: group._id,
        orgId: group.orgId,
        description: group.description,
        groupType: group.groupType,
        privacyType: group.privacyType,
        memberCount: group.memberCount,
        members: group.members,
        createdAt: group.createdAt,
        latestMessage: group.latestMessage,
      }))
      .sort((a, b) => {
        if (a.groupType === "channel" && b.groupType !== "channel") {
          return -1;
        }

        if (a.groupType !== "channel" && b.groupType === "channel") {
          return 1;
        }

        /**
         * LATEST CREATED FIRST
         */
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;
    const totalCount = finalGroupsMap.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
    const paginatedGroups = finalGroupsMap.slice(
      (safePage - 1) * safeLimit,
      safePage * safeLimit,
    );

    return {
      statusCode: 200,
      success: true,
      message: "Chat groups fetched successfully",
      data: paginatedGroups,
      meta: {
        page: safePage,
        limit: safeLimit,
        totalCount,
        totalPages,
        hasMore: safePage < totalPages,
      },
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

export const getChatGroupByIdUtils = async ({
  orgId,
  userId,
  groupId,
  page = 1,
  limit = 5,
  accessToken,
}) => {
  try {
    /**
     * CHECK USER IS MEMBER OF GROUP
     */
    const member = await ChatGroupMember.findOne({
      groupId,
      orgId,
      userId,
      status: "active",
    });

    if (!member) {
      return {
        statusCode: 403,
        success: false,
        message: "You are not a member of this group",
      };
    }

    /**
     * GET GROUP DETAILS
     */
    const group = await ChatGroup.findOne({
      _id: groupId,
      orgId,
      deletedAt: null,
    }).lean();

    if (!group) {
      return {
        statusCode: 404,
        success: false,
        message: "Group not found",
      };
    }

    /**
     * GET GROUP MEMBERS
     */
    const members = await ChatGroupMember.find({
      groupId,
      status: "active",
    }).lean();

    const userIds = members.map((member) => member.userId);
    const headers = {};

    if (accessToken) {
      headers.Authorization = accessToken; // Bearer <token>
    }

    const { data } = await axios.post(
      "http://localhost:3000/api/v1/users/userdetails",
      { userIds },
      { headers },
    );

    const usersMap = {};

    data.users.forEach((user) => {
      usersMap[user.userId] = user;
    });

    const finalMembers = members.map((member) => ({
      ...member,
      user: usersMap[member.userId.toString()] || null,
    }));
    /**
     * PAGINATION
     */
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    /**
     * GET MESSAGES
     */
    const messages = await Message.find({
      groupId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const totalMessages = await Message.countDocuments({
      groupId,
      deletedAt: null,
    });

    /**
     * FINAL RESPONSE
     */
    return {
      statusCode: 200,
      success: true,
      message: "Chat group fetched successfully",
      data: {
        group: {
          groupId: group._id,
          name: group.name,
          description: group.description,
          avatar: group.avatar,
          groupType: group.groupType,
          privacyType: group.privacyType,
          memberCount: group.memberCount,
          createdAt: group.createdAt,
        },
        members: finalMembers.map((user) => user.user),
        messages: messages.reverse(),
      },
      meta: {
        page: safePage,
        limit: safeLimit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / safeLimit),
        hasMore: safePage * safeLimit < totalMessages,
      },
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
