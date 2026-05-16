"use client";
import { cn } from "../../lib/utils";
import { useEffect, useRef } from "react";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({ className, children }: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      time += 0.002;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      // Subtle aurora waves
      for (let i = 0; i < 3; i++) {
        const gradient = ctx!.createRadialGradient(
          w * (0.3 + i * 0.2 + Math.sin(time + i) * 0.1),
          h * 0.4 + Math.cos(time * 0.7 + i) * 80,
          50,
          w * (0.3 + i * 0.2),
          h * 0.4,
          w * 0.8
        );
        const colors = [
          ["rgba(59,130,246,0.06)", "rgba(59,130,246,0)"],
          ["rgba(139,92,246,0.04)", "rgba(139,92,246,0)"],
          ["rgba(6,182,212,0.05)", "rgba(6,182,212,0)"],
        ];
        gradient.addColorStop(0, colors[i][0]);
        gradient.addColorStop(1, colors[i][1]);
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, w, h);
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={cn("relative min-h-screen", className)}>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.8 }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
