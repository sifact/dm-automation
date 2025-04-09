"use client";
import { onOAuthInstagram, onSaveIntegration } from "@/actions/integrations";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/global/loader";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "MESSENGER" | "WHATSAPP" | "FACEBOOK";
};

const IntegrationCard = ({ description, icon, strategy, title }: Props) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!token.trim()) {
        throw new Error("Access token is required");
      }
      return onSaveIntegration(strategy, token);
    },
    onSuccess: async () => {
      setOpen(false);
      setToken("");
      toast.success("Integration connected successfully!");
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const integrated = data?.data?.integrations?.some((integration) => integration.name === strategy);

  const handleSave = () => {
    if (!token.trim()) {
      toast.error("Please enter an access token");
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="border-2 border-[#3352CC] rounded-2xl gap-x-5 p-5 animate-pulse bg-gray-800/20">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#3352CC] rounded-2xl gap-x-5 p-5 flex items-center justify-between hover:bg-[#3352CC]/5 transition-all duration-200">
      <div className="flex items-center gap-x-5 flex-1">
        {icon}
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-[#9D9D9D] text-base">{description}</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={integrated}
            className={`
              rounded-full px-6 py-2 text-lg font-medium transition duration-200
              ${integrated ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-gradient-to-br from-[#3352CC] to-[#1C2D70] hover:opacity-90"}
            `}
          >
            {integrated ? "Connected" : "Connect"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2 text-xl">
              {icon}
              <span>Connect {title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Access Token</label>
              <Input
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-gray-800/30 border-gray-700 focus:border-[#3352CC] transition-all duration-200"
              />
              <p className="text-xs text-gray-400">Please enter your access token to connect your {title} account</p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !token.trim()}
                className="w-full bg-gradient-to-br from-[#3352CC] to-[#1C2D70] hover:opacity-90 transition-all duration-200 text-white"
              >
                {saveMutation.isPending ? <Loader state={true}>Connecting...</Loader> : "Connect"}
              </Button>

              {strategy === "INSTAGRAM" && (
                <Button variant="outline" onClick={() => onOAuthInstagram(strategy)} className="w-full border-gray-700 hover:bg-gray-800/30">
                  Connect with OAuth
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationCard;
