// import { useState } from "react";

// export const useSaveFlow = () => {
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSave = async (flows: any[], automationId: string) => {
//     try {
//       setIsSaving(true);
//       setError(null);

//       const result = await saveFlows(flows, automationId);

//       if (!result.success) {
//         throw new Error(result.error || "Failed to save flows");
//       }

//       return true;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "An error occurred");
//       return false;
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return {
//     handleSave,
//     isSaving,
//     error,
//   };
// };
