"use client";

import React, { useEffect, useState } from "react";
import { FacebookPost, FacebookPostsResponse, fetchFacebookPosts } from "@/lib/services/posts";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

interface FacebookPostsProps {
  pageId?: string;
  limit?: number;
}

export const FacebookPosts: React.FC<FacebookPostsProps> = ({ pageId, limit = 10 }) => {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const response = await fetchFacebookPosts(pageId, limit);
        if (response) {
          setPosts(response.data || []);
        } else {
          setError("Failed to load posts");
        }
      } catch (err) {
        setError("Error loading posts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [pageId, limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Facebook Posts</h2>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
                <div className="mt-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">No Facebook Posts Found</h2>
        <p className="text-gray-500 mt-2">We couldn't find any posts from your Facebook page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Facebook Posts</h2>

      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Facebook Post</CardTitle>
            <CardDescription>{formatDate(post.created_time)}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {post.message && <p className="text-sm">{post.message}</p>}

            {post.full_picture && (
              <div className="relative h-[300px] w-full">
                <Image src={post.full_picture} alt="Post image" fill style={{ objectFit: "cover" }} className="rounded-md" />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  Like
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Comment
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
              </div>

              <Link href={post.permalink_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  View on Facebook
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
