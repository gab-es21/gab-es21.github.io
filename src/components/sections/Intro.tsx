"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/components/motion/gsapConfig";
import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { site } from "@/data/site";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/ui/Icons";

export function Intro() {
  const taglineRef = useRef<HTMLParagraphElement>(null);

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
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="intro" className="mx-auto max-w-6xl px-6 pt-32 md:px-10">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[300px_1fr] md:gap-16">
        <div className="md:sticky md:top-24 md:h-fit">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_50px_-15px_rgba(0,247,255,0.3)] backdrop-blur-sm">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10">
              <Image src={site.photo} alt={site.name} fill sizes="300px" className="object-cover" priority />
            </div>
            <h2 className="mt-5 text-xl font-bold">{site.name}</h2>
            <p className="mt-1 text-sm text-cyan-400">{site.role}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{site.shortBio}</p>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="text-white/60 transition hover:text-cyan-400"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="text-white/60 transition hover:text-cyan-400"
              >
                <LinkedInIcon className="h-5 w-5" />
              </a>
              <a href={`mailto:${site.email}`} aria-label="Email" className="text-white/60 transition hover:text-cyan-400">
                <MailIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex min-h-[130vh] flex-col gap-10 pt-4 md:min-h-[150vh] md:pt-10">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              {site.name}
            </h1>
            <p ref={taglineRef} className="mt-6 font-mono text-lg text-cyan-300 sm:text-xl">
              {site.taglines[0]}
            </p>
          </div>

          <FadeInReveal>
            <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">{site.bio}</p>
          </FadeInReveal>

          <FadeInReveal delay={0.1}>
            <p className="text-sm text-white/50">
              {site.location} · {site.availability}
            </p>
          </FadeInReveal>
        </div>
      </div>
    </section>
  );
}
