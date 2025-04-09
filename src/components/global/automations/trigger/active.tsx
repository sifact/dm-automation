import { TinyInstagram, TinyMessenger, TinyWhatsApp, TinyFacebook, PlaneBlue } from "@/icons";
import { INTEGRATIONS } from "@prisma/client";
import React from "react";

type Props = {
  type: string;
  platform: INTEGRATIONS;
  keywords: {
    id: string;
    word: string;
    automationId: string | null;
  }[];
};

const ActiveTrigger = ({ keywords, type, platform }: Props) => {
  const getTriggerIcon = () => {
    switch (platform) {
      case "INSTAGRAM":
        return <TinyInstagram />;
      case "MESSENGER":
        return <TinyMessenger />;
      case "WHATSAPP":
        return <TinyWhatsApp />;
      case "FACEBOOK":
        return <TinyFacebook />;
      default:
        return <PlaneBlue />;
    }
  };

  const getTriggerText = () => {
    if (type === "COMMENT") {
      return "User comments on my post.";
    }
    switch (platform) {
      case "INSTAGRAM":
        return "User sends me a direct message.";
      case "MESSENGER":
        return "User sends a Messenger message.";
      case "WHATSAPP":
        return "User sends a WhatsApp message.";
      case "FACEBOOK":
        return "User sends a Facebook message.";
      default:
        return "User sends a message.";
    }
  };

  return (
    <div className="bg-background-80 p-3 rounded-xl w-full">
      <div className="flex gap-x-2 items-center">
        {getTriggerIcon()}
        <p className="text-lg">{getTriggerText()}</p>
      </div>
      <p className="text-text-secondary">
        {type === "COMMENT"
          ? "If the user comments on a post that is setup to listen for keywords, this automation will fire"
          : "If the user sends a message that contains a keyword, this automation will fire"}
      </p>
      <div className="flex ga-2 mt-5 flex-wrap">
        {keywords.map((word) => (
          <div key={word.id} className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] flex items-center gap-x-2 capitalize text-white font-light py-1 px-4 rounded-full">
            <p>{word.word}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveTrigger;
