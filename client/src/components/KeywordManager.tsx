import { useState, useEffect } from "react";

interface Keyword {
  id: number;
  word: string;
  category: string;
  active: number;
  created_at: string;
}

const CATEGORIES: Record<string, string> = {
  general: "通用",
  ai_model: "大模型",
  ai_tool: "AI工具",
  ai_product: "AI产品",
  ai_paper: "AI论文",
};

const API = "/api/keywords";

export function KeywordManager() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadKeywords(); }, []);

  async function loadKeywords() {
    try {
      const res = await fetch(API);
      setKeywords(await res.json());
    } catch (e) { console.error(e); }
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
      if (res.ok) { setInput(""); await loadKeywords(); }
      else { const err = await res.json(); alert(err.error); }
    } catch (e) { console.error(e); }
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
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
        监控关键词
      </h2>

      <div className="flex gap-1.5 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          placeholder="输入关键词..."
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-accent-blue/40 transition-colors font-mono"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-accent-blue/40 font-mono"
        >
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={addKeyword}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-mono hover:bg-accent-blue/20 transition-all disabled:opacity-40 flex-shrink-0"
        >
          +
        </button>
      </div>

      <div className="space-y-1">
        {keywords.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-3 font-mono">
            添加关键词开始监控
          </p>
        )}
        {keywords.map((kw) => (
          <div
            key={kw.id}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors ${
              kw.active
                ? "border-slate-800/40 bg-slate-800/20"
                : "border-slate-800/20 bg-transparent opacity-50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${kw.active ? "bg-emerald-400" : "bg-slate-600"}`} />
              <span className="text-xs text-slate-300 truncate">{kw.word}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">{CATEGORIES[kw.category] || kw.category}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleKeyword(kw)}
                className="text-[10px] px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
              >
                {kw.active ? "停" : "启"}
              </button>
              <button
                onClick={() => deleteKeyword(kw.id)}
                className="text-[10px] px-1.5 py-0.5 rounded text-slate-600 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
