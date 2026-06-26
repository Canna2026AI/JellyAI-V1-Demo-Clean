import { redirect } from "next/navigation";
import { getCustomerWebUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

const modules: Record<string, string> = {
  conversations: "conversations",
  agents: "agents",
  channels: "channels",
  wecom: "wecom",
  knowledge: "knowledge",
};

type WorkspacePageProps = {
  searchParams: Promise<{ module?: string }>;
};

export default async function WorkspaceRedirectPage({ searchParams }: WorkspacePageProps) {
  const params = await searchParams;
  const selectedModule = params.module && modules[params.module] ? params.module : "conversations";
  redirect(getCustomerWebUrl(`/?module=${encodeURIComponent(selectedModule)}`));
}
