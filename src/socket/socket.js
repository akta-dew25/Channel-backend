import { io } from "../server.js";

const onlineUsers = new Map();

io.on("connection", (socket) => {
  /**
   * JOIN USER
   */
  socket.on("join-user", ({ userId }) => {
    onlineUsers.set(userId, socket.id);
  });

  /**
   * JOIN CHAT GROUP
   */
  socket.on("join-group", ({ groupId }) => {
    socket.join(groupId);

    `Socket ${socket.id} joined group ${groupId}`;
  });

  /**
   * SEND MESSAGE
   */
  socket.on("send-message", async (payload) => {
    /**
     * payload
     * {
     *   groupId,
     *   message,
     *   senderId
     * }
     */

    io.to(payload.groupId).emit("receive-message", payload);
  });

  /**
   * TYPING
   */
  socket.on("typing", ({ groupId, userName }) => {
    socket.to(groupId).emit("user-typing", {
      userName,
    });
  });

  /**
   * STOP TYPING
   */
  socket.on("stop-typing", ({ groupId }) => {
    socket.to(groupId).emit("user-stop-typing");
  });

  /**
   * DISCONNECT
   */
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
