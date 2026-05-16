import { Router } from "express";
import { getConfig, updateConfig } from "../db.js";

export const configRouter = Router();

configRouter.get("/", (_req, res) => {
  res.json(getConfig());
});

configRouter.put("/", (req, res) => {
  updateConfig(req.body);
  res.json({ success: true });
});
