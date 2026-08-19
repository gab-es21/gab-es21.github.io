import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TechTag } from "@/components/ui/TechTag";
import { ExternalLinkIcon, LockIcon } from "@/components/ui/Icons";
import { otherProjects } from "@/data/timeline";
import type { ProjectEntry } from "@/lib/types";

function ProjectCard({ entry, delay }: { entry: ProjectEntry; delay: number }) {
  return (
    <FadeInReveal delay={delay} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          {entry.dateLabel}
        </p>
        <h3 className="mt-2 text-xl font-bold">{entry.title}</h3>
        <p className="mt-3 flex-1 text-sm text-white/65">{entry.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {entry.tech.map((t) => (
            <TechTag key={t}>{t}</TechTag>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          {entry.links?.repo && (
            <a
              href={entry.links.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Repo <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          )}
          {entry.links?.live && (
            <a
              href={entry.links.live}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Live <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          )}
          {entry.privateRepo && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
              <LockIcon className="h-3.5 w-3.5" /> Private repo
            </span>
          )}
          {entry.employerProject && (
            <span className="text-xs text-white/40">Employer project</span>
          )}
        </div>
      </div>
    </FadeInReveal>
  );
}

export function ProjectGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28 md:px-10">
      <FadeInReveal>
        <SectionHeading eyebrow="More projects" title="Also shipped" />
      </FadeInReveal>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {otherProjects.map((entry, i) => (
          <ProjectCard key={entry.id} entry={entry} delay={(i % 2) * 0.1} />
        ))}
      </div>
    </section>
  );
}
