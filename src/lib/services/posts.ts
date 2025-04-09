import { toast } from "sonner";

export interface FacebookPost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url: string;
  created_time: string;
  attachments?: {
    data: Array<{
      media_type: string;
      url: string;
    }>;
  };
}

export interface FacebookPostsResponse {
  data: FacebookPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

export const fetchFacebookPosts = async (pageId?: string, limit: number = 10): Promise<FacebookPostsResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (pageId) params.append("pageId", pageId);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(`/api/facebook/posts?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.error || "Failed to fetch Facebook posts");
      return null;
    }

    const data = await response.json();
    return data.posts;
  } catch (error) {
    console.error("Error fetching Facebook posts:", error);
    toast.error("Failed to fetch Facebook posts");
    return null;
  }
};
