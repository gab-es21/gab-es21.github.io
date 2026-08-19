import Image from "next/image";
import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/data/site";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <FadeInReveal>
        <SectionHeading eyebrow="About" title="Building AI systems that ship." />
      </FadeInReveal>

      <div className="mt-12 grid grid-cols-1 items-center gap-10 md:grid-cols-[220px_1fr] md:gap-14">
        <FadeInReveal>
          <div className="relative mx-auto aspect-[3/3.5] w-48 overflow-hidden rounded-2xl border border-white/10 md:w-full">
            <Image
              src={site.photo}
              alt={site.name}
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </div>
        </FadeInReveal>

        <FadeInReveal delay={0.1}>
          <p className="text-lg leading-relaxed text-white/75 md:text-xl">{site.bio}</p>
        </FadeInReveal>
      </div>
    </section>
  );
}
