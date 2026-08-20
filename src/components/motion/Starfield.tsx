"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

const GLOW_SIZE = 560;

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let rafId = 0;
    let t = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      targetX = smoothX = width / 2;
      targetY = smoothY = height / 2;
      positionGlow(smoothX, smoothY);

      const count = Math.round((width * height) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      }));

      if (reduceMotion) drawStatic();
    }

    function positionGlow(x: number, y: number) {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${x - GLOW_SIZE / 2}px, ${y - GLOW_SIZE / 2}px, 0)`;
      }
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx!.globalAlpha = s.baseAlpha;
        ctx!.fillStyle = "#ffffff";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function animate() {
      t += 1;
      smoothX += (targetX - smoothX) * 0.08;
      smoothY += (targetY - smoothY) * 0.08;

      ctx!.clearRect(0, 0, width, height);
      const parallaxX = (smoothX - width / 2) * 0.05;
      const parallaxY = (smoothY - height / 2) * 0.05;
      for (const s of stars) {
        const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.25;
        ctx!.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx!.fillStyle = "#ffffff";
        ctx!.beginPath();
        ctx!.arc(s.x + parallaxX, s.y + parallaxY, s.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      positionGlow(smoothX, smoothY);
      rafId = requestAnimationFrame(animate);
    }

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    resize();
    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      window.addEventListener("mousemove", onMouseMove);
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 -z-10 rounded-full opacity-80 blur-[90px]"
        style={{
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          background: "radial-gradient(circle, rgba(0,247,255,0.16), transparent 70%)",
        }}
        aria-hidden
      />
    </>
  );
}
