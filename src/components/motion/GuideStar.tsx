"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsapConfig";

const POOL_SIZE = 6;

interface Point {
  x: number;
  y: number;
}

// Fractions of viewport width/height for the resting cluster of stars at the
// top of the page -- spread across the whole width, not clumped in a corner.
// Index 0 is the primary star that goes on to do everything else.
const CLUSTER_FRACTIONS: Point[] = [
  { x: 0.86, y: 0.08 },
  { x: 0.15, y: 0.16 },
  { x: 0.42, y: 0.07 },
  { x: 0.64, y: 0.22 },
  { x: 0.3, y: 0.24 },
];

function clusterPoint(i: number): Point {
  const f = CLUSTER_FRACTIONS[i];
  return { x: window.innerWidth * f.x, y: window.innerHeight * f.y };
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
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const fgLayerRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stars = starRefs.current;
        const trail = trailRef.current;
        const trackEl = document.getElementById("career-track");
        const bgLayer = bgLayerRef.current;
        const fgLayer = fgLayerRef.current;
        if (stars.length < POOL_SIZE || stars.some((s) => !s) || !trail || !trackEl || !bgLayer || !fgLayer) return;
        const star0 = stars[0]!;

        // The idle cluster rests behind normal page content (bgLayer); anything
        // actively doing something (falling, riding the timeline, docking on a
        // border) moves to fgLayer so it reads clearly over text/images.
        function toForeground(el: HTMLElement) {
          if (el.parentElement !== fgLayer) fgLayer!.appendChild(el);
        }
        function toBackground(el: HTMLElement) {
          if (el.parentElement !== bgLayer) bgLayer!.appendChild(el);
        }

        let idleX = clusterPoint(0).x;
        let idleY = clusterPoint(0).y;
        function onResize() {
          const p = clusterPoint(0);
          idleX = p.x;
          idleY = p.y;
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

        // Idle cluster: several small dim stars spread across the page, only one
        // of which is "the" star.
        stars.forEach((s, i) => {
          if (i < CLUSTER_FRACTIONS.length) {
            const p = clusterPoint(i);
            gsap.set(s!, { x: p.x, y: p.y, opacity: 0.6, scale: 1 });
            startTwinkle(i, 0.6);
          } else {
            gsap.set(s!, { x: idleX, y: idleY, opacity: 0, scale: 1 });
          }
        });

        // Falling star: idle corner -> lands wherever getTarget() points, dragging a
        // comet trail. The cluster fades back into the sky as star0 departs.
        function positionAlongFall(getTarget: () => Point, p: number) {
          stopTwinkle(0);
          if (p > 0) {
            toForeground(star0);
            toForeground(trail!);
          }
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
            toBackground(star0);
            toBackground(trail);
            stars.forEach((s, i) => {
              if (i >= CLUSTER_FRACTIONS.length) return;
              toBackground(s!);
              const p = clusterPoint(i);
              gsap.set(s!, { x: p.x, y: p.y, opacity: 0.6, scale: 1 });
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

        // A panel's own content fade-out happens inside ITS pinned dwell (see
        // PinnedPanel.tsx: "top top" -> "+=55%"), not when the next panel
        // scrolls into view. Watching the next panel's arrival to release the
        // star made it reappear while the previous panel's video/text were
        // still fully visible -- it was stealing focus, not merging. Instead,
        // each transition has two stages that share one `fallFrom` snapshot:
        // Stage A watches the PREVIOUS panel's own pin (identical trigger/
        // start/end to its internal timeline) and only releases the star in
        // the last 30% of that dwell, once its content has actually faded.
        // Stage B is the scroll-through gap as the NEXT panel arrives, where
        // the star travels the rest of the way and merges into its border.
        const panels = Array.from(document.querySelectorAll<HTMLElement>("#projects > section"));
        const RELEASE_AT = 0.7;

        function stageA(
          prevPanel: HTMLElement,
          prevBorder: HTMLElement | null,
          getFrom: () => Point | null,
          setFrom: (p: Point | null) => void
        ) {
          ScrollTrigger.create({
            trigger: prevPanel,
            start: "top top",
            end: "+=55%",
            scrub: true,
            onUpdate: (self) => {
              const raw = self.progress;
              if (raw < RELEASE_AT) {
                gsap.set(star0, { opacity: 0 });
                gsap.set(trail, { opacity: 0, width: 0 });
                return;
              }
              stopTwinkle(0);
              const from = getFrom() ?? { x: (gsap.getProperty(star0, "x") as number) ?? idleX, y: (gsap.getProperty(star0, "y") as number) ?? idleY };
              setFrom(from);
              const pA = (raw - RELEASE_AT) / (1 - RELEASE_AT);
              gsap.set(star0, { x: from.x, y: from.y, opacity: pA, scale: 1.6 });
              setBorderGlow(prevBorder, 1 - pA);
            },
            onLeaveBack: () => setFrom(null),
          });
        }

        function stageB(panel: HTMLElement, thisBorder: HTMLElement | null, getFrom: () => Point | null) {
          ScrollTrigger.create({
            trigger: panel,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => {
              stopTwinkle(0);
              const pB = self.progress;
              const from = getFrom() ?? { x: (gsap.getProperty(star0, "x") as number) ?? idleX, y: (gsap.getProperty(star0, "y") as number) ?? idleY };
              const to = projectAnchor(panel);
              const x = lerp(from.x, to.x, pB);
              const y = lerp(from.y, to.y, pB);
              const opacity = pB < RELEASE_AT ? 1 : 1 - (pB - RELEASE_AT) / (1 - RELEASE_AT);
              gsap.set(star0, { x, y, opacity, scale: 1.6 });

              const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
              const intensity = Math.sin(clamp01(pB) * Math.PI);
              gsap.set(trail, { x, y, rotate: angle + 180, width: 70 * intensity, opacity: intensity * 0.8 });

              setBorderGlow(thisBorder, pB);
              for (let k = 1; k < POOL_SIZE; k++) gsap.set(stars[k]!, { opacity: 0 });
            },
          });
        }

        panels.forEach((panel, i) => {
          const thisBorder = projectBorderTarget(panel);

          if (i === 0) {
            // No previous panel to wait on -- falls from the timeline hand-off.
            // Bounds are explicit absolute scroll positions matching trackEl's
            // own "bottom 55%" (exactly where the timeline ST's range ends) and
            // this panel's own "top top" (exactly where its pin begins), so
            // this can never overlap the timeline's still-active range and pull
            // the star away before it's actually finished riding the track.
            let fallFrom: Point | null = null;
            ScrollTrigger.create({
              start: () => {
                const r = trackEl!.getBoundingClientRect();
                return r.bottom + window.scrollY - window.innerHeight * 0.55;
              },
              end: () => {
                const r = panel.getBoundingClientRect();
                return r.top + window.scrollY;
              },
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
                gsap.set(star0, { x, y, opacity: lerp(1, 0, p), scale: 1.6 });

                const angle = Math.atan2(to.y - fallFrom.y, to.x - fallFrom.x) * (180 / Math.PI);
                const intensity = Math.sin(clamp01(p) * Math.PI);
                gsap.set(trail, { x, y, rotate: angle + 180, width: 70 * intensity, opacity: intensity * 0.8 });

                setBorderGlow(thisBorder, p);
                for (let k = 1; k < POOL_SIZE; k++) gsap.set(stars[k]!, { opacity: 0 });
              },
              onLeaveBack: () => {
                fallFrom = null;
              },
            });
            return;
          }

          const prevPanel = panels[i - 1];
          const prevBorder = projectBorderTarget(prevPanel);
          let fallFrom: Point | null = null;
          stageA(prevPanel, prevBorder, () => fallFrom, (v) => { fallFrom = v; });
          stageB(panel, thisBorder, () => fallFrom);
        });

        // Fades the last panel's border out during ITS OWN pin tail, same
        // pattern as stageA, so it doesn't linger lit once Also-shipped's stars
        // have already taken over.
        const lastPanelBorder = panels.length ? projectBorderTarget(panels[panels.length - 1]) : null;
        if (panels.length) {
          const lastPanel = panels[panels.length - 1];
          ScrollTrigger.create({
            trigger: lastPanel,
            start: "top top",
            end: "+=55%",
            scrub: true,
            onUpdate: (self) => {
              const raw = self.progress;
              if (raw < RELEASE_AT) return;
              setBorderGlow(lastPanelBorder, 1 - (raw - RELEASE_AT) / (1 - RELEASE_AT));
            },
          });
        }

        // --- Also shipped + Core Technologies: split into one star per box -----
        function revealSplit(targets: Point[], scale: number) {
          stopTwinkle(0);
          targets.forEach((t, i) => {
            if (!stars[i]) return;
            toForeground(stars[i]!);
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
            onUpdate: () => trackSplit(centersOf(gridBoxes())),
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
    <div ref={containerRef} aria-hidden>
      {/* Behind normal-flow content (text/images have no z-index of their own,
          so anything here paints under them) -- the idle/resting layer. */}
      <div ref={bgLayerRef} className="pointer-events-none fixed inset-0 -z-10">
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
      {/* In front, for whenever the star needs to be clearly visible over
          content (falling, riding the timeline, merging into a border). */}
      <div ref={fgLayerRef} className="pointer-events-none fixed inset-0 z-30" />
    </div>
  );
}
