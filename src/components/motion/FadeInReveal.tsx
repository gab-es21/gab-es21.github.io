"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsapConfig";

interface FadeInRevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Stagger delay (seconds) if used inside a staggered group via `delay`. */
  delay?: number;
  y?: number;
}

export function FadeInReveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  y = 40,
}: FadeInRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mmReduced = gsap.matchMedia();

      mmReduced.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          opacity: 0,
          y,
          duration: 0.8,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      return () => mmReduced.revert();
    },
    { scope: ref }
  );

  const Component = Tag as ElementType;
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
