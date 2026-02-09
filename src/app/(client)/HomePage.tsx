"use client";
import Contact from "@/components/client/home/Contact";
import Hero from "@/components/client/home/Hero";
import Projects from "@/components/client/home/Projects";
import Stack from "@/components/client/home/Stack";

const HomePage = () => {
  return (
    <>
      <section className="h-full">
        <Hero />
      </section>
      <section className="h-full" id="stack">
        <Stack />
      </section>
      <section className="h-full" id="projects">
        <Projects />
      </section>
      <section className="h-full" id="contact">
        <Contact />
      </section>
    </>
  );
};

export default HomePage;
