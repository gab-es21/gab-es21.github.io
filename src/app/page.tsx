import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { EducationTimeline } from "@/components/sections/EducationTimeline";
import { ProjectShowcase } from "@/components/sections/ProjectShowcase";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <EducationTimeline />
      <ProjectShowcase />
      <ProjectGrid />
      <Skills />
      <Contact />
    </main>
  );
}
