import type { Metadata } from "next";
import { ProjectCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { text } from "@/lib/content";
import { getSettings, listProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [settings, projects] = await Promise.all([getSettings(), listProjects()]);
  return (
    <div className="container-page py-14">
      <PageHeader title={text(settings, "projects_title")} intro={text(settings, "projects_intro")} banner={text(settings, "projects_banner_url")} />
      {projects.length === 0 ? (
        <EmptyState title={text(settings, "projects_empty")} />
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

