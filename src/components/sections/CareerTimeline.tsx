"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsapConfig";
import { career } from "@/data/career";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CareerTimeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top 75%",
            end: "bottom 55%",
            scrub: true,
            onUpdate: (self) => {
              if (progressRef.current) progressRef.current.style.height = `${self.progress * 100}%`;
              if (dotRef.current) dotRef.current.style.top = `${self.progress * 100}%`;

              if (trackRef.current) {
                const trackTop = trackRef.current.getBoundingClientRect().top;
                const trackHeight = trackRef.current.offsetHeight;
                const ballTop = self.progress * trackHeight;

                nodeRefs.current.forEach((node) => {
                  if (!node) return;
                  const nodeTop = node.getBoundingClientRect().top - trackTop;
                  const isCrossed = ballTop >= nodeTop;
                  node.classList.toggle("bg-cyan-400", isCrossed);
                  node.classList.toggle("shadow-[0_0_10px_2px_rgba(0,247,255,0.6)]", isCrossed);
                  node.classList.toggle("bg-white/25", !isCrossed);
                });
              }
            },
          },
        });

        gsap.utils.toArray<HTMLElement>(".career-node").forEach((node) => {
          gsap.from(node, {
            opacity: 0,
            x: -30,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: node,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: trackRef }
  );

  return (
    <section id="career" className="mx-auto max-w-4xl px-6 py-28 md:px-10">
      <SectionHeading eyebrow="Journey" title="Career & Education" />

      <div ref={trackRef} className="relative mt-16 pl-8">
        <div className="absolute bottom-1 left-[4.5px] top-1 w-px bg-white/10" aria-hidden />
        <div
          ref={progressRef}
          className="absolute left-[4.5px] top-1 w-px bg-cyan-400"
          style={{ height: 0 }}
          aria-hidden
        />
        <div
          ref={dotRef}
          className="absolute left-[5px] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(0,247,255,0.6)]"
          style={{ top: 0 }}
          aria-hidden
        />

        <ul className="space-y-16">
          {career.map((entry, index) => (
            <li key={entry.id} className="career-node relative">
              <span
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className={`absolute -left-8 top-1.5 h-2.5 w-2.5 rounded-full bg-white/25 transition-[background-color,box-shadow] duration-300 ${
                  entry.isNow ? "ring-4 ring-cyan-400/25" : ""
                }`}
              />
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
                {entry.dateLabel}
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{entry.role}</h3>
              <p className="mt-1 text-white/60">{entry.subtitle}</p>
              <p className="mt-4 max-w-2xl text-white/70">{entry.description}</p>

              {entry.relatedProjectId && (
                <a
                  href={`#${entry.relatedProjectId}`}
                  className="mt-4 inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  See the resulting project ↓
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
