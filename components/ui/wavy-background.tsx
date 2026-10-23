import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";
import { cn } from "./lib/utils";

type WavyBackgroundProps = {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
};

export const WavyBackground: React.FC<WavyBackgroundProps> = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill, // Default handled in component logic if needed, but we pass explicit
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isSafari, setIsSafari] = useState(false);

  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (ctx.canvas.width = window.innerWidth);
    let h = (ctx.canvas.height = window.innerHeight);
    ctx.filter = `blur(${blur}px)`;
    let nt = 0;
    let i = 0;
    let x = 0;

    const waveColors = colors ?? [
      "#38bdf8",
      "#818cf8",
      "#c084fc",
      "#e879f9",
      "#22d3ee",
    ];

    const drawWave = (n: number) => {
      nt += getSpeed();
      for (i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth || 50;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100;
          ctx.lineTo(x, y + h * 0.5); // centered vertically
        }
        ctx.stroke();
        ctx.closePath();
      }
    };

    const render = () => {
      // background fill: use provided color or default white
      ctx.fillStyle = backgroundFill || "#ffffff";
      ctx.globalAlpha = waveOpacity ?? 0.5;
      ctx.fillRect(0, 0, w, h);
      drawWave(5);
      animationRef.current = requestAnimationFrame(render);
    };

    const onResize = () => {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };
    window.addEventListener("resize", onResize);
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [blur, colors, waveOpacity, waveWidth, backgroundFill, speed]);

  return (
    <div
      className={cn(
        "h-screen flex flex-col items-center justify-center relative overflow-hidden",
        containerClassName
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={isSafari ? { filter: `blur(${blur}px)` } : {}}
      />
      <div className={cn("relative z-10 w-full", className)} {...props}>
        {children}
      </div>
    </div>
  );
};
