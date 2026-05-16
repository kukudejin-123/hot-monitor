import { Router } from "express";
import { getTopics, markTopicRead } from "../db.js";
import { fetchAllSources } from "../services/scheduler.js";

export const topicsRouter = Router();

topicsRouter.get("/", (req, res) => {
  const { page, limit, keyword_id, verified } = req.query;
  const result = getTopics({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    keyword_id: keyword_id ? Number(keyword_id) : undefined,
    verified: verified !== undefined ? Number(verified) : undefined,
  });
  res.json(result);
});

topicsRouter.post("/fetch", async (_req, res) => {
  try {
    const results = await fetchAllSources();
    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

topicsRouter.put("/:id/read", (req, res) => {
  markTopicRead(Number(req.params.id));
  res.json({ success: true });
});
