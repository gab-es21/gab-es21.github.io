import { Starfield } from "@/components/motion/Starfield";
import { GuideStar } from "@/components/motion/GuideStar";
import { Intro } from "@/components/sections/Intro";
import { CareerTimeline } from "@/components/sections/CareerTimeline";
import { ProjectShowcase } from "@/components/sections/ProjectShowcase";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      <Starfield />
      <GuideStar />
      <Intro />
      <CareerTimeline />
      <ProjectShowcase />
      <ProjectGrid />
      <Skills />
      <Contact />
    </main>
  );
}
