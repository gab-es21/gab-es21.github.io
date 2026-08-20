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

// Equivalent of ScrollTrigger's "top X%" / "bottom X%" string syntax, but
// computed live from the element's current position instead of a cached
// string resolution. Needed for anything positioned after the pinned
// project panels: their absolute position depends on those panels' pin-
// spacer heights, which don't exist yet when this component's effect first
// runs (it mounts earlier in the tree than PinnedPanel), and a string
// boundary snapshotted at that moment doesn't get corrected by GSAP's own
// refresh pass. A function is re-evaluated on every refresh instead.
function atViewportTop(el: HTMLElement, percent: number) {
  const r = el.getBoundingClientRect();
  return r.top + window.scrollY - percent * window.innerHeight;
}
function atViewportBottom(el: HTMLElement, percent: number) {
  const r = el.getBoundingClientRect();
  return r.bottom + window.scrollY - percent * window.innerHeight;
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
        // The timeline is stashed directly on the DOM element (not just in this
        // closure's local array) because Next.js 16 / React 19 can invoke this
        // whole effect more than once for the same mounted elements (see the
        // defensive cleanup above); matchMedia's own revert() wasn't reliably
        // killing a previous generation's infinite-repeat twinkle, leaving two
        // independent loops fighting over the same element's opacity. Reading
        // any existing timeline off the element itself, regardless of which
        // generation created it, makes this correct no matter how many times
        // the effect runs.
        type TwinkleHost = HTMLDivElement & { __twinkleTl?: gsap.core.Timeline };
        function startTwinkle(i: number, base = 0.5) {
          const el = stars[i] as TwinkleHost;
          if (el.__twinkleTl) return;
          const tl = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0.2, 2) });
          tl.to(el, { opacity: 1, duration: 0.25, ease: "power2.out" })
            .to(el, { opacity: base, duration: 0.8, ease: "power2.inOut" })
            .to({}, { duration: () => gsap.utils.random(1, 3) });
          el.__twinkleTl = tl;
        }
        function stopTwinkle(i: number) {
          const el = stars[i] as TwinkleHost | undefined;
          el?.__twinkleTl?.kill();
          if (el) el.__twinkleTl = undefined;
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
            // Their idle twinkle loop runs forever (repeat: -1) until killed --
            // without this it keeps overwriting opacity on its own schedule,
            // fighting this fade and flickering the companions back into view
            // at their stale idle-cluster positions for the rest of the page.
            stopTwinkle(i);
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
          id: "guidestar-fall1",
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
          id: "guidestar-timeline",
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
        // PinnedPanel.tsx's own entrance timeline (desktop): text .from()
        // duration 0.4 starting at t=0; media .from() duration 0.4 starting
        // "<0.1" (0.1 after the text tween's start, so t=0.1) -> media hits its
        // max (opacity 1, scale 1) at t=0.5. The exit fade starts "+=0.3" after
        // that (t=0.8) and runs 0.4 more, for a total timeline length of 1.2.
        // So media's max, as a fraction of the whole pin dwell, is 0.5/1.2.
        // The star must reach opacity 0 (fully merged) at exactly that point --
        // not before the video has finished fading/zooming in.
        const ARRIVE_INTO_PIN = 0.5 / 1.2;
        function intoPin(panel: HTMLElement, fraction: number) {
          const r = panel.getBoundingClientRect();
          return r.top + window.scrollY + window.innerHeight * 0.55 * fraction;
        }

        function stageA(
          idx: number,
          prevPanel: HTMLElement,
          prevBorder: HTMLElement | null,
          getFrom: () => Point | null,
          setFrom: (p: Point | null) => void
        ) {
          ScrollTrigger.create({
            id: `guidestar-stageA-${idx}`,
            trigger: prevPanel,
            // Starts exactly where this panel's own incoming fall lands
            // (ARRIVE_INTO_PIN), not at raw "top top" -- otherwise this watcher
            // and the still-arriving fall both control star0's opacity at once
            // and fight over it for the whole overlap. End is computed the same
            // way (not "+=55%", which would resolve relative to this custom
            // start rather than the panel's actual pin end).
            start: () => intoPin(prevPanel, ARRIVE_INTO_PIN),
            end: () => intoPin(prevPanel, 1),
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

        function stageB(idx: number, prevPanel: HTMLElement, panel: HTMLElement, thisBorder: HTMLElement | null, getFrom: () => Point | null) {
          ScrollTrigger.create({
            id: `guidestar-stageB-${idx}`,
            trigger: panel,
            // Not "top bottom": that string gets resolved against panel's
            // CURRENT layout position, which depends on the previous panel's
            // pin-spacer height -- but this component's effect runs before
            // PinnedPanel's own effect has created that spacer (GuideStar
            // mounts earlier in the tree), so the string snapshot is taken
            // ~495px (one pin duration) too early and never gets corrected on
            // refresh. Starting exactly where the previous panel's own pin
            // ends is immune to that ordering issue and stays contiguous with
            // stageA's end by construction.
            start: () => intoPin(prevPanel, 1),
            end: () => intoPin(panel, ARRIVE_INTO_PIN),
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
            // Start is an explicit absolute scroll position matching trackEl's
            // own "bottom 55%" (exactly where the timeline ST's range ends), so
            // this can never overlap the timeline's still-active range and pull
            // the star away before it's actually finished riding the track. End
            // lands partway into this panel's own pin, not at its very start.
            let fallFrom: Point | null = null;
            ScrollTrigger.create({
              id: "guidestar-panel0fall",
              start: () => {
                const r = trackEl!.getBoundingClientRect();
                return r.bottom + window.scrollY - window.innerHeight * 0.55;
              },
              end: () => intoPin(panel, ARRIVE_INTO_PIN),
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
          stageA(i, prevPanel, prevBorder, () => fallFrom, (v) => { fallFrom = v; });
          stageB(i, prevPanel, panel, thisBorder, () => fallFrom);
        });

        // Fades the last panel's border out during ITS OWN pin tail, same
        // pattern as stageA, so it doesn't linger lit once Also-shipped's stars
        // have already taken over.
        const lastPanelBorder = panels.length ? projectBorderTarget(panels[panels.length - 1]) : null;
        if (panels.length) {
          const lastPanel = panels[panels.length - 1];
          ScrollTrigger.create({
            id: "guidestar-lastpanel",
            trigger: lastPanel,
            start: () => intoPin(lastPanel, ARRIVE_INTO_PIN),
            end: () => intoPin(lastPanel, 1),
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
          targets.forEach((t, i) => {
            if (!stars[i]) return;
            stopTwinkle(i);
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
            id: "guidestar-grid",
            trigger: gridEl,
            start: () => atViewportTop(gridEl, 0.65),
            end: () => atViewportBottom(gridEl, 0.35),
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
            id: "guidestar-skills",
            trigger: skillsEl,
            start: () => atViewportTop(skillsEl, 0.65),
            end: () => atViewportBottom(skillsEl, 0.35),
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
            id: "guidestar-contact",
            trigger: contactEl,
            start: () => atViewportTop(contactEl, 0.85),
            end: () => atViewportTop(contactEl, 0.45),
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
