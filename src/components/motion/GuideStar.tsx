"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsapConfig";

const IDLE_TOP = 96;
const IDLE_RIGHT = 32;

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

export function GuideStar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const star = starRef.current;
        const trail = trailRef.current;
        const trackEl = document.getElementById("career-track");
        if (!star || !trail || !trackEl) return;

        let idleX = window.innerWidth - IDLE_RIGHT;
        const idleY = IDLE_TOP;

        function onResize() {
          idleX = window.innerWidth - IDLE_RIGHT;
        }
        window.addEventListener("resize", onResize);

        gsap.set(star, { xPercent: -50, yPercent: -50, x: idleX, y: idleY, opacity: 0.5, scale: 1 });
        gsap.set(trail, { xPercent: 0, yPercent: -50, transformOrigin: "0% 50%", width: 0, opacity: 0 });

        let twinkleTl: gsap.core.Timeline | null = null;
        function startTwinkle() {
          if (twinkleTl) return;
          twinkleTl = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0.3, 1.5) });
          twinkleTl
            .to(star, { opacity: 1, scale: 1.8, duration: 0.2, ease: "power2.out" })
            .to(star, { opacity: 0.5, scale: 1, duration: 0.7, ease: "power2.inOut" })
            .to({}, { duration: () => gsap.utils.random(1.2, 3.2) });
        }
        function stopTwinkle() {
          twinkleTl?.kill();
          twinkleTl = null;
        }
        startTwinkle();

        // Falling star: idle corner -> lands exactly where the timeline phase picks up.
        function positionAlongFall(p: number) {
          const rect = trackEl!.getBoundingClientRect();
          const tx = rect.left + 5;
          const ty = rect.top;
          const x = lerp(idleX, tx, p);
          const y = lerp(idleY, ty, p);
          gsap.set(star, { x, y, opacity: 0.5 + 0.5 * p, scale: 1 });

          const angle = Math.atan2(ty - idleY, tx - idleX) * (180 / Math.PI);
          const intensity = Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI);
          gsap.set(trail, { x, y, rotate: angle + 180, width: 100 * intensity, opacity: intensity * 0.85 });
        }

        // Rides the career track's own progress line, matching CareerTimeline.tsx's math 1:1.
        function positionAlongTimeline(p: number) {
          const rect = trackEl!.getBoundingClientRect();
          const x = rect.left + 5;
          const y = rect.top + p * trackEl!.offsetHeight;
          gsap.set(star, { x, y, opacity: 1, scale: 1 });
          gsap.set(trail, { opacity: 0, width: 0 });
        }

        ScrollTrigger.create({
          trigger: trackEl,
          start: "top 95%",
          end: "top 75%",
          scrub: true,
          onUpdate: (self) => {
            stopTwinkle();
            positionAlongFall(self.progress);
          },
          onLeaveBack: () => {
            startTwinkle();
            gsap.set(star, { x: idleX, y: idleY, opacity: 0.5, scale: 1 });
            gsap.set(trail, { opacity: 0, width: 0 });
          },
        });

        // Start/end must stay identical to CareerTimeline.tsx's own #career-track
        // ScrollTrigger so the two progress values never drift apart.
        ScrollTrigger.create({
          trigger: trackEl,
          start: "top 75%",
          end: "bottom 55%",
          scrub: true,
          onUpdate: (self) => {
            stopTwinkle();
            positionAlongTimeline(self.progress);
          },
          onLeave: () => startTwinkle(),
        });

        return () => {
          window.removeEventListener("resize", onResize);
          stopTwinkle();
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-30" aria-hidden>
      <div
        ref={trailRef}
        className="absolute left-0 top-0 h-px rounded-full bg-gradient-to-r from-cyan-300/80 to-transparent"
      />
      <div
        ref={starRef}
        className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(0,247,255,0.6)]"
      />
    </div>
  );
}
