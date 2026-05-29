import app from "./src/app.js";
import connectDb from "./src/config/db.js";
import { Server } from "socket.io";
import http from "http";

connectDb();

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
