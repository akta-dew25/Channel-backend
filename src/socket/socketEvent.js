import { onlineUsers } from "./onlineUsers.js";

export default function registerSocketEvents(socket) {
  socket.on("register-user", ({ userId }) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("join-group", ({ groupId }) => {
    socket.join(groupId);
  });

  socket.on("leave-group", ({ groupId }) => {
    socket.leave(groupId);
  });

  socket.on("typing", ({ groupId, userName }) => {
    socket.to(groupId).emit("user-typing", {
      userName,
    });
  });

  socket.on("stop-typing", ({ groupId }) => {
    socket.to(groupId).emit("user-stop-typing");
  });

  socket.on("send-message", (data) => {
    socket.to(data.groupId).emit("receive-message", data.message);
  });
}
