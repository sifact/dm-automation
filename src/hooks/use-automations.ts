import { z } from "zod";
import { createAutomations, deleteKeyword, saveKeyword, saveListener, savePosts, saveTrigger, updateAutomationName, updateKeywordQuery } from "@/actions/automations";
import { useMutationData } from "./use-mutation-data";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useZodForm from "./use-zod-form";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { TRIGGER } from "@/redux/slices/automation";
import { INTEGRATIONS } from "@prisma/client";
import { TriggerType } from "@/constants/automation";
import { useQueryAutomation } from "@/hooks/user-queries";

export const useCreateAutomation = (platform: INTEGRATIONS, id?: string) => {
  const { isPending, mutate } = useMutationData(
    ["create-automation", platform], // Add platform to queryKey
    (data: { name: string; id: string; platform: INTEGRATIONS }) => createAutomations(data.platform, data.id),
    "user-automations"
  );

  const createNewAutomation = (data: { name: string; id: string; createdAt: Date; keywords: any[]; platform: INTEGRATIONS; active: boolean }) => {
    mutate(data);
  };

  return { isPending, mutate: createNewAutomation };
};

export const useEditAutomation = (automationId: string) => {
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const enableEdit = () => setEdit(true);
  const disableEdit = () => setEdit(false);

  const { isPending, mutate } = useMutationData(
    ["update-automation"],
    (data: { name: string }) => updateAutomationName(automationId, { name: data.name }),
    "automation-info",
    disableEdit
  );

  useEffect(() => {
    function handleClickOutside(this: Document, event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node | null)) {
        if (inputRef.current.value !== "") {
          mutate({ name: inputRef.current.value });
        } else {
          disableEdit();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    edit,
    enableEdit,
    disableEdit,
    inputRef,
    isPending,
  };
};

export const useListener = (id: string) => {
  const [listener, setListener] = useState<"MESSAGE" | "SMARTAI" | null>(null);
  const { data } = useQueryAutomation(id);
  const currentMessage = data?.listener?.prompt;

  const promptSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    reply: z.string().optional(),
  });

  const { isPending, mutate } = useMutationData(
    ["create-listener"],
    async (data: { prompt: string; reply?: string }) => {
      const response = await saveListener(id, listener || "MESSAGE", data.prompt, data.reply);
      if (response.status === 200) {
        setListener(null);
        reset();
      }
      return response;
    },
    "automation-info"
  );

  const { mutate: updateMessage } = useMutationData(
    ["update-message"],
    async (data: { prompt: string; reply?: string }) => {
      const response = await saveListener(id, listener || "MESSAGE", data.prompt, data.reply);
      if (response.status === 200) {
        reset();
      }
      return response;
    },
    "automation-info"
  );

  const { errors, onFormSubmit, register, reset, watch } = useZodForm(promptSchema, mutate);

  const onSetListener = (type: "SMARTAI" | "MESSAGE") => setListener(type);

  return {
    onSetListener,
    register,
    onFormSubmit,
    listener,
    isPending,
    errors,
    updateMessage,
    currentMessage,
  };
};

export const useTriggers = (id: string) => {
  const types = useAppSelector((state) => state.AutmationReducer.trigger?.types);

  const dispatch: AppDispatch = useDispatch();

  const onSetTrigger = (type: TriggerType) => dispatch(TRIGGER({ trigger: { type } }));

  const { isPending, mutate } = useMutationData(["add-trigger"], (data: { types: TriggerType[] }) => saveTrigger(id, data.types), "automation-info");

  const onSaveTrigger = () => mutate({ types });
  return { types, onSetTrigger, onSaveTrigger, isPending };
};

export const useKeywords = (id: string) => {
  const [keyword, setKeyword] = useState("");

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const { mutate: addKeywordMutation } = useMutationData(
    ["add-keyword"],
    (data: { keyword: string }) => saveKeyword(id, data.keyword),
    "automation-info",
    () => setKeyword("")
  );

  const { mutate: updateKeyword } = useMutationData(["update-keyword"], (data: { id: string; word: string }) => updateKeywordQuery(data.id, data.word), "automation-info");

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) {
      addKeywordMutation({ keyword: keyword.trim() });
    }
  };

  const { mutate: deleteMutation } = useMutationData(["delete-keyword"], (data: { id: string }) => deleteKeyword(data.id), "automation-info");

  return {
    keyword,
    onValueChange,
    onKeyPress,
    deleteMutation,
    updateKeyword,
  };
};

export const useAutomationPosts = (id: string) => {
  const [posts, setPosts] = useState<
    {
      postid: string;
      caption?: string;
      media: string;
      mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
    }[]
  >([]);

  const onSelectPost = (post: { postid: string; caption?: string; media: string; mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM" }) => {
    setPosts((prevItems) => {
      if (prevItems.find((p) => p.postid === post.postid)) {
        return prevItems.filter((item) => item.postid !== post.postid);
      } else {
        return [...prevItems, post];
      }
    });
  };

  const { mutate, isPending } = useMutationData(
    ["attach-posts"],
    () => savePosts(id, posts),
    "automation-info",
    () => setPosts([])
  );
  return { posts, onSelectPost, mutate, isPending };
};
