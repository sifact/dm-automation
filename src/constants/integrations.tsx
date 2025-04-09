import { InstagramDuoToneBlue } from "@/icons";
import { MessengerDuoToneBlue } from "@/icons/messenger-duotone-blue";
import { WhatsAppDuoToneBlue } from "@/icons/whatsapp-duotone-blue";
import { FacebookDuoToneBlue } from "@/icons/facebook-duotone-blue";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
  strategy: "INSTAGRAM" | "MESSENGER" | "WHATSAPP" | "FACEBOOK";
};

export const INTEGRATION_CARDS: Props[] = [
  {
    title: "Connect Facebook",
    description: "Connect your Facebook account to automate posts and messages",
    icon: <FacebookDuoToneBlue />,
    strategy: "FACEBOOK",
  },
  {
    title: "Connect Messenger",
    description: "Connect your Messenger account to automate messages",
    icon: <MessengerDuoToneBlue />,
    strategy: "MESSENGER",
  },
  {
    title: "Connect Instagram",
    description: "Connect your Instagram account to automate DMs and comments",
    icon: <InstagramDuoToneBlue />,
    strategy: "INSTAGRAM",
  },

  {
    title: "Connect WhatsApp",
    description: "Connect your WhatsApp account to automate messages",
    icon: <WhatsAppDuoToneBlue />,
    strategy: "WHATSAPP",
  },
];
