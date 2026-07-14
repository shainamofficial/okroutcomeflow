import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MentionInput } from "./MentionInput";
import { useCreateUpdate } from "@/hooks/useUpdates";
import { Send } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type UpdateKind = Database["public"]["Enums"]["update_kind"];

interface UpdateComposerProps {
  entityType: EntityType;
  entityId: string;
  canPostNonComment: boolean;
}

const updateKindOptions: { value: UpdateKind; label: string }[] = [
  { value: "comment", label: "Comment" },
  { value: "progress", label: "Progress Update" },
  { value: "blocker", label: "Blocker" },
  { value: "decision", label: "Decision" },
];

export function UpdateComposer({
  entityType,
  entityId,
  canPostNonComment,
}: UpdateComposerProps) {
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [updateKind, setUpdateKind] = useState<UpdateKind>("comment");
  const createUpdate = useCreateUpdate();

  const handleContentChange = (value: string, userIds: string[]) => {
    setContent(value);
    setMentionedUserIds(userIds);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    createUpdate.mutate(
      {
        entityType,
        entityId,
        updateKind,
        content: content.trim(),
        mentionedUserIds,
      },
      {
        onSuccess: () => {
          setContent("");
          setMentionedUserIds([]);
          setUpdateKind("comment");
        },
      }
    );
  };

  const availableKinds = canPostNonComment
    ? updateKindOptions
    : updateKindOptions.filter((k) => k.value === "comment");

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <MentionInput
        value={content}
        onChange={handleContentChange}
        placeholder="Write an update... Use @ to mention someone"
        disabled={createUpdate.isPending}
      />
      <div className="flex items-center justify-between gap-2">
        <Select
          value={updateKind}
          onValueChange={(value) => setUpdateKind(value as UpdateKind)}
          disabled={createUpdate.isPending}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableKinds.map((kind) => (
              <SelectItem key={kind.value} value={kind.value}>
                {kind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || createUpdate.isPending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>
    </div>
  );
}
