import { onBoardUser } from "@/actions/user";
import { redirect } from "next/navigation";
import React from "react";

type Props = {};

const Page = async (props: Props) => {
  const user = await onBoardUser();

  // First check if we have valid user data
  if (!user.data) {
    return redirect("/sign-in");
  }

  // Then check if we have firstname and lastname
  if (user?.data?.firstname && user?.data?.lastname) {
    return redirect(`dashboard/${user?.data?.firstname}${user?.data?.lastname}`);
  }

  // If we have a user but no name data, redirect to a profile completion page
  return redirect("/complete-profile");
};

export default Page;
