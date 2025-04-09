import { INTEGRATIONS } from "@prisma/client";
import Trigger from "./trigger";

const Automation = ({ id, platform }: { id: string; platform: INTEGRATIONS }) => {
  // Ensure platform is a valid INTEGRATIONS value
  const validPlatform = Object.values(INTEGRATIONS).includes(platform) ? platform : INTEGRATIONS.INSTAGRAM;

  return (
    <div className="flex flex-col gap-y-4">
      <Trigger id={id} platform={validPlatform} />
      {/* ... other components */}
    </div>
  );
};

export default Automation;
