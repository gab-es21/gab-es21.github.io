"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsapConfig";

const POOL_SIZE = 5;

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
          onLeave: () => {
            // The panel-tracking choreography below assumes each panel stays
            // visually pinned in place long enough for the star to "arrive"
            // -- but PinnedPanel only pins above 768px, so on mobile every
            // panel is continuously scrolling past while the star chases a
            // percentage-based target on it, and the two fall out of sync
            // (confirmed with real scroll gestures: the target goes off-
            // screen and the star effectively stalls). Rather than keep
            // patching a timing model that doesn't fit mobile's non-pinned
            // reality, the journey just ends here on mobile -- settle
            // quietly instead of chasing panels that won't hold still.
            if (window.innerWidth < 768) {
              gsap.to(star0, { opacity: 0, duration: 0.6, ease: "power2.out" });
            }
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
        // PinnedPanel only pins on "(min-width: 768px)" (see its own
        // desktopMotion gate) -- on narrower viewports panels never pin, so
        // there's no 0.55-viewport-height dwell to place a fraction into.
        // Using that same fixed offset on mobile added a phantom ~55vh of
        // scroll distance to every one of these boundaries, breaking the
        // whole panel sequence there. Fall back to a fraction of the panel's
        // OWN natural height instead -- 0 lands at its top, 1 at its bottom,
        // which is the closest mobile equivalent of "pin start" / "pin end".
        function intoPin(panel: HTMLElement, fraction: number) {
          const r = panel.getBoundingClientRect();
          const span = window.innerWidth >= 768 ? window.innerHeight * 0.55 : r.height;
          return r.top + window.scrollY + span * fraction;
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

        // Deferred two frames: every PinnedPanel mounts its own pin (and
        // inserts its own pin-spacer, shifting every panel after it, and in
        // turn everything after all three panels) in a layout effect
        // separate from this component's, which runs earlier in the tree.
        // intoPin()/atViewportTop()/atViewportBottom() are live functions,
        // but a ScrollTrigger only calls them again on its own refresh pass
        // -- and that didn't turn out to reliably happen after every pin was
        // in place either (confirmed: an explicit ScrollTrigger.refresh()
        // call left an already-created trigger's resolved end unchanged,
        // even though calling the same function directly at that same
        // moment returned the correct value). So instead of creating these
        // triggers immediately and hoping a later refresh fixes them,
        // creating them fresh after two animation frames -- by which point
        // every other component's layout effect has already run -- means
        // they resolve correctly from the start.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
        // This effect can run more than once for the same elements (a
        // "reappear" layout-effect path this app hits under Next.js 16 /
        // React 19), and both invocations' deferred callbacks land after
        // pins exist, so both create a full set of these triggers. Kill any
        // previous generation's by id first so exactly one set survives.
        // (fall1/timeline are created synchronously outside this deferred
        // block and aren't affected -- only what's created below is.)
        ScrollTrigger.getAll().forEach((st) => {
          const id = st.vars.id;
          if (typeof id === "string" && id.startsWith("guidestar-") && id !== "guidestar-fall1" && id !== "guidestar-timeline") {
            st.kill();
          }
        });
        // Panel tracking is desktop-only -- see the timeline trigger's
        // onLeave above for why mobile doesn't attempt it.
        if (window.innerWidth >= 768) {
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
        }

        // The journey ends here by design: once the star merges into the
        // last panel's (Chatbot's) border via stageB above, it stays merged
        // -- no further movement, no Also-shipped/Skills/Contact animation.
          });
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
