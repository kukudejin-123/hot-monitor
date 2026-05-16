import { Router } from "express";
import { getAllKeywords, insertKeyword, updateKeyword, deleteKeyword } from "../db.js";

export const keywordsRouter = Router();

keywordsRouter.get("/", (_req, res) => {
  res.json(getAllKeywords());
});

keywordsRouter.post("/", (req, res) => {
  const { word, category } = req.body;
  if (!word || !word.trim()) {
    res.status(400).json({ error: "关键词不能为空" });
    return;
  }
  const kw = insertKeyword(word.trim(), category || "general");
  if (!kw) {
    res.status(409).json({ error: "关键词已存在" });
    return;
  }
  res.status(201).json(kw);
});

keywordsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { word, category, active } = req.body;
  const kw = updateKeyword(id, { word, category, active });
  if (!kw) {
    res.status(404).json({ error: "关键词不存在" });
    return;
  }
  res.json(kw);
});

keywordsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  deleteKeyword(id);
  res.json({ success: true });
});
