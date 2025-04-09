import { Input } from "@/components/ui/input";
import { useKeywords } from "@/hooks/use-automations";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { useQueryAutomation } from "@/hooks/user-queries";
import { PencilIcon, X } from "lucide-react";
import React, { useState } from "react";

type Props = {
  id: string;
};

export const Keywords = ({ id }: Props) => {
  const { onValueChange, keyword, onKeyPress, deleteMutation, updateKeyword } = useKeywords(id);
  const { data } = useQueryAutomation(id);
  const { latestVariable } = useMutationDataState(["add-keyword"]);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditStart = (word: string, keywordId: string) => {
    setEditingKeywordId(keywordId);
    setEditValue(word);
  };

  const handleEditSubmit = (keywordId: string) => {
    if (editValue.trim()) {
      updateKeyword({ id: keywordId, word: editValue.trim() });
    }
    setEditingKeywordId(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, keywordId: string) => {
    if (e.key === "Enter") {
      handleEditSubmit(keywordId);
    } else if (e.key === "Escape") {
      setEditingKeywordId(null);
      setEditValue("");
    }
  };

  return (
    <div className="bg-background-80 flex flex-col gap-y-3 p-3 rounded-xl">
      <p className="text-sm text-text-secondary">Add words that trigger automations</p>
      <div className="flex flex-wrap justify-start gap-2 items-center">
        {data?.keywords &&
          data?.keywords.map((word: any) => (
            <div className="bg-background-90 flex items-center gap-x-2 capitalize text-text-secondary py-1 px-4 rounded-full" key={word.id}>
              {editingKeywordId === word.id ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, word.id)}
                  onBlur={() => handleEditSubmit(word.id)}
                  className="h-6 w-24 min-w-0 bg-background-100"
                />
              ) : (
                <>
                  <p>{word.word}</p>
                  <button onClick={() => handleEditStart(word.word, word.id)} className="hover:text-primary transition-colors">
                    <PencilIcon size={14} />
                  </button>
                  <button onClick={() => deleteMutation({ id: word.id })} className="hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        <Input value={keyword} onChange={onValueChange} onKeyDown={onKeyPress} placeholder="Type and press enter" className="w-32 h-8 bg-background-100" />
      </div>
    </div>
  );
};

export default Keywords;
