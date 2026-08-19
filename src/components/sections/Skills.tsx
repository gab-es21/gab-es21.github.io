import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TechTag } from "@/components/ui/TechTag";
import { skillGroups } from "@/data/skills";

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <FadeInReveal>
        <SectionHeading eyebrow="Toolbox" title="Core Technologies" />
      </FadeInReveal>

      <div className="mt-12 space-y-8">
        {skillGroups.map((group, i) => (
          <FadeInReveal key={group.label} delay={i * 0.05}>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
              {group.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <TechTag key={item}>{item}</TechTag>
              ))}
            </div>
          </FadeInReveal>
        ))}
      </div>
    </section>
  );
}
