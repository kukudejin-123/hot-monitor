import { useState, useEffect } from "react";

export function GlitchText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 300);
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${glitching ? "glitch-active" : ""} ${className}`}>
      {text}
      {glitching && (
        <>
          <span
            className="absolute top-0 left-0 text-neon-pink opacity-70"
            style={{ clipPath: "inset(45% 0 10% 0)", transform: "translate(-2px, 0)" }}
          >
            {text}
          </span>
          <span
            className="absolute top-0 left-0 text-neon-cyan opacity-70"
            style={{ clipPath: "inset(10% 0 55% 0)", transform: "translate(2px, 0)" }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
