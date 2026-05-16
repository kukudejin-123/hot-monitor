interface TickerTapeProps {
  topics: Array<{ id: number; title: string; ai_score: number }>;
}

export function TickerTape({ topics }: TickerTapeProps) {
  if (topics.length === 0) {
    return (
      <div className="border-b border-slate-800/50 bg-slate-900/30 px-4 py-1.5">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          等待数据采集...
        </div>
      </div>
    );
  }

  const doubled = [...topics, ...topics];

  return (
    <div className="border-b border-slate-800/50 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
      <div className="flex items-center py-1.5">
        <div className="flex items-center gap-6 ticker-track px-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider">LIVE</span>
          </div>
          {doubled.map((t, i) => (
            <a
              key={`${t.id}-${i}`}
              href={`#topic-${t.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`topic-${t.id}`)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 cursor-pointer"
            >
              <span className="text-[10px] text-slate-600 font-mono tabular-nums">
                [{t.ai_score}]
              </span>
              <span className="truncate max-w-[280px]">{t.title.slice(0, 70)}</span>
              <span className="text-slate-700">·</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
