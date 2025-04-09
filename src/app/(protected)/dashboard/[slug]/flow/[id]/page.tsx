import FlowBuilder from "@/components/global/automations/flow/FlowBuilder";
import { INTEGRATIONS } from "@prisma/client";
import { Bot } from "lucide-react";

// Helper to validate platform
const isValidPlatform = (platform: string | undefined): platform is INTEGRATIONS => {
  return !!platform && Object.values(INTEGRATIONS).includes(platform.toUpperCase() as INTEGRATIONS);
};

const FlowPage = ({ params, searchParams }: { params: { id: string }; searchParams: { platform: string } }) => {
  const platformParam = searchParams.platform?.toUpperCase();
  const platform = isValidPlatform(platformParam) ? platformParam : INTEGRATIONS.FACEBOOK; // Validate and default
  const id = params.id;

  return (
    <div className="flex flex-col gap-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-x-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Flow Builder</h1>
          <p className="text-sm text-muted-foreground">
            Platform: <span className="capitalize">{platform.toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Flow Builder */}
      <div className="w-full h-[calc(100vh-200px)]">
        <FlowBuilder id={id} platform={platform} />
      </div>
    </div>
  );
};

export default FlowPage;
