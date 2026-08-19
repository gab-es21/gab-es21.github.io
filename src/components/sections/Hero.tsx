"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsapConfig";
import { site } from "@/data/site";
import { ChevronDownIcon } from "@/components/ui/Icons";

export function Hero() {
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = taglineRef.current;
      if (!el) return;

      let i = 0;
      const tl = gsap.timeline({ repeat: -1 });
      site.taglines.forEach(() => {
        tl.to(el, { opacity: 0, y: -8, duration: 0.4, ease: "power1.in" })
          .call(() => {
            i = (i + 1) % site.taglines.length;
            el.textContent = site.taglines[i];
          })
          .fromTo(el, { y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" })
          .to({}, { duration: 1.8 });
      });

      gsap.to(scrollCueRef.current, {
        opacity: 0,
        scrollTrigger: { trigger: "body", start: "200px top", end: "400px top", scrub: true },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f2027] via-[#0f2027] to-[#2c5364] px-6 text-center">
      <div className="relative z-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          {site.name}
        </h1>
        <p
          ref={taglineRef}
          className="mx-auto mt-6 max-w-xl font-mono text-lg text-cyan-300 sm:text-xl"
        >
          {site.taglines[0]}
        </p>
        <p className="mt-4 text-sm text-white/60">
          {site.location} · {site.availability}
        </p>
      </div>

      <div
        ref={scrollCueRef}
        className="absolute bottom-10 flex flex-col items-center gap-1 text-white/50"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDownIcon className="h-5 w-5 animate-bounce" />
      </div>
    </section>
  );
}
