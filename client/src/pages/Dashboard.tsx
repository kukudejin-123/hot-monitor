import { useState, useEffect, useCallback } from "react";
import { TickerTape } from "../components/TickerTape.tsx";
import { TopicCard } from "../components/TopicCard.tsx";
import { KeywordManager } from "../components/KeywordManager.tsx";
import { NotificationPanel } from "../components/NotificationPanel.tsx";
import { GlitchText } from "../components/GlitchText.tsx";

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
  created_at: string;
}

export function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "verified">("all");
  const [stats, setStats] = useState({ newCount: 0, totalCount: 0 });

  const loadTopics = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter === "verified") params.set("verified", "1");
      const res = await fetch(`/api/topics?${params}`);
      const data = await res.json();
      setTopics(data.topics || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error("load topics error", e);
    }
  }, [page, filter]);

  useEffect(() => {
    loadTopics();
    const interval = setInterval(loadTopics, 30000);
    return () => clearInterval(interval);
  }, [loadTopics]);

  useEffect(() => {
    const newCount = topics.filter((t) => t.is_new === 1).length;
    setStats({ newCount, totalCount: total });
  }, [topics, total]);

  async function manualFetch() {
    setFetching(true);
    try {
      const res = await fetch("/api/topics/fetch", { method: "POST" });
      const data = await res.json();
      alert(
        `抓取完成！\nTwitter: ${data.results.twitter} 条\n网页: ${data.results.web} 条\n通过验证: ${data.results.verified} 条`
      );
      setPage(1);
      await loadTopics();
    } catch (e) {
      console.error("fetch error", e);
    }
    setFetching(false);
  }

  return (
    <div className="min-h-screen bg-dark-bg bg-grid">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-surface/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <GlitchText
              text="Hot Monitor"
              className="text-xl font-bold neon-text-cyan font-mono"
            />
            <span className="text-xs text-text-secondary font-mono hidden sm:inline">
              AI-Powered · Multi-Source
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="text-neon-cyan">
                热点 <span className="text-text-primary">{stats.totalCount}</span>
              </span>
              {stats.newCount > 0 && (
                <span className="text-neon-pink animate-pulse">
                  NEW <span className="text-text-primary">{stats.newCount}</span>
                </span>
              )}
            </div>
            <button
              onClick={manualFetch}
              disabled={fetching}
              className="px-4 py-2 rounded bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-sm hover:bg-neon-cyan/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {fetching ? "⚡ 抓取中..." : "⚡ 立即抓取"}
            </button>
          </div>
        </div>
        <TickerTape topics={topics} />
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Keywords */}
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-32">
              <KeywordManager />

              {/* Quick stats */}
              <div className="glass-card rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neon-cyan font-mono mb-3">
                  📊 监控统计
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded bg-dark-surface border border-dark-border">
                    <div className="text-2xl font-bold text-neon-cyan">{stats.totalCount}</div>
                    <div className="text-xs text-text-secondary mt-1">总热点</div>
                  </div>
                  <div className="text-center p-2 rounded bg-dark-surface border border-dark-border">
                    <div className="text-2xl font-bold text-neon-pink">{stats.newCount}</div>
                    <div className="text-xs text-text-secondary mt-1">新热点</div>
                  </div>
                  <div className="text-center p-2 rounded bg-dark-surface border border-dark-border">
                    <div className="text-2xl font-bold text-neon-purple">
                      {topics.filter((t) => t.source_type === "twitter").length}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Twitter</div>
                  </div>
                  <div className="text-center p-2 rounded bg-dark-surface border border-dark-border">
                    <div className="text-2xl font-bold text-neon-yellow">
                      {topics.filter((t) => t.source_type === "web").length}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">Web</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Topics */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold neon-text-purple font-mono">
                📡 热点实时流
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFilter("all"); setPage(1); }}
                  className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                    filter === "all"
                      ? "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan"
                      : "border border-dark-border text-text-secondary hover:text-neon-cyan"
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => { setFilter("verified"); setPage(1); }}
                  className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                    filter === "verified"
                      ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                      : "border border-dark-border text-text-secondary hover:text-neon-green"
                  }`}
                >
                  AI已验证
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {topics.length === 0 && (
                <div className="glass-card rounded-lg p-12 text-center">
                  <p className="text-4xl mb-4">🛰️</p>
                  <p className="text-text-secondary font-mono">
                    {'> '}等待数据... 点击「立即抓取」或等待自动采集
                  </p>
                  <p className="text-xs text-text-secondary/50 mt-2 font-mono">
                    自动采集每 30 分钟执行一次
                  </p>
                </div>
              )}
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-dark-border text-text-secondary font-mono text-sm hover:border-neon-cyan/30 disabled:opacity-30"
                >
                  ← 上一页
                </button>
                <span className="text-xs text-text-secondary font-mono">
                  {page} / {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="px-3 py-1 rounded border border-dark-border text-text-secondary font-mono text-sm hover:border-neon-cyan/30 disabled:opacity-30"
                >
                  下一页 →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom - Notifications (mobile friendly) */}
        <div className="mt-6 lg:hidden">
          <NotificationPanel />
        </div>
      </main>

      {/* Desktop: fixed notification panel */}
      <aside className="hidden lg:block fixed right-4 top-32 w-72 z-40">
        <NotificationPanel />
      </aside>
    </div>
  );
}
