import { Router } from "express";
import { getAllNotifications, clearNotifications } from "../db.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  res.json(getAllNotifications(limit));
});

notificationsRouter.delete("/", (_req, res) => {
  clearNotifications();
  res.json({ success: true });
});
