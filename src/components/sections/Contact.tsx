import { FadeInReveal } from "@/components/motion/FadeInReveal";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/ui/Icons";
import { site } from "@/data/site";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f2027] via-[#0f2027] to-[#2c5364] px-6 py-28 text-center"
    >
      <FadeInReveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Get in touch
        </p>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Let&apos;s build something.</h2>
        <p className="mx-auto mt-4 max-w-md text-white/60">
          Open to remote roles and EU relocation, based in {site.location}.
        </p>
      </FadeInReveal>

      <FadeInReveal delay={0.1}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            <MailIcon className="h-4 w-4" />
            {site.email}
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
          >
            <LinkedInIcon className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
          >
            <GitHubIcon className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </FadeInReveal>

      <p className="mt-16 text-xs text-white/30">
        © {new Date().getFullYear()} {site.name}
      </p>
    </section>
  );
}
