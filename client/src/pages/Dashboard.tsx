import { useState, useEffect, useCallback } from "react";
import { AuroraBackground } from "../components/ui/aurora-background.tsx";
import { MovingBorderButton } from "../components/ui/moving-border.tsx";
import { TickerTape } from "../components/TickerTape.tsx";
import { TopicCard } from "../components/TopicCard.tsx";
import { KeywordManager } from "../components/KeywordManager.tsx";
import { NotificationPanel } from "../components/NotificationPanel.tsx";

interface Topic {
  id: number;
  title: string;
  summary: string;
  source_url: string;
  source_type: string;
  keyword_word: string | null;
  ai_score: number;
  ai_reason: string;
  verified: number;
  is_new: number;
  engagement: { views?: number; likes?: number; retweets?: number; points?: number; comments?: number } | null;
  created_at: string;
}

interface Keyword {
  id: number;
  word: string;
  active: number;
}

const SOURCES = [
  { value: "", label: "全部来源" },
  { value: "twitter", label: "𝕏 Twitter" },
  { value: "bing", label: "Bing" },
  { value: "bing-news", label: "Bing News" },
  { value: "hackernews", label: "Hacker News" },
  { value: "reddit", label: "Reddit" },
  { value: "google-news", label: "Google News" },
  { value: "bilibili", label: "B站" },
];

