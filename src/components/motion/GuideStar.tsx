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

function centersOf(container: Element | null): Point[] {
  if (!container) return [];
  return Array.from(container.children).map((child) => {
    const r = child.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + 16 };
  });
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
            gsap.set(s!, { x: idleX + off.x, y: idleY + off.y, opacity: 0.6, scale: 1 });
            startTwinkle(i, 0.6);
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
            gsap.set(stars[i]!, { opacity: (1 - Math.min(p * 4, 1)) * 0.6 });
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
              gsap.set(s!, { x: idleX + off.x, y: idleY + off.y, opacity: 0.6, scale: 1 });
              startTwinkle(i, 0.6);
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
        });

        // --- Projects: the star falls into each panel's media card and merges
        // into its border (same color, per your "merge into that button" idea,
        // generalized to all three panels) instead of docking beside it. -------
        function projectBorderTarget(panel: HTMLElement): HTMLElement | null {
          return panel.querySelector<HTMLElement>(".rounded-2xl.border");
        }
        function projectAnchor(panel: HTMLElement): Point {
          const el = projectBorderTarget(panel);
          const r = (el ?? panel).getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        function setBorderGlow(el: HTMLElement | null, p: number) {
          if (!el) return;
          gsap.set(el, {
            borderColor: gsap.utils.interpolate("rgba(255,255,255,0.1)", "rgba(45,230,255,0.9)", clamp01(p)),
            boxShadow: `0 0 ${26 * clamp01(p)}px -6px rgba(45,230,255,${0.55 * clamp01(p)})`,
          });
        }

        const panels = Array.from(document.querySelectorAll<HTMLElement>("#projects > section"));
        panels.forEach((panel, i) => {
          const prevBorder = i > 0 ? projectBorderTarget(panels[i - 1]) : null;
          const thisBorder = projectBorderTarget(panel);
          let fallFrom: Point | null = null;

          // Covers the scroll distance while this panel scrolls into pinned
          // position -- the natural "gap" between the previous panel's dwell
          // ending and this one's beginning becomes the falling-star transit.
          ScrollTrigger.create({
            trigger: panel,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => {
              stopTwinkle(0);
              const p = self.progress;
              if (!fallFrom) {
                fallFrom = {
                  x: (gsap.getProperty(star0, "x") as number) ?? idleX,
                  y: (gsap.getProperty(star0, "y") as number) ?? idleY,
                };
              }
              const to = projectAnchor(panel);
              const x = lerp(fallFrom.x, to.x, p);
              const y = lerp(fallFrom.y, to.y, p);

              const intensity = Math.sin(clamp01(p) * Math.PI);
              // Panel 0 arrives already visible (straight from the fully-lit
              // timeline). Every panel after that starts merged into the
              // previous border (invisible), so it fades IN as it detaches,
              // peaks mid-flight, then fades OUT again as it lands.
              const starOpacity = prevBorder ? intensity : lerp(1, 0, clamp01(p));
              gsap.set(star0, { x, y, opacity: starOpacity, scale: 1.6 });

              const angle = Math.atan2(to.y - fallFrom.y, to.x - fallFrom.x) * (180 / Math.PI);
              gsap.set(trail, { x, y, rotate: angle + 180, width: 70 * intensity, opacity: intensity * 0.8 });

              setBorderGlow(prevBorder, 1 - p);
              setBorderGlow(thisBorder, p);
              for (let k = 1; k < POOL_SIZE; k++) gsap.set(stars[k]!, { opacity: 0 });
            },
            onLeaveBack: () => {
              fallFrom = null;
            },
          });
        });
        const lastPanelBorder = panels.length ? projectBorderTarget(panels[panels.length - 1]) : null;

        // --- Also shipped + Core Technologies: split into one star per box -----
        function revealSplit(targets: Point[], scale: number) {
          stopTwinkle(0);
          targets.forEach((t, i) => {
            if (!stars[i]) return;
            gsap.to(stars[i]!, { x: t.x, y: t.y, opacity: 1, scale, duration: 0.6, ease: "power2.out" });
          });
          for (let i = targets.length; i < POOL_SIZE; i++) {
            gsap.to(stars[i]!, { opacity: 0, duration: 0.4 });
          }
        }
        function trackSplit(targets: Point[]) {
          targets.forEach((t, i) => {
            if (stars[i]) gsap.set(stars[i]!, { x: t.x, y: t.y });
          });
        }

        const gridEl = document.getElementById("project-grid");
        if (gridEl) {
          const gridBoxes = () => gridEl.querySelector(":scope > div.grid");
          ScrollTrigger.create({
            trigger: gridEl,
            start: "top 65%",
            end: "bottom 35%",
            scrub: true,
            onUpdate: (self) => {
              trackSplit(centersOf(gridBoxes()));
              setBorderGlow(lastPanelBorder, 1 - self.progress);
            },
            onEnter: () => revealSplit(centersOf(gridBoxes()), 1.3),
            onEnterBack: () => revealSplit(centersOf(gridBoxes()), 1.3),
          });
        }

        const skillsEl = document.getElementById("skills");
        if (skillsEl) {
          const terminalEl = skillsEl.querySelector(":scope > div.mt-6");
          const targets = () => {
            const boxes = centersOf(skillsEl.querySelector(":scope > div.grid"));
            if (terminalEl) {
              const r = terminalEl.getBoundingClientRect();
              boxes.push({ x: r.left + r.width / 2, y: r.top + 16 });
            }
            return boxes;
          };
          ScrollTrigger.create({
            trigger: skillsEl,
            start: "top 65%",
            end: "bottom 35%",
            scrub: true,
            onUpdate: () => trackSplit(targets()),
            onEnter: () => revealSplit(targets(), 1.1),
            onEnterBack: () => revealSplit(targets(), 1.1),
          });
        }

        // --- Contact: everything converges into one, a little bigger -----------
        const contactEl = document.getElementById("contact");
        if (contactEl) {
          let mergeFrom: Point[] = [];
          ScrollTrigger.create({
            trigger: contactEl,
            start: "top 85%",
            end: "top 45%",
            scrub: true,
            onUpdate: (self) => {
              stopTwinkle(0);
              const heading = contactEl.querySelector("h2") ?? contactEl;
              const r = heading.getBoundingClientRect();
              const target = { x: r.left + r.width / 2, y: r.top - 20 };
              const p = self.progress;

              if (mergeFrom.length === 0) {
                mergeFrom = stars.map((s) => ({
                  x: (gsap.getProperty(s, "x") as number) || idleX,
                  y: (gsap.getProperty(s, "y") as number) || idleY,
                }));
              }

              stars.forEach((s, i) => {
                const from = mergeFrom[i];
                const x = lerp(from.x, target.x, p);
                const y = lerp(from.y, target.y, p);
                if (i === 0) {
                  gsap.set(s!, { x, y, opacity: 1, scale: lerp(1.3, 2.2, p) });
                } else {
                  gsap.set(s!, { x, y, opacity: lerp(1, 0, p), scale: lerp(1, 0.4, p) });
                }
              });
            },
            onLeave: () => startTwinkle(0, 0.75),
            onLeaveBack: () => {
              mergeFrom = [];
            },
          });
        }

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
          className="absolute left-0 top-0 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(0,247,255,0.6)]"
        />
      ))}
    </div>
  );
}
