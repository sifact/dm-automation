import React from "react";
import { FacebookPosts } from "@/components/facebook/FacebookPosts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { onCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { findUser } from "@/actions/user/queries";

interface PageProps {
  params: {
    slug: string;
  };
}

const FacebookPostsPage = async ({ params }: PageProps) => {
  // Check if user is authenticated
  const user = await onCurrentUser();
  if (!user.id) {
    return redirect("/sign-in");
  }

  // Get the user's integrations to check if they have Facebook connected
  const profile = await findUser(user.id);
  const hasFacebookIntegration = profile?.integrations?.some((integration) => integration.name === "INSTAGRAM" || integration.name === "FACEBOOK");

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Facebook Page Posts</h1>

      {!hasFacebookIntegration ? (
        <Card>
          <CardHeader>
            <CardTitle>Facebook Not Connected</CardTitle>
            <CardDescription>You need to connect your Facebook account to view your page posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please go to the Integrations page to connect your Facebook account.</p>
            <a href={`/dashboard/${params.slug}/integrations`} className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Go to Integrations
            </a>
          </CardContent>
        </Card>
      ) : (
        <FacebookPosts />
      )}
    </div>
  );
};

export default FacebookPostsPage;
