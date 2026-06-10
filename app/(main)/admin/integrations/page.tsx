import { readOpConfig } from "@/lib/opConfig";
import { OpenProjectSettings } from "@/components/admin/OpenProjectSettings";

export const dynamic = "force-dynamic";

export default function AdminIntegrationsPage() {
  const cfg = readOpConfig();
  return (
    <OpenProjectSettings
      initialBaseUrl={cfg.baseUrl}
      hasApiKey={!!cfg.apiKey}
    />
  );
}
