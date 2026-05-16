import { cn } from "../lib/utils";

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

const SOURCE_MAP: Record<string, { label: string; color: string }> = {
  twitter:     { label: "𝕏",     color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  bing:        { label: "Bing",   color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  "bing-news": { label: "News",   color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  hackernews:  { label: "HN",     color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  reddit:      { label: "Reddit", color: "bg-orange-600/10 text-orange-400 border-orange-600/20" },
  "google-news":{ label: "新闻",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bilibili:    { label: "B站",    color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

function getSource(type: string) {
  return SOURCE_MAP[type] ?? { label: type, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export function TopicCard({ topic }: { topic: Topic }) {
  const isNew = topic.is_new === 1;
  const src = getSource(topic.source_type);

  return (
    <article
      className={cn(
        "group relative rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-4 transition-all duration-300",
        "hover:border-slate-700/80 hover:bg-slate-900/60",
        "animate-fade-in",
        isNew && "border-l-2 border-l-amber-500/60"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {topic.keyword_word && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent-purple/10 text-accent-purple font-medium font-mono tracking-wide">
                {topic.keyword_word}
              </span>
            )}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono border", src.color)}>
              {src.label}
            </span>
            {topic.verified === 1 && (
              <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400/80" />
                AI验证
              </span>
            )}
            {isNew && (
              <span className="text-[10px] text-amber-400 font-mono animate-pulse">● NEW</span>
            )}
          </div>

          <h3 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-slate-100 transition-colors">
            {topic.source_url ? (
              <a href={topic.source_url} target="_blank" rel="noopener noreferrer">
                {topic.title.slice(0, 120)}
              </a>
            ) : (
              topic.title.slice(0, 120)
            )}
          </h3>
          {topic.summary && (
            <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
              {topic.summary}
            </p>
          )}
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono border-2",
              topic.ai_score >= 8
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                : topic.ai_score >= 6
                  ? "border-amber-500/40 text-amber-400 bg-amber-500/5"
                  : "border-slate-600/40 text-slate-400 bg-slate-500/5"
            )}
          >
            {topic.ai_score}
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5 font-mono">AI评分</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/50">
        <span className="truncate max-w-[240px]" title={topic.ai_reason}>
          {topic.ai_reason}
        </span>
        <span className="flex-shrink-0 ml-auto">{timeAgo(topic.created_at)}</span>
      </div>
    </article>
  );
}
