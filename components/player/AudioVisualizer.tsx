"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function AudioVisualizer({
  analyser = null,
  enabled = false,
  className = "",
}: {
  analyser?: AnalyserNode | null;
  enabled?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !enabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!enabled) return;
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / data.length) * 2.5;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(${barHeight + 100},50,150)`;
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [analyser, enabled]);

  // Respect prefers-reduced-motion
  const mediaRef = useRef<MediaQueryList | null>(null);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaRef.current = mql;
    if (mql.matches) return; // disable animation under reduced motion
    return () => mql.removeEventListener("change", () => {});
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-24 bg-white/5 rounded-xl", className)}
      width={400}
      height={80}
    />
  );
}
