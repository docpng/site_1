import type { Metadata } from "next";
import { ProjectCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { listProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div className="container-page py-14">
      <PageTitle title="Projects" subtitle="Everything I've built or am building." />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet">Check back soon.</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
    </div>
  );
}
