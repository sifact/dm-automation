import { PlaneBlue, SmartAi, TinyInstagram, TinyMessenger, TinyWhatsApp, TinyFacebook } from "@/icons";
import { INTEGRATIONS } from "@prisma/client";
import { v4 } from "uuid";

export type TriggerType = "COMMENT" | "DM";

export type AutomationListenerProps = {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  type: "SMARTAI" | "MESSAGE";
};

export interface AutomationsTriggerProps {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  type: TriggerType;
  platform: INTEGRATIONS;
}

export const AUTOMATION_TRIGGERS: { [K in INTEGRATIONS]: AutomationsTriggerProps[] } = {
  INSTAGRAM: [
    {
      id: v4(),
      label: "User comments on my post",
      icon: <TinyInstagram />,
      description: "Select if you want to automate comments on your post",
      type: "COMMENT",
      platform: "INSTAGRAM",
    },
    {
      id: v4(),
      label: "User sends me a dm with a keyword",
      icon: <TinyInstagram />,
      description: "Select if you want to automate DMs on your profile",
      type: "DM",
      platform: "INSTAGRAM",
    },
  ],
  MESSENGER: [
    {
      id: v4(),
      label: "User sends a message",
      icon: <TinyMessenger />,
      description: "Select if you want to automate Messenger responses",
      type: "DM",
      platform: "MESSENGER",
    },
  ],
  WHATSAPP: [
    {
      id: v4(),
      label: "User sends a WhatsApp message",
      icon: <TinyWhatsApp />,
      description: "Select if you want to automate WhatsApp responses",
      type: "DM",
      platform: "WHATSAPP",
    },
  ],
  FACEBOOK: [
    {
      id: v4(),
      label: "User sends a message",
      icon: <TinyFacebook />,
      description: "Select if you want to automate Facebook messages",
      type: "DM",
      platform: "FACEBOOK",
    },
  ],
};

export const AUTOMATION_LISTENERS: AutomationListenerProps[] = [
  {
    id: v4(),
    label: "Send the user a message",
    icon: <PlaneBlue />,
    description: "Enter the message that you want to send the user.",
    type: "MESSAGE",
  },
  {
    id: v4(),
    label: "Let Smart AI take over",
    icon: <SmartAi />,
    description: "Tell AI about your project. (Upgrade to use this feature)",
    type: "SMARTAI",
  },
];
