import BoardCard from "../components/BoardCard";
import DeltaTMark from "../components/DeltaTMark";
import ContactSection from "../components/ContactSection";
import HeroSection from "../components/HeroSection";
import Meta from "../components/Meta";
import ProjectCard from "../components/ProjectCard";
import SectionHeading from "../components/SectionHeading";
import { boards } from "../data/boards";
import { profile } from "../data/profile";
import { softwareProjects } from "../data/software";

export default function Landing() {
  return (
    <>
      <Meta title={`${profile.name} · hardware and systems`} description={profile.intro} />
      <HeroSection />

      <section id="hardware" className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading
          index={`${boards.length} BOARDS · ${boards.filter((board) => board.fabricated).length} FABRICATED`}
          title="What deltaT means."
        />

        <div className="mb-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <figure className="flex flex-col items-start gap-3">
            <DeltaTMark className="h-20 w-auto text-ink sm:h-24" />
            <figcaption className="kvx-kicker">Master Mark · v5</figcaption>
          </figure>

          <p className="max-w-2xl text-sm text-muted">
            Δt is a difference in time. Here it is the gap in hours between me and the people I am
            chasing: not a claim of ability, an acknowledgement of a distance. A distance with a
            notation is measurable, and what can be measured can be made smaller. Every finished
            board is one step toward <span className="font-mono text-ink">Δt → 0</span>. It is
            spelled <span className="font-mono text-ink">deltaT</span> because GitHub mangles Δt in
            a repository name.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map((board) => (
            <BoardCard key={board.slug} board={board} />
          ))}
        </div>
      </section>

      <section id="software" className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading
          index={`${softwareProjects.length} PROJECTS · ${softwareProjects.filter((project) => project.successorOf).length} REBUILT`}
          title="Rebuilt when rebuilding was the point."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {softwareProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading title="Where the time went." />
        <ol className="space-y-4">
          {profile.timeline.map((entry, index) => (
            <li key={entry.period} className="flex flex-wrap gap-4 border-t border-line pt-4">
              <time className="flex w-24 items-center gap-2 font-mono text-xs text-muted">
                {index === 0 && <span aria-hidden="true" className="kvx-pad bg-accent" />}
                {entry.period}
              </time>
              <div>
                <strong className="block">{entry.title}</strong>
                <span className="text-sm text-muted">{entry.note}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ContactSection />
    </>
  );
}
