interface TickerTapeProps {
  topics: Array<{ id: number; title: string; ai_score: number }>;
}

export function TickerTape({ topics }: TickerTapeProps) {
  if (topics.length === 0) {
    return (
      <div className="border-b border-dark-border bg-dark-surface px-4 py-2 overflow-hidden">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span className="text-neon-cyan font-mono text-xs">● OFFLINE</span>
          <span>等待热点数据...</span>
        </div>
      </div>
    );
  }

  const duplicated = [...topics, ...topics];

  return (
    <div className="border-b border-dark-border bg-dark-surface overflow-hidden">
      <div className="flex items-center py-2" style={{ width: "max-content" }}>
        <div className="ticker-track flex items-center gap-8 px-4">
          <span className="text-neon-green font-mono text-xs flex-shrink-0">● LIVE</span>
          {duplicated.map((t, i) => (
            <a
              key={`${t.id}-${i}`}
              href="#"
              className="flex items-center gap-2 text-sm text-text-primary hover:text-neon-cyan transition-colors flex-shrink-0 font-mono"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`topic-${t.id}`)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-neon-purple">[{t.ai_score}/10]</span>
              <span className="truncate max-w-[300px]">{t.title.slice(0, 60)}</span>
              <span className="text-dark-border">|</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
