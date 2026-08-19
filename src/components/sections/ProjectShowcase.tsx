"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsapConfig";
import { PinnedPanel } from "@/components/motion/PinnedPanel";
import { featuredProjects } from "@/data/timeline";
import type { ProjectEntry } from "@/lib/types";

function buildLinks(entry: ProjectEntry) {
  const links: { label: string; href: string }[] = [];
  if (entry.links?.live) links.push({ label: "Visit live site", href: entry.links.live });
  if (entry.links?.docs) links.push({ label: "Docs & demo", href: entry.links.docs });
  if (entry.links?.repo) links.push({ label: "View repo", href: entry.links.repo });
  return links;
}

function VideoPanel({ src }: { src: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video
        src={src}
        controls
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function SeaTurtleStatPanel() {
  const numRef = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { value: 0 };
        gsap.to(counter, {
          value: 95.5,
          duration: 1.6,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
          onUpdate: () => {
            if (numRef.current) numRef.current.textContent = counter.value.toFixed(1);
          },
        });
      });

      return () => mm.revert();
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
      <p className="text-sm uppercase tracking-widest text-white/50">Model performance</p>
      <p className="mt-3 flex items-baseline gap-2 text-6xl font-extrabold text-cyan-400 md:text-7xl">
        <span ref={numRef}>0.0</span>
        <span className="text-2xl font-bold text-white/60 md:text-3xl">% mAP50</span>
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/50">
        {["Drone Imagery", "Dataset Curation", "YOLOv9c"].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-2">
            <span className="rounded-full border border-white/15 px-3 py-1.5">{step}</span>
            {i < arr.length - 1 && <span className="text-white/30">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChatbotCtaPanel({ liveUrl }: { liveUrl: string }) {
  const label = liveUrl.replace("https://", "");
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 truncate text-xs text-white/40">{label}</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 p-10 text-center md:p-14">
        <p className="text-sm uppercase tracking-widest text-white/50">Live &amp; grounded</p>
        <p className="text-lg text-white/70">
          Ask about candidates, polls, and platforms — every answer cites its source.
        </p>
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
        >
          Visit {label}
        </a>
      </div>
    </div>
  );
}

function ProjectMedia({ entry }: { entry: ProjectEntry }) {
  if (entry.media?.type === "video" && entry.media.src) {
    return <VideoPanel src={entry.media.src} />;
  }
  if (entry.id === "proj-sea-turtles") return <SeaTurtleStatPanel />;
  if (entry.id === "proj-chatbot" && entry.links?.live) {
    return <ChatbotCtaPanel liveUrl={entry.links.live} />;
  }
  return null;
}

export function ProjectShowcase() {
  return (
    <div id="projects">
      {featuredProjects.map((entry, i) => (
        <PinnedPanel
          key={entry.id}
          id={entry.id}
          eyebrow={entry.dateLabel}
          title={entry.title}
          description={entry.description}
          tech={entry.tech}
          links={buildLinks(entry)}
          media={<ProjectMedia entry={entry} />}
          reverse={i % 2 === 1}
        />
      ))}
    </div>
  );
}
