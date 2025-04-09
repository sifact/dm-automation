"use server";

import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegration } from "./queries";
import { INTEGRATIONS } from "@prisma/client";

export const onOAuthInstagram = (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL as string);
  }
};

export const onSaveIntegration = async (strategy: INTEGRATIONS, token: string) => {
  if (!token.trim()) {
    throw new Error("Access token is required");
  }

  try {
    const user = await onCurrentUser();
    if (!user) {
      throw new Error("User not found");
    }

    const today = new Date();
    const expire_date = today.setDate(today.getDate() + 60);

    const result = await createIntegration(strategy, user.id, token);

    if (!result) {
      throw new Error("Failed to save integration");
    }

    return { status: 200, data: result };
  } catch (error: any) {
    console.error("Error saving integration:", error);
    throw new Error(error.message || "Failed to save integration");
  }
};