export function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "verified">("all");
  const [newCount, setNewCount] = useState(0);
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [keywordId, setKeywordId] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  const loadTopics = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter === "verified") params.set("verified", "1");
      if (search) params.set("search", search);
      if (sourceType) params.set("source_type", sourceType);
      if (keywordId) params.set("keyword_id", keywordId);
      const res = await fetch(`/api/topics?${params}`);
      const data = await res.json();
      setTopics(data.topics || []);
      setTotal(data.total || 0);
      setNewCount((data.topics || []).filter((t: Topic) => t.is_new === 1).length);
    } catch (e) { console.error(e); }
  }, [page, filter, search, sourceType, keywordId]);

  useEffect(() => {
    loadTopics();
    const interval = setInterval(loadTopics, 30000);
    return () => clearInterval(interval);
  }, [loadTopics]);

  useEffect(() => {
    fetch("/api/keywords").then(r => r.json()).then(setKeywords).catch(() => {});
  }, []);

  function resetFilters() {
    setSearch("");
    setSourceType("");
    setKeywordId("");
    setFilter("all");
    setPage(1);
  }

  async function manualFetch() {
    setFetching(true);
    try {
      const res = await fetch("/api/topics/fetch", { method: "POST" });
      const data = await res.json();
      alert(`抓取完成\nTwitter: ${data.results.twitter} · Web: ${data.results.web} · 通过AI: ${data.results.verified}`);
      setPage(1);
      await loadTopics();
    } catch (e) { console.error(e); }
    setFetching(false);
  }

  return (
    <AuroraBackground className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <span className="text-sm font-semibold text-slate-200 tracking-tight">
                Hot<span className="text-accent-blue">Monitor</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 ml-6 text-xs">
              <span className="text-slate-500 font-mono">
                热点 <span className="text-slate-300">{total}</span>
              </span>
              {newCount > 0 && (
                <span className="text-amber-400 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                  新 <span className="text-amber-300">{newCount}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => { setFilter("all"); setPage(1); }}
                className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-all ${
                  filter === "all"
                    ? "bg-slate-800/60 text-slate-200 border border-slate-700/50"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => { setFilter("verified"); setPage(1); }}
                className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-all ${
                  filter === "verified"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-500 hover:text-emerald-400"
                }`}
              >
                AI已验证
              </button>
            </div>

            <MovingBorderButton
              duration={4000}
              borderClassName="opacity-70"
            >
              <button
                onClick={manualFetch}
                disabled={fetching}
                className="px-4 py-1.5 text-xs font-mono text-accent-blue disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${fetching ? "bg-amber-400 animate-pulse" : "bg-accent-blue"}`} />
                {fetching ? "采集" : "立即抓取"}
              </button>
            </MovingBorderButton>
          </div>
        </div>
        <TickerTape topics={topics.slice(0, 10)} />
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-5">
          {/* Left Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <KeywordManager />

              {/* Quick Stats */}
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-4">
                <h3 className="text-xs font-semibold text-slate-400 mb-3 font-mono uppercase tracking-wider">
                  数据概览
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded-lg bg-slate-800/30 border border-slate-800/40">
                    <div className="text-lg font-bold text-slate-200 font-mono">{total}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">热点总数</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="text-lg font-bold text-amber-400 font-mono">{newCount}</div>
                    <div className="text-[9px] text-amber-500/70 mt-0.5">最新热点</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-sky-500/5 border border-sky-500/10">
                    <div className="text-lg font-bold text-sky-400 font-mono">
                      {topics.filter(t => t.source_type === "twitter").length}
                    </div>
                    <div className="text-[9px] text-sky-500/70 mt-0.5">Twitter</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="text-lg font-bold text-violet-400 font-mono">
                      {topics.filter(t => t.source_type !== "twitter").length}
                    </div>
                    <div className="text-[9px] text-violet-500/70 mt-0.5">Web源</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Feed */}
          <section className="min-w-0">
            {/* Mobile: compact controls */}
            <div className="lg:hidden space-y-2 mb-4">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-accent-blue/40 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={sourceType}
                  onChange={e => { setSourceType(e.target.value); setPage(1); }}
                  className="bg-slate-900/60 border border-slate-700/50 rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none font-mono appearance-none cursor-pointer flex-1"
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  value={keywordId}
                  onChange={e => { setKeywordId(e.target.value); setPage(1); }}
                  className="bg-slate-900/60 border border-slate-700/50 rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none font-mono appearance-none cursor-pointer flex-1"
                >
                  <option value="">全部关键词</option>
                  {keywords.filter(k => k.active === 1).map(k => (
                    <option key={k.id} value={k.id}>{k.word}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button onClick={() => { setFilter("all"); setPage(1); }} className={`text-[10px] px-2 py-1 rounded-md font-mono ${filter === "all" ? "bg-slate-800/60 text-slate-200" : "text-slate-500"}`}>全部</button>
                  <button onClick={() => { setFilter("verified"); setPage(1); }} className={`text-[10px] px-2 py-1 rounded-md font-mono ${filter === "verified" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500"}`}>已验证</button>
                </div>
                {(search || sourceType || keywordId || filter !== "all") && (
                  <button onClick={resetFilters} className="text-[10px] px-1.5 py-1 rounded-md border border-slate-700/40 text-slate-500 font-mono">重置</button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>共{total}条</span>
                {newCount > 0 && <span className="text-amber-400">{newCount}条新</span>}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                热点动态
              </h2>
              {total > 20 && (
                <span className="text-[10px] text-slate-600 font-mono">
                  {page}/{Math.ceil(total / 20)}
                </span>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[160px]">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索标题/摘要..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-accent-blue/40 transition-colors font-mono"
                />
              </div>
              <select
                value={sourceType}
                onChange={e => { setSourceType(e.target.value); setPage(1); }}
                className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 outline-none focus:border-accent-blue/40 transition-colors font-mono appearance-none cursor-pointer"
              >
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={keywordId}
                onChange={e => { setKeywordId(e.target.value); setPage(1); }}
                className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 outline-none focus:border-accent-blue/40 transition-colors font-mono appearance-none cursor-pointer max-w-[120px]"
              >
                <option value="">全部关键词</option>
                {keywords.filter(k => k.active === 1).map(k => (
                  <option key={k.id} value={k.id}>{k.word}</option>
                ))}
              </select>
              {(search || sourceType || keywordId || filter !== "all") && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600/60 transition-colors font-mono flex-shrink-0"
                >
                  重置
                </button>
              )}
            </div>

            {topics.length === 0 ? (
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/40 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-mono">等待数据采集</p>
                <p className="text-[10px] text-slate-600 mt-1">点击「立即抓取」或等待自动采集（每30分钟）</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            )}

            {total > 20 && (
              <div className="flex items-center justify-center gap-4 mt-5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 rounded-lg border border-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-700/60 disabled:opacity-30 transition-colors font-mono">上一页</button>
                <span className="text-[10px] text-slate-600 font-mono">{page} / {Math.ceil(total / 20)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-700/60 disabled:opacity-30 transition-colors font-mono">下一页</button>
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <NotificationPanel />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile: bottom sheet for notifications */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="border-t border-slate-800/60 bg-slate-950/90 backdrop-blur-xl px-4 py-2">
          <details>
            <summary className="text-xs text-slate-400 font-mono cursor-pointer list-none">
              通知中心
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto">
              <NotificationPanel />
            </div>
          </details>
        </div>
      </div>
    </AuroraBackground>
  );
}


