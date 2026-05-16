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

const SOURCE_MAP: Record<string, { label: string; style: string }> = {
  twitter:    { label: "𝕏 Twitter", style: "text-neon-cyan border-neon-cyan/30" },
  bing:       { label: "🔍 Bing", style: "text-teal-400 border-teal-400/30" },
  "bing-news":{ label: "📰 Bing新闻", style: "text-teal-300 border-teal-300/30" },
  google:     { label: "🔍 Google", style: "text-blue-400 border-blue-400/30" },
  duckduckgo: { label: "🦆 DuckDuckGo", style: "text-orange-400 border-orange-400/30" },
  hackernews: { label: "▲ HN", style: "text-orange-500 border-orange-500/30" },
  sogou:      { label: "🐕 搜狗", style: "text-amber-400 border-amber-400/30" },
  bilibili:   { label: "📺 B站", style: "text-pink-400 border-pink-400/30" },
  weibo:      { label: "🧣 微博", style: "text-red-400 border-red-400/30" },
  "weibo-hot":{ label: "🔥 微博热搜", style: "text-red-500 border-red-500/30" },
};

function sourceLabel(type: string) {
  return SOURCE_MAP[type]?.label ?? `🌐 ${type}`;
}

function sourceStyle(type: string) {
  return SOURCE_MAP[type]?.style ?? "text-text-secondary border-dark-border";
}

export function TopicCard({ topic }: { topic: Topic }) {
  const isNew = topic.is_new === 1;
  const scoreWidth = Math.max(topic.ai_score * 10, 5);

  return (
    <div
      id={`topic-${topic.id}`}
      className={`glass-card rounded-lg p-4 transition-all duration-300 hover:border-neon-cyan/30 ${
        isNew ? "border-l-2 border-l-neon-cyan pulse-new" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {topic.keyword_word && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-dark-surface text-neon-purple font-mono border border-dark-border">
                #{topic.keyword_word}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${sourceStyle(topic.source_type)}`}>
              {sourceLabel(topic.source_type)}
            </span>
            {topic.verified === 1 && (
              <span className="text-xs text-neon-green font-mono">✓ AI已验证</span>
            )}
            {isNew && (
              <span className="text-xs text-neon-pink font-mono animate-pulse">NEW</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-text-primary leading-snug mb-1">
            {topic.source_url ? (
              <a
                href={topic.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neon-cyan transition-colors"
              >
                {topic.title.slice(0, 150)}
              </a>
            ) : (
              topic.title.slice(0, 150)
            )}
          </h3>
          {topic.summary && (
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {topic.summary}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary mt-3">
        <div className="flex items-center gap-2">
          <span className="text-neon-cyan font-mono">AI {topic.ai_score}/10</span>
          <div className="w-20 h-1 bg-dark-border rounded-full overflow-hidden">
            <div className="score-bar h-full" style={{ width: `${scoreWidth}%` }} />
          </div>
        </div>
        <span className="text-dark-border">|</span>
        <span className="truncate max-w-[200px]" title={topic.ai_reason}>
          {topic.ai_reason}
        </span>
        <span className="text-dark-border">|</span>
        <span>{new Date(topic.created_at).toLocaleString("zh-CN")}</span>
      </div>
    </div>
  );
}
