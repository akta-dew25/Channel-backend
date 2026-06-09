import app from "./src/app.js";
import connectDb from "./src/config/db.js";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./src/socket/socket.js";

connectDb();

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

initializeSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
