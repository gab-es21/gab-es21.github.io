import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CodeIcon, CpuIcon, ServerIcon, DatabaseIcon, BotIcon } from "@/components/ui/Icons";
import { skillGroups } from "@/data/skills";
import type { ComponentType, SVGProps } from "react";

const groupIcons: ComponentType<SVGProps<SVGSVGElement>>[] = [CodeIcon, CpuIcon, ServerIcon, DatabaseIcon, BotIcon];

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <FadeInReveal>
        <SectionHeading eyebrow="Toolbox" title="Core Technologies" />
      </FadeInReveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {skillGroups.map((group, i) => {
          const Icon = groupIcons[i % groupIcons.length];
          return (
            <FadeInReveal key={group.label} delay={(i % 2) * 0.08}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white/90">{group.label}</p>
                  <p className="mt-1 text-sm text-white/55">{group.items.join(" · ")}</p>
                </div>
              </div>
            </FadeInReveal>
          );
        })}
      </div>

      <FadeInReveal delay={0.1} className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 font-mono text-sm">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-xs text-white/40">terminal</span>
          </div>
          <div className="space-y-2 p-5 text-white/70">
            <p>
              <span className="text-cyan-400">$</span> whoami
            </p>
            <p className="text-white/50">gabriel@dev:~$ AI Systems Engineer — Lisbon, PT</p>
            <p className="pt-2">
              <span className="text-cyan-400">$</span> stack --core
            </p>
            <p className="text-white/50">Python · TypeScript · FastAPI · React · LLMs · RAG</p>
            <p className="pt-2">
              <span className="text-cyan-400">$</span> status
            </p>
            <p className="text-white/50">Open to remote &amp; EU relocation ✓</p>
          </div>
        </div>
      </FadeInReveal>
    </section>
  );
}
