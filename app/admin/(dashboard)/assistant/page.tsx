import AssistantConsole from "@/components/admin/AssistantConsole";
import { assistantOverview } from "@/lib/assistant-server";

export const dynamic = "force-dynamic";
export default async function AssistantPage() {
  return <div className="mx-auto max-w-6xl"><AssistantConsole initial={await assistantOverview()} /></div>;
}
