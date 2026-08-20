"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsapConfig";
import { TechTag } from "@/components/ui/TechTag";
import { ExternalLinkIcon } from "@/components/ui/Icons";

interface PinnedPanelLink {
  label: string;
  href: string;
}

interface PinnedPanelProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description: string;
  tech?: string[];
  links?: PinnedPanelLink[];
  media: ReactNode;
  /** Flip text/media columns for visual alternation between panels. */
  reverse?: boolean;
}

export function PinnedPanel({
  id,
  eyebrow,
  title,
  description,
  tech,
  links,
  media,
  reverse = false,
}: PinnedPanelProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktopMotion: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobileMotion: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktopMotion } = context.conditions as { desktopMotion: boolean };

          if (desktopMotion) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top top",
                end: "+=55%",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
              },
            });
            tl.from(textRef.current, { opacity: 0, y: 60, duration: 0.4 })
              .from(mediaRef.current, { opacity: 0, scale: 0.92, duration: 0.4 }, "<0.1")
              .to(
                [textRef.current, mediaRef.current],
                { opacity: 0, y: -40, duration: 0.4 },
                "+=0.3"
              );
          } else {
            gsap.from([textRef.current, mediaRef.current], {
              opacity: 0,
              y: 30,
              duration: 0.8,
              stagger: 0.15,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            });
          }
        }
      );

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className="flex min-h-screen items-center py-24 md:py-0"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-16 md:px-10">
        <div
          ref={textRef}
          className={reverse ? "order-2 md:order-2" : "order-2 md:order-1"}
        >
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
              {eyebrow}
            </p>
          )}
          <h3 className="text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h3>
          <p className="mt-5 text-base text-white/70 md:text-lg">{description}</p>

          {tech && tech.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tech.map((t) => (
                <TechTag key={t}>{t}</TechTag>
              ))}
            </div>
          )}

          {links && links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-5">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  {l.label}
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          ref={mediaRef}
          className={reverse ? "order-1 md:order-1" : "order-1 md:order-2"}
        >
          {media}
        </div>
      </div>
    </section>
  );
}
