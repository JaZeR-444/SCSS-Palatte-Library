import { redirect } from "next/navigation";

// Projects + Collections are now one surface at /workspaces.
export default function ProjectsRedirect() {
  redirect("/workspaces");
}
