import "dotenv/config";
import express from "express";
import cors from "cors";

import { keywordsRouter } from "./routes/keywords.js";
import { topicsRouter } from "./routes/topics.js";
import { notificationsRouter } from "./routes/notifications.js";
import { configRouter } from "./routes/config.js";
import { startScheduler } from "./services/scheduler.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/keywords", keywordsRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/config", configRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Init
startScheduler();

app.listen(PORT, () => {
  console.log(`🔥 Hot Monitor API running on http://localhost:${PORT}`);
});
