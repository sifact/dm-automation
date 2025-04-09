import { onCurrentUser } from "@/actions/user";
import { updateUser } from "@/actions/user/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { redirect } from "next/navigation";

export default async function CompleteProfile() {
  // Ensure user is authenticated
  const user = await onCurrentUser();

  // Function to handle profile completion
  async function completeProfile(formData: FormData) {
    "use server";
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    if (!firstName || !lastName) {
      // Instead of returning an error object, you could:
      // 1. Log the error
      console.error("First name and last name are required");
      // 2. Return early without redirecting
      return;
    }

    // Update the user profile with first name and last name
    await updateUser(user.id, {
      firstname: firstName,
      lastname: lastName,
    });

    // Redirect to the dashboard
    redirect(`/dashboard/${firstName}${lastName}`);
  }

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Please provide your first and last name to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeProfile}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" placeholder="Enter your first name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" placeholder="Enter your last name" required />
              </div>
            </div>
            <Button className="w-full mt-6" type="submit">
              Complete Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
