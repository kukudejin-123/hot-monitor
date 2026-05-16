"use client";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface SparklesProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function SparklesCore({ children, className, color = "#f59e0b" }: SparklesProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev.filter((p) => p.size > 0);
        if (next.length < 6) {
          const id = Date.now();
          return [
            ...next,
            { id, x: Math.random() * 100, y: Math.random() * 100, size: 1 + Math.random() * 3 },
          ];
        }
        return next.map((p) => ({ ...p, size: p.size - 0.05 }));
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("relative inline-block", className)}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: p.size * 0.3,
            animationDuration: "1.5s",
          }}
        />
      ))}
      {children}
    </span>
  );
}
