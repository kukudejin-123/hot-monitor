import { useState, useEffect } from "react";

interface Keyword {
  id: number;
  word: string;
  category: string;
  active: number;
  created_at: string;
}

const API = "/api/keywords";

export function KeywordManager() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKeywords();
  }, []);

  async function loadKeywords() {
    try {
      const res = await fetch(API);
      setKeywords(await res.json());
    } catch (e) {
      console.error("load keywords error", e);
    }
  }

  async function addKeyword() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: input.trim(), category }),
      });
      if (res.ok) {
        setInput("");
        await loadKeywords();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      console.error("add keyword error", e);
    }
    setLoading(false);
  }

  async function toggleKeyword(kw: Keyword) {
    await fetch(`${API}/${kw.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: kw.active === 1 ? 0 : 1 }),
    });
    loadKeywords();
  }

  async function deleteKeyword(id: number) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadKeywords();
  }

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold text-neon-cyan font-mono mb-4">
        ⌨️ 关键词监控
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          placeholder="输入关键词，如 GPT-5, Claude 4..."
          className="terminal-input flex-1 px-3 py-2 rounded text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="terminal-input px-2 py-2 rounded text-sm"
        >
          <option value="general">通用</option>
          <option value="ai_model">大模型</option>
          <option value="ai_tool">AI工具</option>
          <option value="ai_product">AI产品</option>
          <option value="ai_paper">AI论文</option>
        </select>
        <button
          onClick={addKeyword}
          disabled={loading}
          className="px-4 py-2 rounded bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-sm hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "+ 添加"}
        </button>
      </div>

      <div className="space-y-2">
        {keywords.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-4 font-mono">
            {'> '}还没有监控关键词，添加一个开始吧
          </p>
        )}
        {keywords.map((kw) => (
          <div
            key={kw.id}
            className={`flex items-center justify-between p-2 rounded border transition-colors ${
              kw.active === 1
                ? "border-dark-border bg-dark-surface"
                : "border-dark-border/50 bg-dark-surface/50 opacity-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  kw.active === 1 ? "bg-neon-green" : "bg-text-secondary"
                }`}
              />
              <span className="text-sm font-mono text-text-primary">{kw.word}</span>
              <span className="text-xs text-text-secondary">[{kw.category}]</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleKeyword(kw)}
                className="text-xs px-2 py-1 rounded border border-dark-border text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
              >
                {kw.active === 1 ? "暂停" : "启用"}
              </button>
              <button
                onClick={() => deleteKeyword(kw.id)}
                className="text-xs px-2 py-1 rounded border border-dark-border text-text-secondary hover:text-neon-pink hover:border-neon-pink/30 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
