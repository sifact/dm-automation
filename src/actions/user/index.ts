"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createUser, findUser, updateSubscription } from "./queries";
import { refreshToken } from "@/lib/fetch";
import { updateIntegration } from "../integrations/queries";
import { stripe } from "@/lib/stripe";

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  // console.log(user, "user");

  return user;
};

export const onBoardUser = async () => {
  const user = await onCurrentUser();

  try {
    await createUser(user.id, user?.firstName || "", user?.lastName || "", user?.emailAddresses[0].emailAddress);
  } catch (error) {
    console.error("Error in onBoardUser:", error);
  }

  try {
    const found = await findUser(user.id);
    console.log(found, "found");
    if (found) {
      // Handle token refresh logic here...

      return {
        status: 200,
        data: {
          firstname: found?.firstname,
          lastname: found?.lastname,
          // ... other user data
        },
      };
    }

    // If user not found, return appropriate status
    return {
      status: 404,
      data: null,
    };
  } catch (error) {
    console.error("Error in onBoardUser:", error);
    return {
      status: 500,
      data: null,
    };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();
  try {
    const profile = await findUser(user.id);
    if (profile) return { status: 200, data: profile };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const onSubscribe = async (session_id: string) => {
  const user = await onCurrentUser();
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session) {
      const subscribed = await updateSubscription(user.id, {
        customerId: session.customer as string,
        plan: "PRO",
      });

      if (subscribed) return { status: 200 };
      return { status: 401 };
    }
    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};
