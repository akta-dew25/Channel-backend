const onlineUsers = new Map();

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
    socket.on("send-message", (data) => {
      console.log({ data });

      if (!data || !data.groupId) return;
      io.to(data.groupId.toString()).emit("receive-message", data);
    });

    /**
     * TYPING
     */
    socket.on("typing", ({ groupId, userName }) => {
      if (!groupId) return;
      socket.to(groupId.toString()).emit("user-typing", {
        userName,
      });
    });

    /**
     * STOP TYPING
     */
    socket.on("stop-typing", ({ groupId }) => {
      if (!groupId) return;
      socket.to(groupId.toString()).emit("user-stop-typing");
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
