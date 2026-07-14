import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  onSelect: (reactionType: string) => void;
}

const reactions = [
  { type: "thumbs_up", emoji: "👍", label: "Thumbs up" },
  { type: "thumbs_down", emoji: "👎", label: "Thumbs down" },
  { type: "heart", emoji: "❤️", label: "Heart" },
  { type: "celebrate", emoji: "🎉", label: "Celebrate" },
  { type: "thinking", emoji: "🤔", label: "Thinking" },
  { type: "eyes", emoji: "👀", label: "Eyes" },
];

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (reactionType: string) => {
    onSelect(reactionType);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {reactions.map((reaction) => (
            <Button
              key={reaction.type}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-accent"
              onClick={() => handleSelect(reaction.type)}
              title={reaction.label}
            >
              {reaction.emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ReactionButtonProps {
  reactionType: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export function ReactionButton({
  reactionType,
  count,
  isActive,
  onClick,
}: ReactionButtonProps) {
  const reaction = reactions.find((r) => r.type === reactionType);
  if (!reaction) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 px-2 gap-1 text-sm",
        isActive && "bg-accent"
      )}
      onClick={onClick}
    >
      <span>{reaction.emoji}</span>
      <span className="text-xs">{count}</span>
    </Button>
  );
}

export function getReactionEmoji(reactionType: string): string {
  const reaction = reactions.find((r) => r.type === reactionType);
  return reaction?.emoji || "👍";
}
