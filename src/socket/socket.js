export const onlineUsers = new Map();
import ChatGroupMember from "../models/chat-grp-member.model.js";

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    /**
     * USER ONLINE / REGISTER
     */
    const setUserOnline = (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    };

    socket.on("user-online", ({ userId }) => setUserOnline(userId));
    socket.on("register-user", ({ userId }) => setUserOnline(userId));

    /**
     * JOIN GROUP
     */
    socket.on("join-group", ({ groupId }) => {
      if (!groupId) return;
      socket.join(groupId.toString());
    });

    socket.on("leave-group", ({ groupId }) => {
      if (!groupId) return;
      socket.leave(groupId.toString());
    });

    /**
     * SEND MESSAGE
     */
    // socket.on("send-message", (data) => {
    //   if (!data || !data.groupId) return;
    //   io.to(data.groupId.toString()).emit("receive-message", data);
    // });

    /**
     * TYPING
     */
    socket.on("typing", ({ groupId, userName }) => {
      socket.to(groupId.toString()).emit("user-typing", {
        groupId,
        userName,
      });
    });

    /**
     * STOP TYPING
     */
    socket.on("stop-typing", ({ groupId }) => {
      socket.to(groupId.toString()).emit("user-stop-typing", {
        groupId,
      });
    });

    /**
     * MARK MESSAGE AS READ
     */
    socket.on("mark-message-read", async ({ groupId, userId, messageId }) => {
      if (!groupId || !userId || !messageId) return;
      try {
        // update lastReadMessageId and clear unreadCount
        await ChatGroupMember.findOneAndUpdate(
          { groupId, userId },
          {
            $set: {
              lastReadMessageId: messageId,
              lastReadAt: new Date(),
              unreadCount: 0,
            },
          },
          { new: true },
        );

        // notify group: message was read by user
        io.to(groupId.toString()).emit("message-read", {
          messageId,
          userId,
          readAt: new Date(),
        });

        // emit user's new unread count to themselves
        socket.emit("unread-count-updated", {
          groupId,
          unreadCount: 0,
        });
      } catch (err) {
        console.log("mark-message-read error:", err?.message || err);
      }
    });

    /**
     * DISCONNECT
     */
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("Disconnected:", socket.id);
    });
  });
};
