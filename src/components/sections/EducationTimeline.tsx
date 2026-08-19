"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsapConfig";
import { educationEntries } from "@/data/timeline";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function EducationTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              end: "bottom 60%",
              scrub: true,
            },
          }
        );

        gsap.utils.toArray<HTMLElement>(".edu-node").forEach((node, i) => {
          gsap.from(node, {
            opacity: 0,
            x: -30,
            duration: 0.7,
            delay: i * 0.05,
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
    { scope: containerRef }
  );

  return (
    <section id="education" className="mx-auto max-w-4xl px-6 py-28 md:px-10">
      <SectionHeading eyebrow="Studies" title="Education" />

      <div ref={containerRef} className="relative mt-16 pl-8">
        <div className="absolute bottom-1 left-[3px] top-1 w-px bg-white/10" aria-hidden />
        <div
          ref={lineRef}
          className="absolute bottom-1 left-[3px] top-1 w-px origin-top bg-cyan-400"
          aria-hidden
        />

        <ul className="space-y-16">
          {educationEntries.map((entry) => (
            <li key={entry.id} className="edu-node relative">
              <span className="absolute -left-8 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
                {entry.dateLabel}
              </p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{entry.title}</h3>
              <p className="mt-1 text-white/60">{entry.institution}</p>
              <p className="mt-4 max-w-2xl text-white/70">{entry.description}</p>

              {entry.highlights.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-white/60">
                  {entry.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="text-cyan-400">›</span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}

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
