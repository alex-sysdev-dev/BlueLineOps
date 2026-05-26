import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AgentWidget from "@/components/agent/AgentWidget";
import { getAssociateSkillMatrix } from "@/lib/queries/associates";
import { resolveAssociateLinks } from "@/lib/calculations/associates";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const matrixRows = await getAssociateSkillMatrix();
  const associateLinks = resolveAssociateLinks(matrixRows);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar associateLinks={associateLinks} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AgentWidget />
    </div>
  );
}
