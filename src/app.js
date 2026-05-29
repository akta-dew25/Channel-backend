import express from "express";
import cors from "cors";
import router from "../src/routes/v1/index.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/v1", router);

app.post("/", () => {});

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
