"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsapConfig";

const POOL_SIZE = 6;
const IDLE_TOP = 80;
const IDLE_RIGHT = 40;

// Offsets (from the idle point) for the small resting cluster of stars at the
// top of the page. Index 0 is the primary star that goes on to do everything else.
const CLUSTER_OFFSETS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: -26, y: 16 },
  { x: 20, y: 30 },
  { x: -14, y: -22 },
  { x: 30, y: 6 },
];

interface Point {
  x: number;
  y: number;
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

function clamp01(p: number) {
  return Math.min(Math.max(p, 0), 1);
}

export function GuideStar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stars = starRefs.current;
        const trail = trailRef.current;
        const trackEl = document.getElementById("career-track");
        if (stars.length < POOL_SIZE || stars.some((s) => !s) || !trail || !trackEl) return;
        const star0 = stars[0]!;

        let idleX = window.innerWidth - IDLE_RIGHT;
        const idleY = IDLE_TOP;
        function onResize() {
          idleX = window.innerWidth - IDLE_RIGHT;
        }
        window.addEventListener("resize", onResize);

        stars.forEach((s) => gsap.set(s!, { xPercent: -50, yPercent: -50 }));
        gsap.set(trail, { xPercent: 0, yPercent: -50, transformOrigin: "0% 50%", width: 0, opacity: 0 });

        // Per-star twinkle loops -------------------------------------------------
        const twinkles: (gsap.core.Timeline | null)[] = stars.map(() => null);
        function startTwinkle(i: number, base = 0.5) {
          if (twinkles[i]) return;
          const el = stars[i]!;
          const tl = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0.2, 2) });
          tl.to(el, { opacity: 1, duration: 0.25, ease: "power2.out" })
            .to(el, { opacity: base, duration: 0.8, ease: "power2.inOut" })
            .to({}, { duration: () => gsap.utils.random(1, 3) });
          twinkles[i] = tl;
        }
        function stopTwinkle(i: number) {
          twinkles[i]?.kill();
          twinkles[i] = null;
        }

        // Idle cluster: several small dim stars, only one of which is "the" star.
        stars.forEach((s, i) => {
          const off = CLUSTER_OFFSETS[i];
          if (off) {
            gsap.set(s!, { x: idleX + off.x, y: idleY + off.y, opacity: 0.45, scale: 1 });
            startTwinkle(i, 0.45);
          } else {
            gsap.set(s!, { x: idleX, y: idleY, opacity: 0, scale: 1 });
          }
        });

        // Falling star: idle corner -> lands wherever getTarget() points, dragging a
        // comet trail. The cluster fades back into the sky as star0 departs.
        function positionAlongFall(getTarget: () => Point, p: number) {
          stopTwinkle(0);
          const { x: tx, y: ty } = getTarget();
          const x = lerp(idleX, tx, p);
          const y = lerp(idleY, ty, p);
          gsap.set(star0, { x, y, opacity: 0.6 + 0.4 * p, scale: 1 });

          const angle = Math.atan2(ty - idleY, tx - idleX) * (180 / Math.PI);
          const intensity = Math.sin(clamp01(p) * Math.PI);
          gsap.set(trail, { x, y, rotate: angle + 180, width: 90 * intensity, opacity: intensity * 0.85 });

          for (let i = 1; i <= 4; i++) {
            gsap.set(stars[i]!, { opacity: (1 - Math.min(p * 4, 1)) * 0.45 });
          }
        }

        function careerLandingTarget(): Point {
          const rect = trackEl!.getBoundingClientRect();
          return { x: rect.left + 5, y: rect.top };
        }

        // Falls across almost the entire scroll of the page above the timeline
        // (starts right away, not right before Career) so it's a long, gradual descent.
        ScrollTrigger.create({
          start: 60,
          end: () => {
            const r = trackEl!.getBoundingClientRect();
            return r.top + window.scrollY - window.innerHeight * 0.75;
          },
          scrub: true,
          onUpdate: (self) => positionAlongFall(careerLandingTarget, self.progress),
          onLeaveBack: () => {
            gsap.set(trail, { opacity: 0, width: 0 });
            stars.forEach((s, i) => {
              const off = CLUSTER_OFFSETS[i];
              if (!off) return;
              gsap.set(s!, { x: idleX + off.x, y: idleY + off.y, opacity: 0.45, scale: 1 });
              startTwinkle(i, 0.45);
            });
          },
        });

        // Rides the career track's own progress line, matching CareerTimeline.tsx's math 1:1.
        // Start/end must stay identical to that component's own #career-track ScrollTrigger.
        ScrollTrigger.create({
          trigger: trackEl,
          start: "top 75%",
          end: "bottom 55%",
          scrub: true,
          onUpdate: (self) => {
            stopTwinkle(0);
            const rect = trackEl!.getBoundingClientRect();
            const x = rect.left + 5;
            const y = rect.top + self.progress * trackEl!.offsetHeight;
            gsap.set(star0, { x, y, opacity: 1, scale: 1.6 });
            gsap.set(trail, { opacity: 0, width: 0 });
            for (let i = 1; i < POOL_SIZE; i++) gsap.set(stars[i]!, { opacity: 0 });
          },
          onLeave: () => startTwinkle(0, 0.7),
        });

        // Companion phase: the timeline hands off here (identical "bottom 55%" boundary,
        // so there's no gap/overlap), and the star drifts down a fixed corner band for the
        // rest of the page, twinkling the whole way (started by the timeline's onLeave above).
        ScrollTrigger.create({
          trigger: trackEl,
          start: "bottom 55%",
          end: () => document.documentElement.scrollHeight - window.innerHeight,
          scrub: true,
          onUpdate: (self) => {
            const bandTop = window.innerHeight * 0.22;
            const bandBottom = window.innerHeight * 0.72;
            gsap.set(star0, { x: idleX, y: lerp(bandTop, bandBottom, self.progress) });
          },
        });

        return () => {
          window.removeEventListener("resize", onResize);
          stars.forEach((_, i) => stopTwinkle(i));
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
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            starRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_1.5px_rgba(0,247,255,0.55)]"
        />
      ))}
    </div>
  );
}
