import { redirect } from "next/navigation";

// The detail view now lives at /workspaces/[slug]. Preserve old project links.
export default async function ProjectDetailRedirect({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  redirect(`/workspaces/${project}`);
}
