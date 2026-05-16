"use client";
import { cn } from "../../lib/utils";

interface MovingBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
}

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 3000,
}: MovingBorderProps) {
  return (
    <div
      className={cn(
        "relative p-[1px] overflow-hidden rounded-lg",
        containerClassName
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          borderClassName
        )}
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, #3b82f6 90deg, #8b5cf6 180deg, #06b6d4 270deg, transparent 360deg)`,
          animation: `spin ${duration}ms linear infinite`,
        }}
      />
      <div
        className={cn(
          "relative rounded-lg bg-slate-950",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
