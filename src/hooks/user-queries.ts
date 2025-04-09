import { getAllAutomations, getAutomationInfo, getFacebookPagePosts, getProfilePosts, getAutomation } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import { INTEGRATIONS } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export const useQueryAutomations = (platform: INTEGRATIONS) => {
  return useQuery({
    queryKey: ["user-automations", platform],
    queryFn: () => getAllAutomations(platform),
    enabled: !!platform, // Only run query if platform is provided
  });
};

export const useQueryAutomation = (id: string) => {
  return useQuery({
    queryKey: ["automation-info", id],
    queryFn: async () => {
      const response = await getAutomation(id);
      if (response.status === 200) {
        return response.data;
      }
      throw new Error("Failed to fetch automation");
    },
    enabled: !!id,
  });
};

export const useQueryUser = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });
};

export const useQueryAutomationPosts = () => {
  const fetchPosts = async () => await getFacebookPagePosts(); // getProfilePosts()
  return useQuery({
    queryKey: ["instagram-media"],
    queryFn: fetchPosts,
  });
};
