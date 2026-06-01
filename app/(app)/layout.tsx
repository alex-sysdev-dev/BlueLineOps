import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AgentWidget from "@/components/agent/AgentWidget";
import ViewOnlyBanner from "@/components/layout/ViewOnlyBanner";
import { getAssociateSkillMatrix } from "@/lib/queries/associates";
import { resolveAssociateLinks } from "@/lib/calculations/associates";
import { getAppAccessRoleForEmail, isLocalDevPlatformAccessEnabled } from "@/lib/enterprise-access";
import { createSupabaseAuthServerClient } from "@/lib/supabase-auth-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const matrixRows = await getAssociateSkillMatrix();
  const associateLinks = resolveAssociateLinks(matrixRows);
  const cookieStore = await cookies();
  const supabase = createSupabaseAuthServerClient(
    () => cookieStore.getAll(),
    () => {}
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = isLocalDevPlatformAccessEnabled()
    ? "admin"
    : getAppAccessRoleForEmail(user?.email);

  if (!role) {
    redirect("/login?mode=enterprise");
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar associateLinks={associateLinks} accessRole={role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar accessRole={role} />
        <ViewOnlyBanner role={role} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AgentWidget />
    </div>
  );
}
